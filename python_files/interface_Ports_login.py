import psutil
import mysql.connector # type: ignore
from datetime import datetime
import time
from tabulate import tabulate # type: ignore
from db_config import db_config
import threading

def connect_to_database():
    return mysql.connector.connect(**db_config)

def log_interface_details(interface_name, details):
    db = connect_to_database()
    cursor = db.cursor()

    # Collect address details
    ipv4_address = None
    ipv4_netmask = None
    ipv4_broadcast = None
    ipv6_address = None
    mac_address = None

    for addr in details['addresses']:
        if addr['family'] == 2:  # AF_INET
            ipv4_address = addr['address']
            ipv4_netmask = addr['netmask']
            ipv4_broadcast = addr.get('broadcast', None)
        elif addr['family'] == 10:  # AF_INET6
            ipv6_address = addr['address']
        elif addr['family'] == 17:  # AF_LINK
            mac_address = addr['address']

    # Prepare SQL insert statement
    sql = """
    INSERT INTO network_interfaces (
        timestamp, interface_name, status, duplex, speed, mtu,
        ipv4_address, ipv4_netmask, ipv4_broadcast,
        ipv6_address, mac_address
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    # Get the current timestamp
    current_timestamp = datetime.now()

    # Execute the SQL statement with all collected details
    cursor.execute(sql, (
        current_timestamp,
        interface_name,
        'Up' if details['is_up'] else 'Down',
        details['duplex'],
        details['speed'],
        details['mtu'],
        ipv4_address,
        ipv4_netmask,
        ipv4_broadcast,
        ipv6_address,
        mac_address
    ))

    db.commit()
    cursor.close()
    db.close()

def get_network_interfaces():
    interfaces = psutil.net_if_addrs()
    stats = psutil.net_if_stats()

    interface_details = {}

    for interface_name, addresses in interfaces.items():
        interface_info = {
            'addresses': [],
            'is_up': stats[interface_name].isup,
            'duplex': stats[interface_name].duplex,
            'speed': stats[interface_name].speed,
            'mtu': stats[interface_name].mtu,
        }

        for address in addresses:
            address_info = {
                'family': address.family,
                'address': address.address,
                'netmask': address.netmask,
                'broadcast': address.broadcast if hasattr(address, 'broadcast') else None,
            }
            interface_info['addresses'].append(address_info)

        interface_details[interface_name] = interface_info

    return interface_details

def print_and_log_initial_interface_details(interface_details):
    for interface_name, details in interface_details.items():
        print(f"Interface: {interface_name}")
        print(f"  Status: {'Up' if details['is_up'] else 'Down'}")
        print(f"  Duplex: {details['duplex']}")
        print(f"  Speed: {details['speed']} Mbps")
        print(f"  MTU: {details['mtu']}")
        
        # Log the initial details into the database
        log_interface_details(interface_name, details)
        
        print()  # Add a newline for better readability

def get_open_ports_with_processes():
    # Get all connections
    connections = psutil.net_connections(kind='inet')
    
    # Filter to get only ports in LISTEN state
    open_ports = [(conn.laddr.port, conn.pid) for conn in connections if conn.status == psutil.CONN_LISTEN]
    
    # Remove duplicates and sort the ports
    open_ports = sorted(set(open_ports))
    
    return open_ports

def get_process_details(pid):
    try:
        process = psutil.Process(pid)
        return process.name(), process.cmdline()
    except psutil.NoSuchProcess:
        return "Unknown Process", []
    except psutil.AccessDenied:
        return "Access Denied", []

def store_open_ports_in_db(open_ports):
    db = connect_to_database()
    cursor = db.cursor()

    insert_query = """
    INSERT INTO open_ports (port_number, protocol, process_name, pid, command_line)
    VALUES (%s, %s, %s, %s, %s)
    """

    for port, pid in open_ports:
        process_name, cmdline = get_process_details(pid)
        
        # Truncate long command lines
        cmdline_str = ' '.join(cmdline)
        if len(cmdline_str) > 100:
            cmdline_str = cmdline_str[:97] + '...'
        
        # Assuming all open ports are TCP for simplicity
        protocol = "TCP"
        
        cursor.execute(insert_query, (port, protocol, process_name, pid, cmdline_str))

    db.commit()
    cursor.close()
    db.close()

def print_open_ports():
    open_ports = get_open_ports_with_processes()
    
    # Store open ports in database
    store_open_ports_in_db(open_ports)

    # Print open ports in a table format
    table = []
    for port, pid in open_ports:
        process_name, cmdline = get_process_details(pid)
        
        # Truncate long command lines
        cmdline_str = ' '.join(cmdline)
        if len(cmdline_str) > 100:
            cmdline_str = cmdline_str[:97] + '...'
        
        table.append([port, process_name, pid, cmdline_str])
    
    headers = ['Port', 'Process Name', 'PID', 'Command Line']
    print(tabulate(table, headers=headers, tablefmt='grid'))

def get_timestamp():
    """Returns the current timestamp."""
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

def get_status(line):
    """Parse the log line and identify login events."""
    timestamp = get_timestamp()

    if 'unlocked login keyring' in line:
        return ("Successful login", timestamp)
    elif 'session opened for user root' in line:
        return ("Session opened for root", timestamp)
    elif 'session closed for user root' in line:
        return ("Session closed for root", timestamp)
    elif 'authentication failure' in line:
        return ("Unsuccessful login", timestamp)
    return None

def insert_login_event_into_db(event, timestamp):
    db = connect_to_database()
    cursor = db.cursor()
    query = """INSERT INTO login_events (event, timestamp) VALUES (%s, %s)"""
    cursor.execute(query, (event, timestamp))
    db.commit()
    cursor.close()
    db.close()

def monitor_logs():
    """Monitors the auth log file and stores login events in MariaDB."""
    log_file = '/var/log/auth.log'
    
    try:
        with open(log_file, 'r') as f:
            f.seek(0, 2)  # Move to the end of the file
            while True:
                line = f.readline()
                if line:
                    result = get_status(line)
                    if result:
                        event, timestamp = result
                        
                        # Insert into MariaDB for historical records
                        insert_login_event_into_db(event, timestamp)

                        # Print event for real-time visibility
                        print(f"{event} at {timestamp}")
                time.sleep(1)
    except FileNotFoundError:
        print(f"Error: Log file '{log_file}' not found.")
    except Exception as e:
        print(f"Error: {e}")

def monitor_open_ports():
    """Monitors open ports and updates the database."""
    previous_ports = set()
    
    while True:
        current_ports = get_open_ports_with_processes()
        current_ports_set = set(current_ports)
        
        # Detect new ports
        new_ports = current_ports_set - previous_ports
        if new_ports:
            print("New open ports detected:")
            for port, pid in new_ports:
                process_name, cmdline = get_process_details(pid)
                print(f"Port {port} opened by process {process_name} (PID: {pid})")
                # Update database with new ports
                db = connect_to_database()
                cursor = db.cursor()
                insert_query = """
                INSERT INTO open_ports (port_number, protocol, process_name, pid, command_line)
                VALUES (%s, %s, %s, %s, %s)
                """
                cmdline_str = ' '.join(cmdline)
                if len(cmdline_str) > 100:
                    cmdline_str = cmdline_str[:97] + '...'
                protocol = "TCP"
                cursor.execute(insert_query, (port, protocol, process_name, pid, cmdline_str))
                db.commit()
                cursor.close()
                db.close()
        
        # Detect closed ports
        closed_ports = previous_ports - current_ports_set
        if closed_ports:
            print("Ports closed:")
            for port, pid in closed_ports:
                print(f"Port {port} closed")
        
        previous_ports = current_ports_set
        
        # Sleep for a fixed interval before checking again
        time.sleep(5)

# Main function
if __name__ == "__main__":
    # Get and log initial status of interfaces
    interfaces_info = get_network_interfaces()
    print_and_log_initial_interface_details(interfaces_info)

    # Store initial states for change detection
    previous_states = {}
    for interface_name, details in interfaces_info.items():
        previous_states[interface_name] = ('Up' if details['is_up'] else 'Down')

    # Print initial open ports
    print_open_ports()

    print("Monitoring for interface changes, login events, and open ports...")

    # Start monitoring logs in a separate thread
    log_thread = threading.Thread(target=monitor_logs)
    log_thread.daemon = True  # Allow main thread to exit even if this thread is still running
    log_thread.start()

    # Start monitoring open ports in a separate thread
    port_thread = threading.Thread(target=monitor_open_ports)
    port_thread.daemon = True  # Allow main thread to exit even if this thread is still running
    port_thread.start()

    # Monitor interface changes
    while True:
        # Check current states of interfaces
        current_interfaces_info = get_network_interfaces()

        # Detect changes and log them
        for interface_name, current_details in current_interfaces_info.items():
            current_state = ('Up' if current_details['is_up'] else 'Down')
            
            if previous_states.get(interface_name) != current_state:
                print(f"Change detected on {interface_name}: Status changed from {previous_states[interface_name]} to {current_state}")
                previous_states[interface_name] = current_state
                
                # Log the updated state into the database
                log_interface_details(interface_name, current_details)

        # Sleep for a fixed interval before checking again
        time.sleep(5)
