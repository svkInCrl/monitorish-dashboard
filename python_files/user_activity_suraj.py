import os
import subprocess
import time
import platform
import socket
import psutil
import mysql.connector # type: ignore
import hashlib
from datetime import datetime
import GPUtil # type: ignore
import pwd
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import threading
from colorama import Fore, Style, init
import re
from collections import defaultdict
from Xlib import X, display # type: ignore
import Xlib # type: ignore
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from db_config import db_config

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# Initialize colorama for colored terminal output
init()

# Load configuration from JSON file
CONFIG_FILE = os.environ.get('CONFIG_FILE', 'config.json')
try:
    with open(CONFIG_FILE, 'r') as f:
        config = json.load(f)
except FileNotFoundError:
    print(f"Error: Configuration file '{CONFIG_FILE}' not found. Exiting.")
    exit(1)
except json.JSONDecodeError:
    print(f"Error: Invalid JSON in configuration file '{CONFIG_FILE}'. Exiting.")
    exit(1)

# # Database configuration
# db_config = config.get("database", {})

# # Configure logging
# logging.basicConfig(filename=config.get("log_file", "activity.log"), level=logging.INFO,
#                     format='%(asctime)s - %(levelname)s - %(message)s')

# Configuration variables
EXCLUDED_PROCESS_NAMES = config.get("excluded_processes", [
    "systemd", "gnome-shell", "Xorg", "Xwayland", "ibus-x11",
    "mutter-x11-frames", "gsd-xsettings", "dbus-daemon", "NetworkManager"
])
IGNORED_PROCESSES = set(config.get("ignored_processes", [
    "mutter-x11-frames", "ibus-x11", "gsd-xsettings", "Xwayland",
    "gnome-session-binary", "pipewire", "dbus-daemon", "systemd",
    "systemd-journald", "systemd-udevd", "snapd", "gvfsd", "upowerd",
    "polkitd", "avahi-daemon", "wpa_supplicant", "bluetoothd"
]))
IGNORED_USERS = set(config.get("ignored_users", ["root", "dbus", "systemd-resolve", "avahi", "polkitd"]))
CRITICAL_FILES = config.get("critical_files", ["/etc/passwd", "/etc/shadow", "/etc/hosts"])
AGGREGATION_INTERVAL = config.get("aggregation_interval", 5)
FILE_MONITOR_PATHS = config.get("file_monitor_paths", [os.path.expanduser("~")])
ignored_file_extensions = {".sqlite-wal", ".vscdb", ".vscdb-journal", ".tmp", ".log"}
ignored_file_prefixes = {".goutputstream-", "cache-", "tmp-"}
ignored_directories = {"/.config/", "/.cache/", "/.mozilla/", "/snap/", "/var/log/"}
PROCESS_MONITOR_PERIOD = 1
window_monitor_period = 1
initial_hardware_recorded = False

#Initial displays setup
disp = display.Display()
root = disp.screen().root

class ActivityMonitor:
    def __init__(self):
        self.previous_processes = set(psutil.process_iter(['pid', 'name']))
        self.observer = None
        self.process_file_activity = {}  # Track process-related file activity
        self.file_hashes = self._get_file_hashes()  # Initial file hashes
        self.aggregation_buffer = {}  # Buffer to hold aggregated messages
        self.aggregation_interval = AGGREGATION_INTERVAL  # Aggregate for 5 seconds
        self.main_processes = {"bash", "python3", "systemd"}
        self.process_count = defaultdict(int)
        self.executor = ThreadPoolExecutor(max_workers=4)  # For managing threads
        self.db_conn = self._connect_db()
        self.stop_event = threading.Event()  # Signal threads to stop

    def _connect_db(self):
        """Connect to MariaDB with retry logic."""
        max_retries = 5
        retry_delay = 5
        for attempt in range(max_retries):
            try:
                conn = mysql.connector.connect(**db_config)
                if conn.is_connected():
                    logging.info("Database connection successful!")
                    return conn
            except mysql.connector.Error as err:
                logging.error(f"Database connection attempt {attempt + 1} failed: {err}")
                time.sleep(retry_delay)
        logging.critical("Failed to connect to the database after multiple retries.")
        return None

    def close_db(self):
        """Close database connection."""
        if self.db_conn and self.db_conn.is_connected():
            self.db_conn.close()
            logging.info("Database connection closed.")

    def should_ignore_process(self, proc_name):
        process_name = proc_name.lower()

        # Ignore known system background processes
        if process_name in IGNORED_PROCESSES:
            return True

        # Ignore kernel worker threads (e.g., "kworker/14:1-rcu_par_gp")
        if process_name.startswith("kworker/"):
            return True

        return False

    def start_monitoring(self):
        os.system('clear')
        print(f"{Fore.CYAN}=== Activity Monitor Started ==={Style.RESET_ALL}")
        print(f"{Fore.CYAN}Press Ctrl+C to stop monitoring{Style.RESET_ALL}\n")

        logging.info("Starting all monitors.")

        print(f"{Fore.YELLOW}=== Application Activity ==={Style.RESET_ALL}")
        self.executor.submit(self.monitor_applications)

        time.sleep(0.5)
        print(f"\n{Fore.YELLOW}=== File Activity ==={Style.RESET_ALL}")
        self.executor.submit(self._start_file_monitoring)

        time.sleep(0.5)
        self.executor.submit(self._process_aggregation_buffer)

        time.sleep(0.5)
        print(f"\n{Fore.YELLOW}=== Window Activity ==={Style.RESET_ALL}")
        self.executor.submit(self.start_active_window_monitoring)

        time.sleep(0.5)
        self.executor.submit(self.start_login_logout)

    def print_app_activity(self, message):
        timestamp = datetime.now().strftime('%H:%M:%S')
        color = Fore.GREEN if "started" in message.lower() else Fore.RED
        print(f"{Fore.WHITE}[{timestamp}] {color}APP: {message}{Style.RESET_ALL}")
        logging.info(f"APP Activity: {message}")

    def print_file_activity(self, message):
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"{Fore.WHITE}[{timestamp}] {Fore.CYAN}FILE: {message}{Style.RESET_ALL}")
        logging.info(f"FILE Activity: {message}")

    def print_security_activity(self, message):
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"{Fore.WHITE}[{timestamp}] {Fore.MAGENTA}SECURITY: {message}{Style.RESET_ALL}")
        logging.warning(f"SECURITY Activity: {message}")  # Use logging.warning or logging.error

    def get_process_name_from_path(self, path):
        """Get the process name associated with a file path."""
        try:
            for process in psutil.process_iter(['pid', 'name', 'open_files']):
                try:
                    for file in process.info['open_files']:
                        if file.path in path:
                            return process.info['name']
                except Exception:
                    pass  # Handle exceptions like permission issues
        except Exception:
            pass
        return "System"  # Default to "System" if no process is found

    def monitor_applications(self):
        while not self.stop_event.is_set():  # Check stop signal
            cursor = None
            try:
                # Get current running processes
                current_processes = set(psutil.process_iter(['pid', 'name']))

                # Check for newly started applications
                new_processes = current_processes - self.previous_processes
                for process in new_processes:
                    try:
                        app_name = process.info['name']
                        app_pid = process.info['pid']
                        if self.process_count[app_name] == 0 and app_name not in EXCLUDED_PROCESS_NAMES and not self.should_ignore_process(app_name):  # Exclude specific processes
                            self.process_count[app_name] = 1
                            self.print_app_activity(f"{app_name} started")
                            self._log_user_activity("app_start", f"{app_name} started")
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass

                # Check for closed applications
                terminated_processes = self.previous_processes - current_processes
                for process in terminated_processes:
                    try:
                        app_pid = process.info['pid']
                        app_name = process.info['name']
                        if self.process_count[app_name] == 1 and app_name not in EXCLUDED_PROCESS_NAMES and not self.should_ignore_process(app_name):  # Exclude specific processes
                            self.process_count[app_name] = 0
                            self.print_app_activity(f"{app_name} closed")
                            self._log_user_activity("app_closed", f"{app_name} closed")
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass

                # Update previous processes
                self.previous_processes = current_processes

                time.sleep(PROCESS_MONITOR_PERIOD)
            except Exception as e:
                print(f"{Fore.RED}Error monitoring applications: {str(e)}{Style.RESET_ALL}")
                logging.error(f"Error monitoring applications: {e}")
            finally:
                if self.db_conn and self.db_conn.is_connected() and cursor:
                    cursor.close()

    def is_child_process(self, pid):
        """Check if a process is a child of another running process."""
        try:
            proc = psutil.Process(pid)
            while proc.ppid() != 0:  # Traverse up the parent tree
                parent = psutil.Process(proc.ppid())
                if parent.name().lower() in self.main_processes:
                    return True  # It's a child of a main process
                proc = parent
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
        return False

    def should_ignore_file(self, file_path):
        """Check if the file should be ignored based on known temp files, extensions, or paths."""
        filename = os.path.basename(file_path)

        # Ignore based on extensions
        if any(filename.endswith(ext) for ext in {".sqlite-wal", ".vscdb", ".vscdb-journal", ".tmp", ".log",
                                                   ".vsctmp"}):
            return True

        # Ignore based on prefix
        if any(filename.startswith(prefix) for prefix in {"/.goutputstream-", "cache-", "tmp-"}):
            return True

        # Ignore VS Code and other known system directories
        ignored_paths = {"/.config/", "/.gnupg/", "/.local/", "/.cache/", "/.mozilla/", "/snap/", "/var/log/"}
        if any(ignored_path in file_path for ignored_path in ignored_paths):
            return True

        return False

    def _start_file_monitoring(self):
        """Starts file monitoring."""
        event_handler = FileSystemEventHandler()
        event_handler.on_created = self.on_created
        event_handler.on_deleted = self.on_deleted
        event_handler.on_modified = self.on_modified
        event_handler.on_moved = self.on_moved

        self.observer = Observer()
        for path in FILE_MONITOR_PATHS:
            self.observer.schedule(event_handler, path=path, recursive=True)
        self.observer.start()
        logging.info("File monitoring started.")

    def on_created(self, event):
        if self.should_ignore_file(event.src_path):
            return
        self._log_file_event("created", event.src_path)

    def on_deleted(self, event):
        if self.should_ignore_file(event.src_path):
            return
        self._log_file_event("deleted", event.src_path)

    def on_modified(self, event):
        if event.is_directory or self.should_ignore_file(event.src_path):
            return
        self._log_file_event("modified", event.src_path)

    def on_moved(self, event):
        if self.should_ignore_file(event.src_path):
            return
        self._log_file_event("moved", event.src_path, event.dest_path)

    def _log_file_event(self, event_type, file_path, dest_path=""):
        """Log the file event and store it in the database."""
        process_name = self.get_process_name_from_path(file_path)
        message = ""

        if event_type == "created":
            message = f"File created: {file_path} by {process_name}"
        elif event_type == "deleted":
            message = f"File deleted: {file_path} by {process_name}"
        elif event_type == "modified":
            message = f"File modified: {file_path} by {process_name}"
        elif event_type == "moved":
             message = f"File moved from {file_path} to {dest_path} by {process_name}"

        self._aggregate_message('file_activity', message)
        self._log_user_activity(event_type, message)  # Log to the user_activity table

    def _aggregate_message(self, log_type, message):
        """Aggregate similar messages."""
        if log_type not in self.aggregation_buffer:
            self.aggregation_buffer[log_type] = []
        self.aggregation_buffer[log_type].append(message)

    def _process_aggregation_buffer(self):
        """Process and print aggregated messages."""
        while not self.stop_event.is_set():  # Check stop signal
            time.sleep(self.aggregation_interval)
            if 'file_activity' in self.aggregation_buffer and len(self.aggregation_buffer['file_activity']) > 0:
                unique_messages = set(self.aggregation_buffer['file_activity'])
                count_messages = len(unique_messages)
                aggregated_message = f"[Aggregated] File activities (count: {count_messages}):\n" + "\n".join(
                    unique_messages)
                print(aggregated_message)  # Print aggregated messages

                # Clear the buffer for the next interval
                self.aggregation_buffer['file_activity'] = []

    def get_active_window_title(self):
        """Fetch the title of the currently active window"""
        try:
            disp = display.Display()  # Reinitialize display
            root = disp.screen().root

            window_id = root.get_full_property(disp.intern_atom('_NET_ACTIVE_WINDOW'), X.AnyPropertyType)

            if not window_id or not window_id.value:
                return None  # No active window detected

            window = disp.create_resource_object('window', window_id.value[0])
            title = window.get_full_property(disp.intern_atom('_NET_WM_NAME'), 0)

            if title and title.value:
                return title.value.decode('utf-8')
        except Xlib.error.BadWindow:
            return None  # Ignore BadWindow errors
        except Exception as e:
            print(f"Error getting active window title: {e}")
            return None

        return None

    def start_active_window_monitoring(self):
        last_window = None

        while not self.stop_event.is_set():  # Check stop signal
            current_window = self.get_active_window_title()
            if not last_window:
                print(f"Active window: {current_window}")  # Initial window
                last_window = current_window
            elif current_window and current_window != last_window:
                print(f"Switched to: {current_window}")  # Window switched
                self._log_user_activity("window_switch", f"Switched to: {current_window}")  # Log to database

            last_window = current_window
            time.sleep(window_monitor_period)  # Adjust the polling interval if needed

    def start_login_logout(self):
        while not self.stop_event.is_set():  # Check stop signal
            try:
                # Example using journalctl to filter for login/logout events
                process = subprocess.Popen(
                    ['journalctl', '-f', '-k', 'LOGIN', 'LOGOUT'],  # Adjust filter as needed
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                for line in process.stdout:
                    timestamp = datetime.now()
                    if "session opened" in line.lower():
                        message = f"User logged in: {line.strip()}"
                        self.print_security_activity(message)
                        self._log_user_activity("login", message)
                    elif "session closed" in line.lower():
                        message = f"User logged out: {line.strip()}"
                        self.print_security_activity(message)
                        self._log_user_activity("logout", message)
            except Exception as e:
                print(f"{Fore.RED}Error monitoring login/logout: {str(e)}{Style.RESET_ALL}")
                logging.error(f"Error monitoring login/logout: {e}")

    def _get_file_hash(self, filepath):
        """Calculate SHA256 hash of a file."""
        import hashlib
        hasher = hashlib.sha256()
        try:
            with open(filepath, 'rb') as file:
                while True:
                    chunk = file.read(4096)
                    if not chunk:
                        break
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception as e:
            print(f"Error getting hash for {filepath}: {e}")
            return None

    def _get_file_hashes(self):
        """Get initial hashes for critical files."""
        return {f: self._get_file_hash(f) for f in CRITICAL_FILES}

    def monitor_file_integrity(self):
        """Monitor critical files for changes."""
        while not self.stop_event.is_set():  # Check stop signal
            try:
                for filepath in CRITICAL_FILES:
                    current_hash = self._get_file_hash(filepath)
                    if current_hash and self.file_hashes.get(filepath) != current_hash:
                        message = f"File integrity violation: {filepath} changed!"
                        self.print_security_activity(message)
                        logging.warning(message)
                        self._log_user_activity("file_integrity", message)  # Store in db
                        self.file_hashes[filepath] = current_hash  # Update hash
                time.sleep(60)  # Check every 60 seconds
            except Exception as e:
                print(f"Error monitoring file integrity: {e}")
                logging.error(f"Error monitoring file integrity: {e}")

    def _log_user_activity(self, event_type, message):
        """Logs the security or user activity to the user_activity table."""
        if not self.db_conn:
            logging.error("No database connection to log user activity.")
            return

        try:
            cursor = self.db_conn.cursor()
            query = """
                INSERT INTO user_activity (event_type, message, timestamp)
                VALUES (%s, %s, %s)
                """
            timestamp = datetime.now()
            data = (event_type, message, timestamp)
            cursor.execute(query, data)
            self.db_conn.commit()
            logging.info(f"Logged user activity: {event_type} - {message}")

        except mysql.connector.Error as err:
            logging.error(f"Error logging user activity: {err}")
        finally:
            cursor.close()

    def close_observers(self):
        if self.observer:
            if self.observer.is_alive():
                self.observer.stop()
            self.observer.join()

    def stop_monitoring(self):
        logging.info("Stopping all monitors.")
        self.stop_event.set()  # Signal threads to stop

        self.close_observers()
        # Give threads some time to stop gracefully
        time.sleep(2)
        self.close_db()
        self.executor.shutdown(wait=False) #Do not wait until finish so we don't have KeyboardInterrupt
        logging.info("All monitors stopped.")

def main():
    monitor = ActivityMonitor()
    try:
        if not monitor.db_conn:
            logging.error("Failed to connect to the database. Exiting.")
            exit(1)
        monitor.start_monitoring()
        # Keep the main thread alive to let background threads run
        while True:
            time.sleep(1)  # Reduced sleep time to improve responsiveness to Ctrl+C
    except KeyboardInterrupt:
        print(f"\n{Fore.CYAN}=== Monitoring Stopped ==={Style.RESET_ALL}")
        monitor.stop_monitoring()
    except Exception as e:
        print(f"An error occurred in main: {e}")
        logging.error(f"An error occurred in main: {e}")
    finally:
        if monitor:
            monitor.stop_monitoring()

if __name__ == "__main__":
    main()