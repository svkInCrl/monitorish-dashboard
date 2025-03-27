import psutil
import time
import mysql.connector # type: ignore
from datetime import datetime
from db_config import db_config

# Ignore these system processes
IGNORED_PROCESSES = {
    "mutter-x11-frames", "ibus-x11", "gsd-xsettings", "Xwayland",
    "gnome-session-binary", "pipewire", "dbus-daemon", "systemd",
    "systemd-journald", "systemd-udevd", "snapd", "gvfsd", "upowerd",
    "polkitd", "avahi-daemon", "wpa_supplicant", "bluetoothd"
}

# Ignore system users
IGNORED_USERS = {"root", "dbus", "systemd-resolve", "avahi", "polkitd"}

def connect_db():
    """Establish a database connection."""
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as err:
        print(f"Database Connection Error: {err}")
        return None

def store_process_info(process_data):
    """Insert process static and dynamic info into process_info table."""
    conn = connect_db()
    if not conn:
        return
    else : 
        print("Connection established")

    try:
        cursor = conn.cursor()
        insert_query = """
            INSERT INTO process_info 
            (process_name, path, pid, ppid, active_connections, first_seen)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            ppid = VALUES(ppid),
            active_connections = VALUES(active_connections);
        """  # Updates data if process name and path exist already

        cursor.executemany(insert_query, process_data)
        conn.commit()
        print(f"{len(process_data)} process_info records inserted/updated successfully.")

    except mysql.connector.Error as err:
        print(f"Database Insert Error: {err}")

    finally:
        cursor.close()
        conn.close()

def store_process_resources(resource_data):
    """Insert process resource usage data into process_resources table."""
    conn = connect_db()
    if not conn:
        return

    try:
        cursor = conn.cursor()
        insert_query = """
            INSERT INTO process_resources 
            (pid, cpu_usage, ram_usage, data_sent_mb, data_received_mb, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        cursor.executemany(insert_query, resource_data)
        conn.commit()
        print(f"{len(resource_data)} process_resources records inserted successfully.")

    except mysql.connector.Error as err:
        print(f"Database Insert Error: {err}")

    finally:
        cursor.close()
        conn.close()

def get_process_activity():
    """Fetch process details and store in the database."""
    process_info_data = []
    process_resource_data = []

    for proc in psutil.process_iter(['pid', 'ppid', 'name', 'exe', 'username']):
        try:
            pid = proc.info['pid']
            name = proc.info['name']
            username = proc.info['username']
            path = proc.info['exe'] or "Unknown"

            # Ignore system users and unnecessary processes
            if username in IGNORED_USERS or name in IGNORED_PROCESSES:
                continue

            # Process Information
            active_connections = len(proc.net_connections(kind='inet'))  # Fixed deprecated function

            # Collect info for process_info table
            process_info_data.append((
                name, path, pid, proc.info['ppid'], active_connections, datetime.now()
            ))

            # Resource Usage
            cpu_usage = proc.cpu_percent(interval=1.0)  # Ensures CPU usage is correctly measured
            ram_usage = proc.memory_percent()

            # Skip processes with CPU usage < 0.1%
            if cpu_usage < 0.1:
                continue

            # Get total bytes sent/received and convert to MB
            mb_sent = mb_received = 0
            try:
                io_counters = proc.io_counters()
                mb_sent = io_counters.write_bytes / (1024 * 1024)  # Sent data in MB
                mb_received = io_counters.read_bytes / (1024 * 1024)  # Received data in MB
            except (psutil.AccessDenied, AttributeError):
                pass  # Ignore processes where I/O data is restricted

            # Collect info for process_resources table
            resource_timestamp = datetime.now()
            process_resource_data.append((pid, cpu_usage, ram_usage, mb_sent, mb_received, resource_timestamp))

        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue  # Skip inaccessible processes

    # Batch insert into the database
    if process_info_data:
        store_process_info(process_info_data)
    if process_resource_data:
        store_process_resources(process_resource_data)

def main():
    print("Monitoring Important Process Activity & Storing in Database...")
    while True:
        get_process_activity()
        time.sleep(10)  # Refresh every 10 seconds

if __name__ == "__main__":
    main()
