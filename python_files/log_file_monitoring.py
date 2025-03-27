import os
import subprocess
import re
import logging
import time
import datetime
import threading
import mysql.connector # type: ignore
import hashlib
from collections import defaultdict
from dotenv import load_dotenv # type: ignore
from contextlib import contextmanager

# --- Database Configuration ---
DB_CONFIG = {
    'host': os.environ.get('MYSQL_HOST', 'localhost'),
    'user': os.environ.get('MYSQL_USER', 'admin'),
    'password': os.environ.get('MYSQL_PASSWORD', 'password'),
    'database': os.environ.get('MYSQL_DB', 'Threat_Erase_DB')
}

# --- Table Names ---
LOG_TABLE_NAME = 'anomalous_logs'
KEYWORD_TABLE_NAME = 'patterns'
FILE_PATHS_TABLE_NAME = 'file_paths'
LAST_PROCESSED_TABLE_NAME = 'last_processed'

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Global Variables ---
LOG_FILES = {}  # Dictionary to store log file paths (will be fetched from DB)
LOG_FILES_LOCK = threading.Lock()  # Lock for thread-safe access to LOG_FILES
FILE_PATHS_REFRESH_INTERVAL = 60  # Refresh log file paths every 60 seconds
SEEN_LOGS_EXPIRATION_TIME = 86400  # Remove log IDs from seen_logs after 24 hours (in seconds)
FILE_PATHS_TABLE_NAME = 'file_paths'

# --- Utility Functions ---
def calculate_priority(message):
    facility_mapping = {
        "kernel": 0, "user": 1, "mail": 2, "daemon": 3, "auth": 4,
        "syslog": 5, "lpr": 6, "news": 7, "uucp": 8, "cron": 9,
        "authpriv": 10, "ftp": 11, "ntp": 12, "audit": 13, "alert": 14,
        "clock": 15, "local0": 16, "local1": 17, "local2": 18, "local3": 19,
        "local4": 20, "local5": 21, "local6": 22, "local7": 23
    }
    severity_mapping = {
        "emergency": 0, "alert": 1, "critical": 2, "error": 3, "warning": 4,
        "notice": 5, "informational": 6, "debug": 7
    }

    facility = 1  # Default to user-level messages
    severity = 6  # Default to informational

    for keyword in severity_mapping.keys():
        if keyword in message.lower():
            severity = severity_mapping[keyword]
            break

    facility_match = re.search(r'\<([0-9]+)\>', message)
    if facility_match:
        facility = int(facility_match.group(1))

    return facility * 8 + severity

def convert_timestamp(timestamp_str):
    """Convert various timestamp formats to 'YYYY-MM-DD HH:MM:SS'."""
    try:
        # Try ISO 8601 format (including milliseconds and timezone offset)
        dt_obj = datetime.datetime.strptime(timestamp_str[:26], "%Y-%m-%dT%H:%M:%S.%f")
    except ValueError:
        try:
            # Try syslog format (e.g., "Feb 25 16:30:01")
            dt_obj = datetime.datetime.strptime(timestamp_str, "%b %d %H:%M:%S")
            # If the syslog timestamp doesn't include the year, assume it's the current year
            current_year = datetime.datetime.now().year
            dt_obj = dt_obj.replace(year=current_year)
        except ValueError:
            try:
                #Try dpkg.log format
                dt_obj = datetime.datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                # If all fails, return None
                return None

    return dt_obj.strftime("%Y-%m-%d %H:%M:%S")  # Correct timestamp format

def generate_log_id(timestamp, pid, file_name, desc):
    """Generates a unique ID for a log entry."""
    log_string = f"{timestamp}{pid}{file_name}{desc}".encode('utf-8')
    return hashlib.sha256(log_string).hexdigest()

def remove_expired_logs(seen_logs):
    """Removes log IDs from seen_logs that are older than SEEN_LOGS_EXPIRATION_TIME."""
    now = time.time()
    for log_file_name, log_ids in list(seen_logs.items()):  # Iterate over a copy to allow modification
        for log_id, timestamp in list(log_ids.items()):  # Iterate over a copy
            if now - timestamp > SEEN_LOGS_EXPIRATION_TIME:
                del seen_logs[log_file_name][log_id]
                logging.debug(f"Removed expired log ID: {log_id} from {log_file_name}")

def get_boot_id():
    """Gets the current boot ID from /proc/sys/kernel/random/boot_id."""
    try:
        with open("/proc/sys/kernel/random/boot_id", "r") as f:
            boot_id = f.read().strip()
        return boot_id
    except FileNotFoundError:
        logging.warning("Boot ID file not found.  Returning 'unknown'.")
        return "unknown"

def get_boot_time():
    """Gets the boot time from /proc/stat."""
    try:
        with open("/proc/stat", "r") as f:
            for line in f:
                if line.startswith("btime"):
                    return int(line.split()[1])
    except FileNotFoundError:
        logging.error("Cannot find /proc/stat to get boot time.")
        return None
    except Exception as e:
        logging.error(f"Error reading /proc/stat: {e}")
        return None

# --- Parsing Functions ---
def parse_kern_log_line(line, file_name):
    match = re.match(r'^([\d\-T:+\.\+]+)\s+([\w\-\.]+)\s+kernel:\s+(.*)$', line)
    if match:
        timestamp = match.group(1)
        hostname = match.group(2)
        message = match.group(3)
        pid_match = re.search(r'\[([0-9]+)\]', message)
        pid = pid_match.group(1) if pid_match else "N/A"
        priority = calculate_priority(message)
        formatted_timestamp = convert_timestamp(timestamp)
        if formatted_timestamp:
            boot_id = get_boot_id()
            return {
                "timestamp": formatted_timestamp,
                "pid": pid,
                "file_name": file_name,
                "desc": f"{message} [boot_id:{boot_id}]",
                "priority": priority,
                "original_timestamp": timestamp  # Store the extracted timestamp
            }
        else:
            logging.warning(f"Failed to convert ISO timestamp: {timestamp}")
            return None  # Skip if timestamp conversion fails
    return None

def parse_auth_log_line(line, file_name):
    # Try the ISO timestamp format first
    match = re.match(r'^([\d\-T:+\.\+]+)\s+([\w\-\.]+)\s+([\w\[\]:]+):\s+(.*)$', line)
    if match:
        timestamp = match.group(1)
        hostname = match.group(2)
        process = match.group(3)
        message = match.group(4)
        pid_match = re.search(r'\[(\d+)\]', process)  # Extract PID from process string
        pid = pid_match.group(1) if pid_match else "N/A"
        formatted_timestamp = convert_timestamp(timestamp)
        if formatted_timestamp:
            boot_id = get_boot_id()
            return {
                "timestamp": formatted_timestamp,
                "pid": pid,
                "file_name": file_name,
                "desc":  f"{message} [boot_id:{boot_id}]",
                "priority": calculate_priority(message),
                "original_timestamp": timestamp  # Store the extracted timestamp
            }
        else:
            logging.warning(f"Failed to convert ISO timestamp: {timestamp}")
            return None  # Skip if timestamp conversion fails

    # Try the traditional syslog format
    match = re.match(r'^(\w+\s+\d+\s+\d+:\d+:\d+)\s+[\S]+\s+(\S+)(?:\[(\d+)\])?: (.*)$', line)
    if match:
        timestamp = match.group(1)
        process = match.group(2)
        pid = match.group(3) if match.group(3) else "N/A"
        message = match.group(4)
        formatted_timestamp = convert_timestamp(timestamp)
        if formatted_timestamp:
            boot_id = get_boot_id()
            return {
                "timestamp": formatted_timestamp,
                "pid": pid,
                "file_name": file_name,
                "desc":  f"{message} [boot_id:{boot_id}]",
                "priority": calculate_priority(message),
                "original_timestamp": timestamp  # Store the extracted timestamp
            }
        else:
            logging.warning(f"Failed to convert ISO timestamp: {timestamp}")
            return None  # Skip if timestamp conversion fails

    return None

def parse_boot_log_line(line, file_name):
    # Try to match systemd boot log format
    match = re.match(r'^\[ *(OK|FAILED) *\] (Started|Failed to start|Reached) (.+?)\.?$', line)
    if match:
        status, action, description = match.groups()
        # Since boot.log does not provide a timestamp or PID, use boot time
        priority = calculate_priority(description if description else "")
        boot_id = get_boot_id()
        boot_time = get_boot_time()

        if boot_time is not None:
            boot_timestamp = datetime.datetime.fromtimestamp(boot_time).strftime("%Y-%m-%d %H:%M:%S")
            return {
                "timestamp": boot_timestamp,
                "pid": "N/A",
                "file_name": file_name,
                "desc": f"{status} {action} {description} [boot_id:{boot_id}]",
                "priority": priority,
                "original_timestamp": None  # Indicate no timestamp was found
            }
        else:
            logging.warning("Could not get boot time. Skipping boot.log entry.")
            return None

    # If no match is found, still store the boot time
    if line.strip():
        boot_id = get_boot_id()
        boot_time = get_boot_time()
        if boot_time is not None:
            boot_timestamp = datetime.datetime.fromtimestamp(boot_time).strftime("%Y-%m-%d %H:%M:%S")
            return {
                "timestamp": boot_timestamp,
                "pid": "N/A",
                "file_name": file_name,
                "desc": f"{line.strip()} [boot_id:{boot_id}]",
                "priority": calculate_priority(line),
                "original_timestamp": None
            }
        else:
            logging.warning("Could not get boot time. Skipping boot.log entry.")
            return None

    return None

def parse_cron_log_line(line, file_name):
    # More flexible cron log parsing
    match = re.match(r'^([\d\-T:+\.\+]+)\s+([\w\-\.]+)\s+CRON\[(\d+)\]:\s+(.*)$', line)
    if match:
        timestamp = match.group(1)
        hostname = match.group(2)
        pid = match.group(3)
        message = match.group(4)
        user_match = re.search(r'\((\w+)\)', message)
        user = user_match.group(1) if user_match else "unknown"
        command = message.split(')')[1].strip() if user_match else message
        formatted_timestamp = convert_timestamp(timestamp)
        if formatted_timestamp:
            boot_id = get_boot_id()
            return {
                "timestamp": formatted_timestamp,
                "pid": pid,
                "file_name": file_name,
                "desc": f"({user}) {command} [boot_id:{boot_id}]",
                "priority": calculate_priority(message),
                "original_timestamp": timestamp  # Store the extracted timestamp
            }

    # Try a more general syslog format as fallback
    match = re.match(r'^(\w+\s+\d+\s+\d+:\d+:\d+)\s+[\S]+\s+(\S+)(?:\[(\d+)\])?: (.*)$', line)
    if match:
        timestamp = match.group(1)
        process = match.group(2)
        pid = match.group(3) if match.group(3) else "N/A"
        message = match.group(4)
        formatted_timestamp = convert_timestamp(timestamp)
        if formatted_timestamp:
            boot_id = get_boot_id()
            return {
                "timestamp": formatted_timestamp,
                "pid": pid,
                "file_name": file_name,
                "desc": f"{message} [boot_id:{boot_id}]",
                "priority": calculate_priority(message),
                "original_timestamp": timestamp
            }

    return None

def parse_dmesg_log_line(line, file_name):
    match = re.match(r'^\[(\d+\.\d+)\] (.*)$', line)
    if match:
        timestamp_sec, description = match.groups()
        priority = calculate_priority(description)
        boot_id = get_boot_id()
        boot_time = get_boot_time()

        if boot_time is not None:
            # Calculate the absolute timestamp by adding the relative timestamp to the boot time
            absolute_timestamp = datetime.datetime.fromtimestamp(boot_time + float(timestamp_sec)).strftime("%Y-%m-%d %H:%M:%S")

            return {
                "timestamp": absolute_timestamp,
                "pid": "N/A",
                "file_name": file_name,
                "desc": f"{description} [boot_id:{boot_id}]",
                "priority": priority,
                "original_timestamp": timestamp_sec  # Store the extracted timestamp
            }
        else:
            logging.warning("Could not get boot time. Skipping dmesg entry.")
            return None

    # If no relative time is found, store only the boot time
    if line.strip():
        boot_id = get_boot_id()
        boot_time = get_boot_time()
        if boot_time is not None:
            boot_timestamp = datetime.datetime.fromtimestamp(boot_time).strftime("%Y-%m-%d %H:%M:%S")
            return {
                "timestamp": boot_timestamp,
                "pid": "N/A",
                "file_name": file_name,
                "desc": f"{line.strip()} [boot_id:{boot_id}]",
                "priority": calculate_priority(line),
                "original_timestamp": None
            }
        else:
            logging.warning("Could not get boot time. Skipping dmesg entry.")
            return None

    return None

def parse_dpkg_log_line(line, file_name):
    match = re.match(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(\w+)\s+(.*)$', line)
    if match:
        timestamp = match.group(1)
        action = match.group(2)
        message = match.group(3)
        pid_match = re.search(r'\[([0-9]+)\]', message)
        pid = pid_match.group(1) if pid_match else "N/A"
        priority = calculate_priority(message)
        formatted_timestamp = convert_timestamp(timestamp)
        if formatted_timestamp:
            boot_id = get_boot_id()
            return {
                "timestamp": formatted_timestamp,
                "pid": pid,
                "file_name": file_name,
                "desc": f"{action} {message} [boot_id:{boot_id}]",
                "priority": priority,
                "original_timestamp": timestamp  # Store the extracted timestamp
            }
    return None

PARSING_FUNCTIONS = {
    "kern.log": parse_kern_log_line,
    "auth.log": parse_auth_log_line,
    "boot.log": parse_boot_log_line,
    "cron.log": parse_cron_log_line,
    "dmesg": parse_dmesg_log_line,
    "dpkg.log": parse_dpkg_log_line,
}

# --- Database Functions ---
@contextmanager
def get_db_connection():
    """Get a database connection."""
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        yield conn
    except mysql.connector.Error as e:
        logging.error(f"Error connecting to MySQL: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

def fetch_keywords_from_db(cursor, file_name):
    """Fetches keywords from the database for a specific file."""
    try:
        cursor.execute(f"SELECT pattern FROM {KEYWORD_TABLE_NAME} WHERE file_name = %s", (file_name,))
        keywords = [row[0].lower() for row in cursor.fetchall()]
        return keywords
    except mysql.connector.Error as e:
        logging.error(f"Error fetching keywords from {KEYWORD_TABLE_NAME}: {e}")
        return []

def insert_log_entry(cursor, timestamp, pid, file_name, desc, priority, log_id):
    """Inserts a log entry into the database."""
    try:
        cursor.execute(f'''
            INSERT INTO {LOG_TABLE_NAME} (log_id, timestamp, pid, priority, `desc`, file_name)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE timestamp = VALUES(timestamp), priority = VALUES(priority), `desc` = VALUES(`desc`)
        ''', (log_id, timestamp, pid, priority, desc, file_name))
    except mysql.connector.Error as e:
        logging.error(f"Error inserting into {LOG_TABLE_NAME}: {e}")

def log_contains_keyword(log_entry, keywords):
    """Checks if the log entry's description contains any of the keywords."""
    desc = log_entry['desc'].lower()
    for keyword in keywords:
        if keyword in desc:
            return True
    return False

def get_last_processed(cursor, file_name):
    """Retrieves the last processed log_id for a given file."""
    try:
        cursor.execute(f"SELECT last_log_id FROM {LAST_PROCESSED_TABLE_NAME} WHERE file_name = %s", (file_name,))
        result = cursor.fetchone()
        if result:
            return result[0]
        else:
            return None
    except mysql.connector.Error as e:
        logging.error(f"Error fetching last processed log_id for {file_name}: {e}")
        return None

def update_last_processed(cursor, file_name, last_log_id):
    """Updates the last processed log_id for a given file."""
    try:
        cursor.execute(f'''
            INSERT INTO {LAST_PROCESSED_TABLE_NAME} (file_name, last_log_id)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE last_log_id = VALUES(last_log_id)
        ''', (file_name, last_log_id))
    except mysql.connector.Error as e:
        logging.error(f"Error updating last processed log_id for {file_name}: {e}")

def process_log_file(file_path):
    """Processes each log file by parsing lines and inserting relevant entries into the database."""
    file_name = os.path.basename(file_path)
    logging.info(f"Processing log file: {file_name}")
    parsing_function = PARSING_FUNCTIONS.get(file_name, None)
    if not parsing_function:
        logging.warning(f"No parsing function defined for {file_name}. Skipping.")
        return

    # Fetch keywords from the database for the current file
    with get_db_connection() as db_conn:
        if db_conn:
            with db_conn.cursor() as cursor:
                keywords = fetch_keywords_from_db(cursor, file_name)
                last_processed = get_last_processed(cursor, file_name)
                last_log_id = None # last_log_id declaration

                with open(file_path, 'r', errors='ignore') as file:
                    for line in file:
                        log_entry = parsing_function(line, file_name)
                        if log_entry:
                            if log_contains_keyword(log_entry, keywords):
                                log_id = generate_log_id(log_entry['timestamp'], log_entry['pid'], log_entry['file_name'], log_entry['desc'])
                                insert_log_entry(cursor, log_entry['timestamp'], log_entry['pid'], log_entry['file_name'], log_entry['desc'], log_entry['priority'], log_id)
                                last_log_id = log_id # putting last_log_id
            db_conn.commit()  # Commit the transaction after processing the log entry
            # After processing the log file, update the last processed time
            with get_db_connection() as db_conn:
                if db_conn:
                    with db_conn.cursor() as cursor:
                        update_last_processed(cursor, file_name, last_log_id) # updating last_log_id
                    db_conn.commit()

def fetch_log_file_paths_from_db(cursor):
    """Fetches log file paths from the database."""
    try:
        cursor.execute(f"SELECT paths FROM {FILE_PATHS_TABLE_NAME}")
        # Fetch all the paths
        file_paths = [row[0] for row in cursor.fetchall()]
        logging.info(f"Fetched log file paths from database: {file_paths}")
        return file_paths
    except mysql.connector.Error as e:
        logging.error(f"Error fetching file paths from database: {e}")
        return []

def monitor_log_file_paths():
    """Monitors the log file paths in the database and updates LOG_FILES."""
    while True:
        try:
            with get_db_connection() as db_conn:
                if db_conn:
                    with db_conn.cursor() as cursor:
                        file_paths = fetch_log_file_paths_from_db(cursor)
                        # Update LOG_FILES with the fetched paths
                        with LOG_FILES_LOCK:
                            LOG_FILES.clear()  # Clear existing paths
                            for path in file_paths:
                                LOG_FILES[os.path.basename(path)] = path  # Add new paths

                        logging.info(f"Updated log file paths: {LOG_FILES}")

        except Exception as e:
            logging.error(f"Error monitoring log file paths: {e}")

        time.sleep(FILE_PATHS_REFRESH_INTERVAL)

# --- Main Execution ---
def main():
    """Main function to start the log processing."""
    logging.info("Starting log processing...")

    # Start monitoring log file paths in a separate thread
    file_paths_thread = threading.Thread(target=monitor_log_file_paths)
    file_paths_thread.daemon = True
    file_paths_thread.start()

    # Give the monitoring thread some time to fetch initial paths
    time.sleep(5)

    while True:
        # Get the current log files
        with LOG_FILES_LOCK:
            current_log_files = LOG_FILES.copy()  # Copy to avoid thread interference

        # Process each log file
        for file_name, file_path in current_log_files.items():
            process_log_file(file_path)

        # Wait before the next iteration
        time.sleep(60)

if __name__ == "__main__":
    main()
