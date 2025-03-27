import psutil
import time
import datetime
import json
import subprocess
import os
import mysql.connector
from mysql.connector import Error
import GPUtil
import socket
import platform
import logging
import shutil  # Import shutil module
from db_config import db_config

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define a list of known system process names to exclude
EXCLUDED_PROCESS_NAMES = [
    "systemd", "gnome-shell", "Xorg", "Xwayland", "ibus-x11",
    "mutter-x11-frames", "gsd-xsettings", "dbus-daemon", "NetworkManager"
]

def get_timestamp():
    """Returns the current timestamp."""
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def get_filtered_process_count():
    """Count non-system processes by filtering out system users and excluded processes."""
    filtered_count = 0
    for proc in psutil.process_iter(['name', 'username']):
        try:
            if proc.info['username'] == 'root' or proc.info['name'] in EXCLUDED_PROCESS_NAMES:
                continue
            filtered_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    return filtered_count

def get_system_details():
    """Collects system details and returns them as a dictionary."""
    details = {
        'host_name': socket.gethostname(),
        'interface_count': len(psutil.net_if_addrs()),
        'cpu_count': psutil.cpu_count(logical=True),
        'cpu_freq': psutil.cpu_freq().current,
        'kernel_version': os.uname().release,
        'boot_time': datetime.datetime.fromtimestamp(psutil.boot_time()).strftime('%Y-%m-%d %H:%M:%S'),
        'ram_size': psutil.virtual_memory().total / (1024 ** 3),  # Convert to GB
        'virtual_mem_size': psutil.swap_memory().total / (1024 ** 3),  # Convert to GB
        'gpu_size': None,
        'os_type': platform.system(),
        'os_details': platform.version(),
        'os_release': platform.release(),
        'system_arch': platform.machine(),
        'timestamp': get_timestamp()
    }

    try:
        gpus = GPUtil.getGPUs()
        details['gpu_size'] = gpus[0].memoryTotal if gpus else None
    except ImportError:
        logging.warning("GPUtil not available, GPU size will not be recorded.")

    return details

def store_system_details_in_db(details):
    """Replaces previous system details with the current system details in the database."""
    try:
        with mysql.connector.connect(**db_config) as connection:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM system_details")
                query = """
                INSERT INTO system_details (
                    host_name, interface_count, cpu_count, cpu_freq,
                    kernel_version, boot_time, ram_size, virtual_mem_size, gpu_size,
                    os_type, os_details, os_release, system_arch, timestamp
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                data = (
                    details['host_name'], details['interface_count'], details['cpu_count'],
                    details['cpu_freq'], details['kernel_version'], details['boot_time'],
                    details['ram_size'], details['virtual_mem_size'], details['gpu_size'],
                    details['os_type'], details['os_details'], details['os_release'],
                    details['system_arch'], details['timestamp']
                )
                cursor.execute(query, data)
                connection.commit()
                logging.info("System details updated successfully in the database.")
    except Error as err:
        logging.error(f"Error updating system details: {err}")

def get_network_usage_per_second():
    """
    Fetches network usage (KB sent and received) per second.
    """
    # Measure network usage before and after a 1-second interval
    interval = 1
    
    net_io_start = psutil.net_io_counters()
    bytes_sent_start = net_io_start.bytes_sent
    bytes_recv_start = net_io_start.bytes_recv
    
    time.sleep(interval)
    
    net_io_end = psutil.net_io_counters()
    bytes_sent_end = net_io_end.bytes_sent
    bytes_recv_end = net_io_end.bytes_recv
    
    bytes_sent_diff = bytes_sent_end - bytes_sent_start
    bytes_recv_diff = bytes_recv_end - bytes_recv_start
    
    kb_sent_per_sec = round(bytes_sent_diff / 1024 / interval, 2)
    kb_recv_per_sec = round(bytes_recv_diff / 1024 / interval, 2)

    return {
        "KB Sent Per Second": kb_sent_per_sec,
        "KB Received Per Second": kb_recv_per_sec
    }

def get_system_utilization():
    """Fetches CPU, GPU, RAM, and Disk percentage usage."""
    try:
        return {
            "CPU Usage (%)": psutil.cpu_percent(interval=None),  # Instantaneous CPU usage
            "CPU Per-Core Usage (%)": psutil.cpu_percent(percpu=True, interval=None),  # Instantaneous per-core usage
            "GPU Usage (%)": get_gpu_utilization(),
            "RAM Usage (%)": psutil.virtual_memory().percent,
            "Disk Usage (%)": psutil.disk_usage('/').percent
        }
    except Exception as e:
        logging.error(f"Error fetching system utilization: {e}")
        return {"Error": str(e)}

def get_gpu_utilization():
    """Fetches GPU utilization if an NVIDIA GPU is present."""
    if not shutil.which('nvidia-smi'):
        return "N/A"
    try:
        output = subprocess.check_output(
            "nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits",
            shell=True, text=True
        )
        return int(output.strip())
    except Exception as e:
        logging.error(f"Error fetching GPU utilization: {e}")
        return "N/A"

def create_db_connection():
    """Create and return a database connection."""
    try:
        return mysql.connector.connect(**db_config)
    except Error as e:
        logging.error(f"Error connecting to MariaDB Platform: {e}")
        return None

def insert_data_into_db(connection, data):
    """Insert data into the database."""
    try:
        with connection.cursor() as cursor:
            query = """INSERT INTO system_monitor (timestamp, cpu_usage, gpu_usage, ram_usage, disk_usage, kb_sent, kb_received)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)"""
            formatted_data = (
                data[0],  # timestamp
                float(data[1]) if data[1] != "N/A" else None,  # cpu_usage
                float(data[2]) if data[2] != "N/A" else None,  # gpu_usage
                float(data[3]) if data[3] != "N/A" else None,  # ram_usage
                float(data[4]) if data[4] != "N/A" else None,  # disk_usage
                float(data[5]) if data[5] != "N/A" else None,  # kb_sent
                float(data[6]) if data[6] != "N/A" else None   # kb_received
            )
            cursor.execute(query, formatted_data)
            connection.commit()
    except Error as e:
        logging.error(f"Error inserting data into database: {e}")

def store_data():
    """Fetch system data and store in MariaDB."""
    connection = create_db_connection()
    if connection is None:
        return

    # Fetch and store system details initially
    system_details = get_system_details()
    store_system_details_in_db(system_details)

    try:
        while True:
            # Fetch per-second network usage
            network_data = get_network_usage_per_second()
            system_data = get_system_utilization()
            timestamp = get_timestamp()

            # Prepare data for database insertion (historical)
            db_data = (
                timestamp,
                system_data.get("CPU Usage (%)", "N/A"),
                system_data.get("GPU Usage (%)", "N/A"),
                system_data.get("RAM Usage (%)", "N/A"),
                system_data.get("Disk Usage (%)", "N/A"),
                network_data.get("KB Sent Per Second", "N/A"),
                network_data.get("KB Received Per Second", "N/A")
            )

            # Insert into MariaDB
            insert_data_into_db(connection, db_data)

            # Print output for real-time visibility
            print(json.dumps({
                "Timestamp": timestamp,
                "Network Utilization (Per Second)": network_data,
                "System Utilization": system_data
            }, indent=4))

            # time.sleep(1)  # Refresh every 1 second for real-time monitoring
    except KeyboardInterrupt:
        logging.info("Monitoring stopped by user.")
    finally:
        if connection.is_connected():
            connection.close()
            logging.info("Database connection closed.")

# Start everything
if __name__ == "__main__":
    logging.info("Starting system monitoring...")
    store_data()