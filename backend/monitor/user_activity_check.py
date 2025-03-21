import time
import os
import psutil
import subprocess  # For executing shell commands
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from datetime import datetime
import threading
from colorama import Fore, Style, init
import re
from collections import defaultdict
from Xlib import X, display
import Xlib
# from PyQt6.QtCore import pyqtSignal, QThread
disp = display.Display()
root = disp.screen().root

# Initialize colorama for colored terminal output
init()

# Ignore processes known to generate background logs
ignored_processes = {"gnome-shell", "systemd", "snapd"}

# Ignore files with specific extensions or prefixes (common temp/cache files)
ignored_file_extensions = {".sqlite-wal", ".vscdb", ".vscdb-journal", ".tmp", ".log"}
ignored_file_prefixes = {".goutputstream-", "cache-", "tmp-"}  

# Ignore known system/application directories
ignored_directories = {"/.config/", "/.cache/", "/.mozilla/", "/snap/", "/var/log/"}

class ActivityMonitor(threading.Thread):
    # process_activity = pyqtSignal(str)
    # file_activity = pyqtSignal(str)
    # window_activity = pyqtSignal(str)
    
    def __init__(self):
        super().__init__()
        self.previous_processes = set(psutil.process_iter(['pid', 'name']))
        self.observer = None
        self.ignored_files = {'.tmp', '.swp', '.log', '.journal', 'backup~'}  # Common temporary files
        self.process_file_activity = {}  # Track process-related file activity
        # self.critical_files = ['/etc/passwd', '/etc/shadow', '/etc/hosts']  # Example critical files
        # self.file_hashes = self._get_file_hashes()  # Initial file hashes
        self.excluded_processes = ['cpuUsage.sh', 'python3', 'python', 'desktop-launch', 
                                     'WebExtensions', 'Privileged Cont', 'Socket Process', 
                                     'RDD Process', 'pingsender', 'kworker', 'sh', 'sleep','kworker', 'gnome-shell']  # Exclude monitoring processes
        self.aggregation_buffer = {}  # Buffer to hold aggregated messages
        self.aggregation_interval = 5  # Aggregate for 5 seconds
        self.main_processes = {"bash", "python3", "systemd"}
        self.process_count = defaultdict(int)
        
    def run(self):
        self.start_monitoring()
        
    
    def should_ignore_process(self, proc_name):
        process_name = proc_name.lower()

        # Ignore known system background processes
        if process_name in ignored_processes:
            return True

        # Ignore kernel worker threads (e.g., "kworker/14:1-rcu_par_gp")
        if process_name.startswith("kworker/"):
            return True 

        return False
    
    def start_monitoring(self):
        os.system('clear')
        print(f"{Fore.CYAN}=== Activity Monitor Started ==={Style.RESET_ALL}")
        print(f"{Fore.CYAN}Press Ctrl+C to stop monitoring{Style.RESET_ALL}\n")

        print(f"{Fore.YELLOW}=== Application Activity ==={Style.RESET_ALL}")
        app_thread = threading.Thread(target=self.monitor_applications, daemon=True)
        app_thread.start()

        time.sleep(0.5)
        print(f"\n{Fore.YELLOW}=== File Activity ==={Style.RESET_ALL}")
        file_thread = threading.Thread(target = self.start_file_monitoring(), daemon=True)
        file_thread.start()
        
        # Start aggregation thread
        aggregation_thread = threading.Thread(target=self._process_aggregation_buffer, daemon=True)
        aggregation_thread.start()
        
        time.sleep(0.5)
        print(f"\n{Fore.YELLOW}=== Window Activity ==={Style.RESET_ALL}")
        window_thread = threading.Thread(target=self.start_active_window_monitoring, daemon=True)
        window_thread.start()

    def print_app_activity(self, message):
        timestamp = datetime.now().strftime('%H:%M:%S')
        color = Fore.GREEN if "started" in message.lower() else Fore.RED
        print(f"{Fore.WHITE}[{timestamp}] {color}APP: {message}{Style.RESET_ALL}")

    def print_file_activity(self, message):
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"{Fore.WHITE}[{timestamp}] {Fore.CYAN}FILE: {message}{Style.RESET_ALL}")

    def print_security_activity(self, message):
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"{Fore.WHITE}[{timestamp}] {Fore.MAGENTA}SECURITY: {message}{Style.RESET_ALL}")

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
        while True:
            try:
                # Get current running processes
                current_processes = set(psutil.process_iter(['pid', 'name']))

                # Check for newly started applications
                new_processes = current_processes - self.previous_processes
                for process in new_processes:
                    try:
                        app_name = process.info['name']
                        app_pid = process.info['pid']
                        if self.process_count[app_name] == 0 and app_name not in self.excluded_processes and not self.should_ignore_process(app_name):  # Exclude specific processes
                            self.process_count[app_name] = 1
                            self.print_app_activity(f"{app_name} started")
                            self.process_activity.emit(f"{app_name} started")
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass

                # Check for closed applications
                terminated_processes = self.previous_processes - current_processes
                for process in terminated_processes:
                    try:
                        app_pid = process.info['pid']
                        app_name = process.info['name']
                        if self.process_count[app_name] == 1 and app_name not in self.excluded_processes and not self.should_ignore_process(app_name):  # Exclude specific processes
                            self.process_count[app_name] = 0
                            self.print_app_activity(f"{app_name} closed")
                            self.process_activity.emit(f"{app_name} closed")
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass

                # Update previous processes
                self.previous_processes = current_processes

                time.sleep(1)
            except Exception as e:
                print(f"{Fore.RED}Error monitoring applications: {str(e)}{Style.RESET_ALL}")

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
        if any(filename.endswith(ext) for ext in {".sqlite-wal", ".vscdb", ".vscdb-journal", ".tmp", ".log", ".vsctmp"}):
            return True

        # Ignore based on prefix
        if any(filename.startswith(prefix) for prefix in {".goutputstream-", "cache-", "tmp-"}):
            return True

        # Ignore VS Code and other known system directories
        ignored_paths = {"/.config/", "/.gnupg/", "/.local/" , "/.cache/", "/.mozilla/", "/snap/", "/var/log/"}
        if any(ignored_path in file_path for ignored_path in ignored_paths):
            return True

        return False

    def start_file_monitoring(self):
        event_handler = FileSystemEventHandler()
        event_handler.on_created = self.on_created
        event_handler.on_deleted = self.on_deleted
        event_handler.on_modified = self.on_modified
        event_handler.on_moved = self.on_moved

        self.observer = Observer()
        self.observer.schedule(event_handler, path=os.path.expanduser("~"), recursive=True)
        self.observer.start()

    def on_created(self, event):
        file_path = event.src_path
        if self.should_ignore_file(file_path):  # Skip unwanted files
            return
        process_name = self.get_process_name_from_path(file_path)
    
        if process_name == 'System':
            message = f"Created {"folder" if event.is_directory else "file"}: {os.path.basename(file_path)} by {process_name} at {file_path}"
            self.file_activity.emit(message)
            self._aggregate_message('file_activity', message)

    def on_deleted(self, event):
        file_path = event.src_path
        if self.should_ignore_file(file_path):  # Skip unwanted files
            return
        process_name = self.get_process_name_from_path(file_path)
        
        if process_name == 'System':
            message = f"Deleted {"folder" if event.is_directory else "file"}: {os.path.basename(file_path)} by {process_name} at {file_path}"
            self.file_activity.emit(message)
            self._aggregate_message('file_activity', message)

    def on_modified(self, event):
        if event.is_directory:  # Ignore directory modifications
            return
        file_path = event.src_path
        if self.should_ignore_file(file_path):  # Skip unwanted files
            return
        process_name = self.get_process_name_from_path(file_path)
        
        if process_name == 'System':
            message = f"Modified {"folder" if event.is_directory else "file"}: {os.path.basename(file_path)} by {process_name} at {file_path}"
            self.file_activity.emit(message)
            self._aggregate_message('file_activity', message)
            
    def on_moved(self, event):
        if event.is_directory:  # Ignore directory modifications
            return
        file_path = event.src_path
        if self.should_ignore_file(file_path):  # Skip unwanted files
            return
        process_name = self.get_process_name_from_path(file_path)
        
        if process_name == 'System':
            message = f"Moved/Renamed {"folder" if event.is_directory else "file"} : {os.path.basename(file_path)} by {process_name} at {file_path}"
            self.file_activity.emit(message)
            self._aggregate_message('file_activity', message)

    def _aggregate_message(self, log_type, message):
        """Aggregate similar messages."""
        if log_type not in self.aggregation_buffer:
            self.aggregation_buffer[log_type] = []
        self.aggregation_buffer[log_type].append(message)

    def _process_aggregation_buffer(self):
        """Process and print aggregated messages."""
        while True:
            time.sleep(self.aggregation_interval)
            if 'file_activity' in self.aggregation_buffer and len(self.aggregation_buffer['file_activity']) > 0:
                unique_messages = set(self.aggregation_buffer['file_activity'])
                count_messages = len(unique_messages)
                aggregated_message = f"[Aggregated] File activities (count: {count_messages}):\n" + "\n".join(unique_messages)
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

        while True:
            current_window = self.get_active_window_title()
            if not last_window:
                print(f"Active window: {current_window}")  # Initial window
                self.window_activity.emit(f"Active window: {current_window}")
                last_window = current_window
            elif current_window and current_window != last_window:
                print(f"Switched to: {current_window}")  # Window switched
                self.window_activity.emit(f"Switched to: {current_window}")
                last_window = current_window
            time.sleep(1)  # Adjust the polling interval if needed

    def monitor_login_logout(self):
        try:
            # Example using journalctl to filter for login/logout events
            process = subprocess.Popen(
                ['journalctl', '-f', '-k', 'LOGIN', 'LOGOUT'],  # Adjust filter as needed
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            for line in process.stdout:
                if "session opened" in line.lower():
                    self.print_security_activity(f"User logged in: {line.strip()}")
                elif "session closed" in line.lower():
                    self.print_security_activity(f"User logged out: {line.strip()}")
        except Exception as e:
            print(f"{Fore.RED}Error monitoring login/logout: {str(e)}{Style.RESET_ALL}")

    def stop_monitoring(self):
        if self.observer:
            self.observer.stop()
            self.observer.join()
            
    def stop(self):
        self.running = False
        self.quit()
        self.wait()

def main():
    monitor = ActivityMonitor()
    try:
        monitor.start_monitoring()
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n{Fore.CYAN}=== Monitoring Stopped ==={Style.RESET_ALL}")
        monitor.stop_monitoring()

if __name__ == "__main__":
    main()

