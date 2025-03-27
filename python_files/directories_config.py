import re
import os
import mysql.connector 
from mysql.connector import Error
from time import sleep

# Database connection details
DB_CONFIG = {
    "host": "localhost",
    "user": "admin",
    "password": "password",
    "database": "Threat_Erase"
}

# Default log file paths
DEFAULT_LOG_PATHS = {
    "auth.log": "/var/log/auth.log",
    # "syslog": "/var/log/syslog",
    "boot.log": "/var/log/boot.log",
    "kern.log": "/var/log/kern.log",
    # "mail.log": "/var/log/mail.log",
    # "mail.err": "/var/log/mail.err",
    "cron.log": "/var/log/cron.log",
    # "daemon.log": "/var/log/daemon.log",
    "dpkg.log": "/var/log/dpkg.log",
    "dmesg": "/var/log/dmesg",

}

CONFIG_FILE = "/etc/rsyslog.d/50-default.conf"

# Function to establish a database connection
def connect_db():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error: {e}")
        return None

# Function to initialize database with log paths
def update_database(log_paths):
    connection = connect_db()
    if connection:
        cursor = connection.cursor()
        try:
            for file_name, path in log_paths.items():
                cursor.execute(
                    "REPLACE INTO file_paths (file_name, paths) VALUES (%s, %s)",
                    (file_name, path),
                )
            connection.commit()
        except Error as e:
            print(f"Database error: {e}")
        finally:
            cursor.close()
            connection.close()

# Function to parse the configuration file
def parse_rsyslog_config(config_file, default_paths):
    log_files = default_paths.copy()
    commented_files = set()
    try:
        with open(config_file, "r") as file:
            for line in file:
                stripped_line = line.strip()
                if stripped_line.startswith("#"):
                    match = re.search(r'#.*\s+(-?/?[\w\./-]+)', stripped_line)
                    if match:
                        file_name = os.path.basename(match.group(1).lstrip('-'))
                        if file_name in log_files:
                            commented_files.add(file_name)
                    continue
                match = re.search(r'[^#]*\s+(-?/?[\w\./-]+)', stripped_line)
                if match:
                    log_path = match.group(1).lstrip('-')
                    file_name = os.path.basename(log_path)
                    if file_name in log_files:
                        log_files[file_name] = log_path
        for file_name in commented_files:
            log_files[file_name] = "/var/log/syslog"
        return log_files
    except FileNotFoundError:
        print(f"Error: The file '{config_file}' was not found.")
        return default_paths

# Function to monitor and update database in case of changes
def monitor_changes():
    previous_paths = parse_rsyslog_config(CONFIG_FILE, DEFAULT_LOG_PATHS)
    update_database(previous_paths)
    while True:
        current_paths = parse_rsyslog_config(CONFIG_FILE, DEFAULT_LOG_PATHS)
        if current_paths != previous_paths:
            print("Detected changes in log file paths. Updating database...")
            update_database(current_paths)
            previous_paths = current_paths.copy()
        sleep(10)  # Adjust the interval as needed

if __name__ == "__main__":
    monitor_changes()
