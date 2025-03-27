import os
import subprocess
import mysql.connector
from mysql.connector import Error
import hashlib
from datetime import datetime
import pwd
import logging
import re
import json
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time
from collections import defaultdict
import site

# Configure logging to INFO level, console output only
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Database configuration - assumes db_config.py exists
from db_config import db_config

# Utility functions
def generate_software_id(package_manager, sw_name, version="", path=""):
    unique_string = f"{package_manager}_{sw_name}_{version}_{path}"
    return hashlib.sha256(unique_string.encode()).hexdigest()

def get_software_privilege(path):
    if not path:
        return "Not-Found"
    if os.path.exists(path):
        try:
            file_stat = os.stat(path)
            owner = pwd.getpwuid(file_stat.st_uid).pw_name
            return "root" if owner == "root" else f"user ({owner})"
        except KeyError:
            logging.error(f"Privilege check failed for {path}: UID {file_stat.st_uid} not found")
            return "Not-Found (UID unknown)"
        except PermissionError:
            logging.error(f"Privilege check failed for {path}: Permission denied")
            return "Not-Found (Permission denied)"
        except Exception as e:
            logging.error(f"Privilege check failed for {path}: {e}")
            return "Not-Found (Error)"
    return "Not-Found"

def find_binary_path(sw_name):
    try:
        result = subprocess.check_output(["which", sw_name], stderr=subprocess.DEVNULL).decode("utf-8").strip()
        return result if result else ""
    except Exception:
        common_paths = [
            f"/usr/bin/{sw_name}",
            f"/usr/local/bin/{sw_name}",
            f"/opt/{sw_name}/bin/{sw_name}",
            f"/opt/{sw_name}/{sw_name}"
        ]
        for path in common_paths:
            if os.path.exists(path) and os.access(path, os.X_OK):
                return path
        return ""

def get_installation_timestamp(package_manager, sw_name, path=""):
    if package_manager == "dpkg":
        return get_dpkg_installation_timestamp(sw_name, path)
    elif package_manager == "pip":
        return get_pip_installation_timestamp(sw_name, path)
    elif package_manager == "snap":
        return get_snap_installation_timestamp(sw_name, path)
    elif package_manager == "flatpak":
        return get_flatpak_installation_timestamp(sw_name, path)
    elif package_manager == "apt":
        return get_apt_installation_timestamp(sw_name, path)
    else:
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def get_dpkg_installation_timestamp(sw_name, path=""):
    try:
        dpkg_log_files = ["/var/log/dpkg.log", "/var/log/dpkg.log.1"]
        dpkg_log_files += [f"/var/log/dpkg.log.{i}.gz" for i in range(2, 6)]
        for log_file in dpkg_log_files:
            if not os.path.exists(log_file):
                continue
            try:
                if log_file.endswith(".gz"):
                    command = ["zgrep", f" {sw_name} ", log_file]
                else:
                    command = ["grep", f" {sw_name} ", log_file]
                result = subprocess.check_output(command, stderr=subprocess.DEVNULL).decode("utf-8").strip()
                for line in result.split("\n"):
                    if "install" in line:
                        timestamp = " ".join(line.split()[:2])
                        return datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d %H:%M:%S")
            except subprocess.CalledProcessError:
                continue
        info_file = f"/var/lib/dpkg/info/{sw_name}.list"
        if os.path.exists(info_file):
            timestamp = os.path.getmtime(info_file)
            return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    except Exception as e:
        logging.error(f"Error fetching dpkg timestamp for {sw_name}: {e}")
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def get_apt_installation_timestamp(sw_name, path=""):
    try:
        apt_log_files = ["/var/log/apt/history.log", "/var/log/apt/history.log.1"]
        apt_log_files += [f"/var/log/apt/history.log.{i}.gz" for i in range(2, 6)]
        for log_file in apt_log_files:
            if not os.path.exists(log_file):
                continue
            try:
                if log_file.endswith(".gz"):
                    command = ["zgrep", f"Install: .*{sw_name}", log_file]
                else:
                    command = ["grep", f"Install: .*{sw_name}", log_file]
                result = subprocess.check_output(command, stderr=subprocess.DEVNULL).decode("utf-8").strip()
                for line in result.split("\n"):
                    log_content = subprocess.check_output(["grep", "-B", "5", line, log_file], stderr=subprocess.DEVNULL).decode("utf-8").strip()
                    for log_line in log_content.split("\n"):
                        if log_line.startswith("Start-Date:"):
                            date_str = log_line.split(": ", 1)[1].strip()
                            return datetime.strptime(date_str, "%Y-%m-%d  %H:%M:%S").strftime("%Y-%m-%d %H:%M:%S")
            except subprocess.CalledProcessError:
                continue
    except Exception as e:
        logging.error(f"Error fetching apt timestamp for {sw_name}: {e}")
    if path and os.path.exists(path):
        timestamp = os.path.getmtime(path)
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def get_pip_installation_timestamp(sw_name, path=""):
    try:
        result = subprocess.check_output(["pip", "show", sw_name], stderr=subprocess.DEVNULL).decode("utf en8").strip()
        for line in result.split("\n"):
            if line.startswith("Location:"):
                package_location = line.split(": ", 1)[1].strip()
                package_path = os.path.join(package_location, sw_name.lower().replace('-', '_'))
                if os.path.exists(package_path):
                    timestamp = os.path.getmtime(package_path)
                    return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    except Exception as e:
        logging.error(f"Error fetching pip timestamp for {sw_name}: {e}")
    if path and os.path.exists(path):
        timestamp = os.path.getmtime(path)
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def get_snap_installation_timestamp(sw_name, path=""):
    try:
        if path and os.path.exists(path):
            timestamp = os.path.getmtime(path)
            return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
        else:
            snap_path = f"/snap/{sw_name}/current"
            if os.path.exists(snap_path):
                timestamp = os.path.getmtime(snap_path)
                return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    except Exception as e:
        logging.error(f"Error fetching snap timestamp for {sw_name}: {e}")
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def get_flatpak_installation_timestamp(sw_name, path=""):
    try:
        result = subprocess.check_output(["flatpak", "info", sw_name], stderr=subprocess.DEVNULL).decode("utf-8")
        for line in result.split("\n"):
            if "installed:" in line.lower():
                date_str = line.split("installed:", 1)[1].strip()
                try:
                    return datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S").strftime("%Y-%m-%d %H:%M:%S")
                except ValueError:
                    pass
    except Exception as e:
        logging.error(f"Error fetching flatpak timestamp for {sw_name}: {e}")
    if path and os.path.exists(path):
        timestamp = os.path.getmtime(path)
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def get_software_version(package_manager, sw_name, path=""):
    """Retrieve the version of a software based on its package manager."""
    try:
        if package_manager == "dpkg":
            result = subprocess.check_output(["dpkg-query", "-W", "-f=${Version}", sw_name], stderr=subprocess.DEVNULL).decode("utf-8").strip()
            return result if result else "unknown"
        elif package_manager == "pip":
            result = subprocess.check_output(["pip", "show", sw_name], stderr=subprocess.DEVNULL).decode("utf-8")
            for line in result.split("\n"):
                if line.startswith("Version:"):
                    return line.split(": ")[1].strip()
            return "unknown"
        elif package_manager == "snap":
            result = subprocess.check_output(["snap", "list", sw_name], stderr=subprocess.DEVNULL).decode("utf-8")
            lines = result.split("\n")[1:]  # Skip header
            if lines:
                parts = lines[0].split()
                if len(parts) >= 2:
                    return parts[1].strip()
            return "unknown"
        elif package_manager == "flatpak":
            result = subprocess.check_output(["flatpak", "list", "--columns=application,version"], stderr=subprocess.DEVNULL).decode("utf-8")
            for line in result.split("\n"):
                parts = line.split()
                if len(parts) >= 2 and parts[0] == sw_name:
                    return parts[1].strip()
            return "unknown"
        elif package_manager == "manual":
            # For manual installations, try to extract version from binary if possible
            if path and os.path.exists(path):
                try:
                    result = subprocess.check_output([path, "--version"], stderr=subprocess.DEVNULL).decode("utf-8").strip()
                    version_match = re.search(r"(\d+\.\d+\.\d+|\d+\.\d+)", result)
                    return version_match.group(0) if version_match else "unknown"
                except Exception:
                    return "unknown"
        return "unknown"
    except Exception as e:
        logging.error(f"Error fetching version for {sw_name} ({package_manager}): {e}")
        return "unknown"

def get_dpkg_installed_software():
    installed_software = []
    try:
        result = subprocess.check_output(["dpkg-query", "-W", "-f=${Package}|${Version}|${Status}\n"], stderr=subprocess.DEVNULL)
        for line in result.decode("utf-8").strip().split("\n"):
            parts = line.split("|")
            if len(parts) >= 3 and "installed" in parts[2]:
                sw_name = parts[0].strip()
                version = parts[1].strip()
                path = find_binary_path(sw_name)
                if not path:
                    path = f"/var/lib/dpkg/info/{sw_name}.list"
                sw_id = generate_software_id("dpkg", sw_name, version, path)
                privilege = get_software_privilege(path)
                installation_timestamp = get_installation_timestamp("dpkg", sw_name, path)
                installed_software.append((sw_id, "dpkg", sw_name, privilege, path, installation_timestamp, version))
    except Exception as e:
        logging.error(f"Error fetching dpkg installed software: {e}")
    return installed_software

def get_apt_installed_software():
    installed_software = []
    try:
        desktop_dirs = ["/usr/share/applications", "/usr/local/share/applications", "~/.local/share/applications"]
        for directory in desktop_dirs:
            expanded_dir = os.path.expanduser(directory)
            if os.path.exists(expanded_dir):
                for file in os.listdir(expanded_dir):
                    if file.endswith(".desktop"):
                        desktop_file = os.path.join(expanded_dir, file)
                        with open(desktop_file, 'r') as f:
                            content = f.read()
                            name_match = re.search(r"Name=(.*?)(\n|$)", content)
                            if not name_match:
                                continue
                            sw_name = name_match.group(1).strip()
                            exec_match = re.search(r"Exec=(.*?)(\n|$)", content)
                            path = exec_match.group(1).strip().split()[0] if exec_match else ""
                            path = path.split(" %")[0] if " %" in path else path
                            if not path or not os.path.exists(path):
                                path = find_binary_path(sw_name.lower())
                            if not path:
                                continue
                            version = "unknown"
                            sw_id = generate_software_id("apt", sw_name, version, path)
                            privilege = get_software_privilege(path)
                            installation_timestamp = get_installation_timestamp("apt", sw_name, path)
                            installed_software.append((sw_id, "apt", sw_name, privilege, path, installation_timestamp, version))
    except Exception as e:
        logging.error(f"Error fetching apt installed software: {e}")
    return installed_software

def get_pip_installed_software():
    installed_software = []
    try:
        result = subprocess.check_output(["pip", "list", "--format=json"], stderr=subprocess.DEVNULL)
        packages = json.loads(result.decode("utf-8"))
        for package in packages:
            sw_name = package["name"]
            version = package["version"]
            info = subprocess.check_output(["pip", "show", sw_name], stderr=subprocess.DEVNULL).decode("utf-8")
            location = next((line.split(": ")[1].strip() for line in info.split("\n") if line.startswith("Location:")), "N/A")
            path = os.path.join(location, sw_name.lower().replace('-', '_'))
            if not os.path.exists(path):
                path = location
            sw_id = generate_software_id("pip", sw_name, version, path)
            privilege = get_software_privilege(path)
            installation_timestamp = get_installation_timestamp("pip", sw_name, path)
            installed_software.append((sw_id, "pip", sw_name, privilege, path, installation_timestamp, version))
    except Exception as e:
        logging.error(f"Error fetching pip installed software: {e}")
    return installed_software

def get_snap_installed_software():
    installed_software = []
    try:
        result = subprocess.check_output(["snap", "list"], stderr=subprocess.DEVNULL)
        lines = result.decode("utf-8").strip().split("\n")[1:]
        for line in lines:
            parts = line.split()
            if len(parts) >= 2:
                sw_name = parts[0].strip()
                version = parts[1].strip()
                path = f"/snap/{sw_name}/current"
                sw_id = generate_software_id("snap", sw_name, version, path)
                privilege = get_software_privilege(path)
                installation_timestamp = get_installation_timestamp("snap", sw_name, path)
                installed_software.append((sw_id, "snap", sw_name, privilege, path, installation_timestamp, version))
    except Exception as e:
        logging.error(f"Error fetching snap installed software: {e}")
    return installed_software

def get_flatpak_installed_software():
    installed_software = []
    try:
        subprocess.check_output(["which", "flatpak"], stderr=subprocess.DEVNULL)
        result = subprocess.check_output(["flatpak", "list", "--columns=application,version"], stderr=subprocess.DEVNULL)
        lines = result.decode("utf-8").strip().split("\n")
        for line in lines:
            parts = line.split()
            if len(parts) >= 1:
                sw_name = parts[0].strip()
                version = parts[1].strip() if len(parts) > 1 else "unknown"
                path = f"/var/lib/flatpak/app/{sw_name}"
                sw_id = generate_software_id("flatpak", sw_name, version, path)
                privilege = get_software_privilege(path)
                installation_timestamp = get_installation_timestamp("flatpak", sw_name, path)
                installed_software.append((sw_id, "flatpak", sw_name, privilege, path, installation_timestamp, version))
    except Exception as e:
        logging.error(f"Error fetching flatpak installed software: {e}")
    return installed_software

def get_installed_software():
    installed_software = []
    logging.info("Fetching dpkg installed software...")
    installed_software.extend(get_dpkg_installed_software())
    logging.info("Fetching apt installed software...")
    installed_software.extend(get_apt_installed_software())
    logging.info("Fetching pip installed software...")
    installed_software.extend(get_pip_installed_software())
    logging.info("Fetching snap installed software...")
    installed_software.extend(get_snap_installed_software())
    logging.info("Fetching flatpak installed software...")
    installed_software.extend(get_flatpak_installed_software())
    logging.info(f"Total software found: {len(installed_software)}")
    return installed_software

def setup_database():
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS installed_software (
            sw_id VARCHAR(255),
            package_manager VARCHAR(20),
            sw_name VARCHAR(255),
            sw_privilege VARCHAR(50),
            path VARCHAR(255),
            installation_timestamp DATETIME,
            version VARCHAR(50),
            PRIMARY KEY (sw_id)
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS software_monitor (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sw_id VARCHAR(255),
            package_manager VARCHAR(20),
            sw_name VARCHAR(255),
            sw_privilege VARCHAR(50),
            sw_path VARCHAR(255),
            version VARCHAR(50),
            action VARCHAR(20),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        connection.commit()
        logging.info("Database setup completed successfully.")
    except Error as e:
        logging.error(f"Error setting up database: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def initialize_database():
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM installed_software")
        if cursor.fetchone()[0] > 0:
            logging.info("Database already initialized. Skipping initialization.")
            return
        
        software_list = get_installed_software()
        
        insert_query = """
        INSERT IGNORE INTO installed_software (sw_id, package_manager, sw_name, sw_privilege, path, installation_timestamp, version)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.executemany(insert_query, software_list)
        connection.commit()
        
        logging.info(f"Successfully initialized database with {cursor.rowcount} software entries.")
    except Error as e:
        logging.error(f"Error initializing database: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def log_software_changes(sw_id, package_manager, sw_name, sw_privilege, sw_path, version, action):
    """Logs software changes to the database."""
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        insert_query = """
        INSERT INTO software_monitor (sw_id, package_manager, sw_name, sw_privilege, sw_path, version, action)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (sw_id, package_manager, sw_name, sw_privilege, sw_path, version, action))
        connection.commit()
        
        logging.info(f"Logged {action} of {sw_name} ({package_manager}) in software_monitor table.")
    except Error as e:
        logging.error(f"Error logging software change: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

class SoftwareChangeHandler(FileSystemEventHandler):
    """Handles filesystem events to detect software installations/removals."""
    def on_created(self, event):
        if event.is_directory or not event.src_path:
            return
        path = event.src_path
        sw_name = os.path.basename(path).split('.')[0]
        package_manager = self.guess_package_manager(path)
        if package_manager:
            self.log_installation(path, sw_name, package_manager)

    def on_deleted(self, event):
        if event.is_directory or not event.src_path:
            return
        path = event.src_path
        sw_name = os.path.basename(path).split('.')[0]
        package_manager = self.guess_package_manager(path)
        if package_manager:
            self.log_removal(path, sw_name, package_manager)

    def guess_package_manager(self, path):
        """Guesses the package manager based on the path."""
        dpkg_paths = [
            "/bin", "/sbin", "/usr/bin", "/usr/local/bin", "/usr/games",
            "/usr/sbin", "/lib", "/usr/lib", "/lib64", "/usr/lib64",
            "/var/lib/dpkg", "/etc"
        ]
        if any(dpkg_path in path for dpkg_path in dpkg_paths):
            return "dpkg"  # Could also be apt
        
        if "/snap" in path:
            return "snap"
        
        flatpak_paths = ["/var/lib/flatpak", os.path.expanduser("~/.local/share/flatpak")]
        if any(flatpak_path in path for flatpak_path in flatpak_paths):
            return "flatpak"
        
        pip_paths = [
            "/usr/lib/python3/dist-packages", "/usr/local/lib/python3",
            os.path.expanduser("~/.local/lib/python3"), os.path.expanduser("~/.local/bin")
        ]
        if any(pip_path in path for pip_path in pip_paths) or "site-packages" in path or "dist-packages" in path:
            return "pip"
        
        if "/opt" in path:
            return "manual"
        
        return None

    def log_installation(self, path, sw_name, package_manager):
        """Logs a software installation."""
        version = get_software_version(package_manager, sw_name, path)
        sw_id = generate_software_id(package_manager, sw_name, version, path)
        privilege = get_software_privilege(path)
        installation_timestamp = get_installation_timestamp(package_manager, sw_name, path)
        log_software_changes(sw_id, package_manager, sw_name, privilege, path, version, "INSTALLED")

    def log_removal(self, path, sw_name, package_manager):
        """Logs a software removal."""
        version = get_software_version(package_manager, sw_name, path)
        sw_id = generate_software_id(package_manager, sw_name, version, path)
        privilege = get_software_privilege(path) if os.path.exists(path) else "unknown"
        log_software_changes(sw_id, package_manager, sw_name, privilege, path, version, "UNINSTALLED")

def monitor_software_changes():
    """Sets up real-time monitoring using filesystem watchers."""
    directories_to_watch = [
        "/bin", "/sbin", "/usr/bin", "/usr/local/bin", "/usr/games",
        "/usr/sbin", "/lib", "/usr/lib", "/lib64", "/usr/lib64",
        "/var/lib/dpkg/info", "/etc",
        "/snap", "/snap/bin",
        "/var/lib/flatpak/app", "/var/lib/flatpak/runtime",
        os.path.expanduser("~/.local/share/flatpak/app"),
        os.path.expanduser("~/.local/share/flatpak/runtime"),
        "/usr/lib/python3/dist-packages",
        "/usr/local/lib/python3/dist-packages",
        os.path.expanduser("~/.local/lib/python3.9/site-packages"),
        os.path.expanduser("~/.local/bin"),
        "/opt",
        "/var/cache/apt/archives", "/tmp"
    ]

    event_handler = SoftwareChangeHandler()
    observer = Observer()

    for directory in directories_to_watch:
        if os.path.exists(directory):
            observer.schedule(event_handler, directory, recursive=True)
            logging.info(f"Monitoring directory: {directory}")
        else:
            logging.warning(f"Directory not found, skipping: {directory}")

    observer.start()
    logging.info("Started real-time software change monitoring.")
    try:
        while True:
            observer.join(1)
    except KeyboardInterrupt:
        observer.stop()
        logging.info("Software monitoring stopped by user.")
    observer.join()

def main():
    """Main function to run the software monitoring system."""
    logging.info("Starting software monitoring service...")
    
    setup_database()
    initialize_database()
    
    monitor_software_changes()

if __name__ == "__main__":
    main()