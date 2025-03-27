import mysql.connector # type: ignore

# Database connection parameters
DB_HOST = "localhost"
DB_USER = "admin"  # Replace with your database username
DB_PASSWORD = "password"  # Replace with your database password
DB_NAME = "Threat_Erase"  # Replace with your desired database name

def create_database(cursor):
    """Creates the database if it doesn't exist."""
    try:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        print(f"Database '{DB_NAME}' created successfully (if it didn't exist).")
    except mysql.connector.Error as err:
        print(f"Failed to create database: {err}")
        exit(1)

def create_tables(cursor):
    """Creates the tables based on the provided schema."""

    tables = {}

    tables['Hardware_Change_Tracking'] = (
        "CREATE TABLE Hardware_Change_Tracking ("
        "  timestamp DATETIME NOT NULL,"
        "  hw_id VARCHAR(255) NOT NULL,"
        "  hw_type VARCHAR(255),"
        "  hw_description TEXT,"
        "  hw_status VARCHAR(50) NOT NULL,"
        "  battery_percentage INT,"
        "  power_source VARCHAR(50),"
        "  PRIMARY KEY (timestamp, hw_id, hw_status)"
        ")"
    )

    tables['Initial_Hardware_Config'] = (
        "CREATE TABLE Initial_Hardware_Config ("
        "  timestamp DATETIME NOT NULL,"
        "  hw_id VARCHAR(255) NOT NULL,"
        "  hw_type VARCHAR(255),"
        "  hw_description TEXT,"
        "  hw_status VARCHAR(50) NOT NULL,"
        "  battery_percentage INT,"
        "  power_source VARCHAR(50),"
        "  PRIMARY KEY (timestamp, hw_id, hw_status)"
        ")"
    )

    tables['file_paths'] = (
        "CREATE TABLE file_paths ("
        "  file_name VARCHAR(255) NOT NULL,"
        "  paths TEXT NOT NULL,"
        "  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,"
        "  PRIMARY KEY (file_name)"
        ")"
    )

    tables['installed_software'] = (
        "CREATE TABLE installed_software ("
        "  sw_id VARCHAR(255) NOT NULL,"
        "  sw_name VARCHAR(255) NOT NULL,"
        "  sw_privilege VARCHAR(50),"
        "  path VARCHAR(255) NOT NULL,"
        "  installation_timestamp DATETIME,"
        "  libraries TEXT,"
        "  version VARCHAR(100),"
        "  PRIMARY KEY (sw_id, sw_name)"
        ")"
    )

    tables['last_processed'] = (
        "CREATE TABLE last_processed ("
        "  file_name VARCHAR(255) NOT NULL,"
        "  last_log_id VARCHAR(64),"
        "  PRIMARY KEY (file_name)"
        ")"
    )

    tables['login_events'] = (
        "CREATE TABLE login_events ("
        "  id INT AUTO_INCREMENT PRIMARY KEY,"
        "  event VARCHAR(255),"
        "  timestamp DATETIME(3)"
        ")"
    )

    tables['network_interfaces'] = (
        "CREATE TABLE network_interfaces ("
        "  timestamp DATETIME NOT NULL,"
        "  interface_name VARCHAR(255) NOT NULL,"
        "  status VARCHAR(50) NOT NULL,"
        "  duplex VARCHAR(50),"
        "  speed INT,"
        "  mtu INT,"
        "  ipv4_address VARCHAR(255),"
        "  ipv4_netmask VARCHAR(255),"
        "  ipv4_broadcast VARCHAR(255),"
        "  ipv6_address VARCHAR(255),"
        "  mac_address VARCHAR(255),"
        "  PRIMARY KEY (timestamp, interface_name, status)"
        ")"
    )

    tables['open_ports'] = (
        "CREATE TABLE open_ports ("
        "  id INT AUTO_INCREMENT PRIMARY KEY,"
        "  port_number INT NOT NULL,"
        "  protocol VARCHAR(10) NOT NULL,"
        "  process_name VARCHAR(255),"
        "  pid INT,"
        "  command_line TEXT,"
        "  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")"
    )

    tables['patterns'] = (
        "CREATE TABLE patterns ("
        "  pattern VARCHAR(255) NOT NULL,"
        "  file_name VARCHAR(255) NOT NULL,"
        "  PRIMARY KEY (pattern, file_name)"
        ")"
    )

    tables['process_info'] = (
        "CREATE TABLE process_info ("
        "  process_name VARCHAR(255) NOT NULL,"
        "  path VARCHAR(255) NOT NULL,"
        "  pid INT,"
        "  ppid INT,"
        "  active_connections INT,"
        "  first_seen DATETIME,"
        "  PRIMARY KEY (process_name, path)"
        ")"
    )

    tables['process_resources'] = (
        "CREATE TABLE process_resources ("
        "  pid INT NOT NULL,"
        "  cpu_usage FLOAT,"
        "  ram_usage FLOAT,"
        "  data_sent_mb FLOAT,"
        "  data_received_mb FLOAT,"
        "  timestamp DATETIME(6) NOT NULL,"
        "  PRIMARY KEY (pid, timestamp)"
        ")"
    )

    tables['software_monitor'] = (
        "CREATE TABLE software_monitor ("
        "  id INT AUTO_INCREMENT PRIMARY KEY,"
        "  sw_id VARCHAR(255),"
        "  sw_name TEXT,"
        "  sw_privileges TEXT,"
        "  sw_path TEXT,"
        "  libraries TEXT,"
        "  action TEXT,"
        "  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ")"
    )

    tables['system_details'] = (
        "CREATE TABLE system_details ("
        "  timestamp DATETIME NOT NULL PRIMARY KEY,"
        "  host_name VARCHAR(255),"
        "  interface_count INT,"
        "  cpu_count INT,"
        "  cpu_freq FLOAT,"
        "  ram_size FLOAT,"
        "  virtual_mem_size FLOAT,"
        "  gpu_size FLOAT,"
        "  os_type VARCHAR(50),"
        "  os_details TEXT,"
        "  os_release VARCHAR(50),"
        "  system_arch VARCHAR(50),"
        "  kernel_version VARCHAR(255),"
        "  boot_time DATETIME"
        ")"
    )

    tables['system_monitor'] = (
        "CREATE TABLE system_monitor ("
        "  id INT AUTO_INCREMENT PRIMARY KEY,"
        "  timestamp DATETIME NOT NULL,"
        "  cpu_usage FLOAT,"
        "  gpu_usage FLOAT,"
        "  ram_usage FLOAT,"
        "  disk_usage FLOAT,"
        "  kb_sent FLOAT,"
        "  kb_received FLOAT"
        ")"
    )

    tables['ufw_logs'] = (
        "CREATE TABLE ufw_logs ("
        "  timestamp DATETIME NOT NULL,"
        "  action VARCHAR(10),"
        "  interface VARCHAR(50),"
        "  src_ip VARCHAR(50) NOT NULL,"
        "  dst_ip VARCHAR(50),"
        "  protocol VARCHAR(10),"
        "  src_port INT NOT NULL,"
        "  dst_port INT NOT NULL,"
        "  PRIMARY KEY (timestamp, src_ip, src_port, dst_port)"
        ")"
    )

    tables['user_activity'] = (
        "CREATE TABLE user_activity ("
        "  id INT AUTO_INCREMENT PRIMARY KEY,"
        "  event_type VARCHAR(50),"
        "  message TEXT,"
        "  timestamp DATETIME"
        ")"
    )

    for table_name, table_description in tables.items():
        try:
            print(f"Creating table: {table_name} ")
            cursor.execute(table_description)
        except mysql.connector.Error as err:
            print(f"Failed to create table {table_name}: {err}")
            # Optionally, you could exit here if a table creation failure is critical
            # exit(1)
        else:
            print(f"Table {table_name} created successfully.")


# Main execution
try:
    # Establish connection
    mydb = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD
    )

    # Get cursor
    mycursor = mydb.cursor()

    # Create database
    create_database(mycursor)

    # Use the database
    mycursor.execute(f"USE {DB_NAME}")
    mydb.commit() # Commit the USE statement

    # Create tables
    create_tables(mycursor)

except mysql.connector.Error as err:
    print(f"An error occurred: {err}")

finally:
    # Close cursor and connection
    if 'mycursor' in locals() and mycursor:
        mycursor.close()
    if 'mydb' in locals() and mydb.is_connected():
        mydb.commit() # Ensure any pending operations are committed
        mydb.close()
        print("Connection closed.")
