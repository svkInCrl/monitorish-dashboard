import os
import subprocess
import mysql.connector # type: ignore
from mysql.connector import Error # type: ignore
import hashlib
from datetime import datetime
import pwd
import time
from db_config import db_config

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

def generate_software_id(sw_name, path):
    """Generate a unique software ID using the software name and path."""
    unique_string = f"{sw_name}_{path}"
    return hashlib.sha256(unique_string.encode()).hexdigest()

def get_software_privilege(path):
    """Check the privilege level of the installed software based on file ownership."""
    if os.path.exists(path):
        try:
            file_stat = os.stat(path)
            owner = pwd.getpwuid(file_stat.st_uid).pw_name
            return "root" if owner == "root" else f"user ({owner})"
        except Exception:
            return "user"
    return "unknown"

def get_software_libraries(path):
    """Fetch dependent libraries for a given software (if the binary exists)."""
    if os.path.exists(path):
        try:
            result = subprocess.check_output(["ldd", path], stderr=subprocess.DEVNULL).decode("utf-8")
            libraries = [line.split(" ")[0].strip() for line in result.split("\n") if "=>" in line]
            return ",".join(libraries)
        except Exception:
            return "N/A"
    return "N/A"

def find_binary_path(sw_name):
    """Find the binary path of the installed software using 'which'."""
    try:
        result = subprocess.check_output(["which", sw_name], stderr=subprocess.DEVNULL).decode("utf-8").strip()
        return result if result else f"/usr/bin/{sw_name}"
    except Exception:
        return f"/usr/bin/{sw_name}"

def get_software_installation_timestamp(sw_name):
    """Fetch the installation timestamp for the software using dpkg-query."""
    try:
        # Fetch the installation date from dpkg-query
        result = subprocess.check_output(
            ["dpkg-query", "-W", "-f=${installed_size} ${Status} ${Version}"],
            stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()

        # Attempt to retrieve and parse timestamp
        if "installed" in result:
            timestamp = result.split()[0]
            return datetime.strptime(timestamp, "%Y-%m-%d").strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        pass

    # Fallback to the current timestamp if the installation timestamp cannot be found
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def get_installed_software():
    """Fetches the list of installed software on Ubuntu with additional details."""
    installed_software = []

    try:
        # List all installed software using dpkg-query
        result = subprocess.check_output(["dpkg-query", "-W", "-f=${binary:Package},${Version}\n"], stderr=subprocess.DEVNULL)
        
        for line in result.decode("utf-8").strip().split("\n"):
            parts = line.split(",")
            if len(parts) >= 2:
                sw_name = parts[0].strip()
                version = parts[1].strip()

                # Find the actual binary path using 'which'
                path = find_binary_path(sw_name)

                # Generate software ID
                sw_id = generate_software_id(sw_name, path)

                # Get privilege level
                privilege = get_software_privilege(path)

                # Get installation timestamp
                installation_timestamp = get_software_installation_timestamp(sw_name)

                # Fetch dependent libraries
                libraries = get_software_libraries(path)

                installed_software.append((sw_id, sw_name, privilege, path, installation_timestamp, libraries, version))
    except Exception as e:
        print(f"Error fetching installed software: {e}")
    
    return installed_software

def store_installed_software_to_db(software_list):
    """Stores the list of installed software in the MariaDB database."""
    try:
        # Connect to the database
        connection = mysql.connector.connect(**db_config)

        cursor = connection.cursor()

        # Insert or update software data in the database
        insert_query = """
        INSERT INTO installed_software (sw_id, sw_name, sw_privilege, path, installation_timestamp, libraries, version)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            version = VALUES(version),
            sw_privilege = VALUES(sw_privilege),
            libraries = VALUES(libraries);
        """
        
        cursor.executemany(insert_query, software_list)
        connection.commit()
        print(f"Successfully inserted/updated {cursor.rowcount} records.")

    except Error as e:
        print(f"Error while connecting to MariaDB: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def fetch_installed_software():
    software_list = []
    try:
        # Use `dpkg-query` to get detailed information about installed packages
        result = subprocess.run(['dpkg-query', '-W', '--showformat', '${Package} ${Description}\n'],
                                stdout=subprocess.PIPE, text=True)
        packages = result.stdout.splitlines()

        for line in packages:
            parts = line.split(' ', 1)
            if len(parts) == 2:
                sw_id = parts[0]  # Package name
                sw_name = parts[1]  # Package description
                sw_privileges = "User" if os.geteuid() != 0 else "Admin"
                sw_path = "N/A"  # Package may not have an executable path
                libraries = "N/A"  # Skip dynamic executable check for now

                software_list.append((sw_id, sw_name, sw_privileges, sw_path, libraries))
    except Exception as e:
        print(f"Error fetching installed software: {e}")
    return software_list

def insert_software_data(sw_id, sw_name, sw_privileges, sw_path, libraries, action):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO software_monitor (sw_id, sw_name, sw_privileges, sw_path, libraries, action)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
            sw_name=VALUES(sw_name), sw_privileges=VALUES(sw_privileges), sw_path=VALUES(sw_path),
            libraries=VALUES(libraries), action=VALUES(action), timestamp=CURRENT_TIMESTAMP
        ''', (sw_id, sw_name, sw_privileges, sw_path, libraries, action))

        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

def detect_software_changes(previous_software_list, current_software_list):
    previous_software_dict = {sw[0]: sw for sw in previous_software_list}
    current_software_dict = {sw[0]: sw for sw in current_software_list}

    # Detect new installations
    for sw_id, sw_details in current_software_dict.items():
        if sw_id not in previous_software_dict:
            insert_software_data(*sw_details, "INSTALLED")
            print(f"Software Installed: {sw_details[1]}")

    # Detect uninstallations
    for sw_id, sw_details in previous_software_dict.items():
        if sw_id not in current_software_dict:
            insert_software_data(*sw_details, "UNINSTALLED")
            print(f"Software Uninstalled: {sw_details[1]}")

# Main function
if __name__ == "__main__":
    # Fetch the initial list of installed software
    previous_software_list = fetch_installed_software()

    # Store detailed software information in the database
    detailed_software_list = get_installed_software()
    if detailed_software_list:
        store_installed_software_to_db(detailed_software_list)
    else:
        print("No software found.")

    print("Monitoring for software installation/uninstallation...")

    # Monitor software changes every 5 seconds
    while True:
        current_software_list = fetch_installed_software()
        detect_software_changes(previous_software_list, current_software_list)
        previous_software_list = current_software_list

        # Sleep for a fixed interval before checking again
        time.sleep(5)
