# import re
# import subprocess
# import socket

# # Get system hostname
# hostname = socket.gethostname()

# # Path to UFW log file
# UFW_LOG_FILE = "/var/log/ufw.log"

# # Regular expression to extract UFW log details
# ufw_regex = re.compile(
#     r'(?P<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+[\+\-]\d{2}:\d{2}) .*'
#     r'\[UFW (?P<action>BLOCK|ALLOW)] '
#     r'IN=(?P<interface>\S*) OUT=(?P<out_interface>\S*) .*'
#     r'SRC=(?P<src_ip>\S*) DST=(?P<dst_ip>\S*) .*'
#     r'PROTO=(?P<protocol>\S*) SPT=(?P<src_port>\d*) DPT=(?P<dst_port>\d*)'
# )

# # Run 'tail -f' on the UFW log file to read live updates
# process = subprocess.Popen(['tail', '-f', UFW_LOG_FILE], stdout=subprocess.PIPE, text=True)

# print(f"\n🔍 Monitoring UFW Logs on {hostname}...\n")

# try:
#     for line in iter(process.stdout.readline, ''):
#         match = ufw_regex.search(line)
#         if match:
#             log_data = match.groupdict()
#             print(f"""
# 📅 Timestamp: {log_data['timestamp']}
# 🖥️ Hostname: {hostname}
# 🚦 Action: {log_data['action']}
# 🌐 Network Interface: {log_data['interface']} → {log_data['out_interface']}
# 📡 Source IP: {log_data['src_ip']}
# 🎯 Destination IP: {log_data['dst_ip']}
# 🔄 Protocol: {log_data['protocol']}
# 🎯 Source Port: {log_data['src_port']}
# 🎯 Destination Port: {log_data['dst_port']}
# ---------------------------------------------
# """)
# except KeyboardInterrupt:
#     print("\n❌ Stopping UFW Log Monitoring...")
#     process.terminate()

import re
import subprocess
import socket
import mysql.connector
from datetime import datetime

from db_config import db_config

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# Get system hostname
hostname = socket.gethostname()

# Path to UFW log file
UFW_LOG_FILE = "/var/log/ufw.log"

# Regular expression to extract UFW log details
ufw_regex = re.compile(
    r'(?P<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+[\+\-]\d{2}:\d{2}) .*'
    r'\[UFW (?P<action>BLOCK|ALLOW)] '
    r'IN=(?P<interface>\S*) .*'
    r'SRC=(?P<src_ip>\S*) DST=(?P<dst_ip>\S*) .*'
    r'PROTO=(?P<protocol>\S*) SPT=(?P<src_port>\d*) DPT=(?P<dst_port>\d*)'
)

# Function to insert log into database
def insert_into_db(log_data):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        insert_query = """
        INSERT INTO ufw_logs (timestamp, action, interface, 
                              src_ip, dst_ip, protocol, src_port, dst_port)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (
            datetime.strptime(log_data['timestamp'], "%Y-%m-%dT%H:%M:%S.%f%z"),  # Convert timestamp
            log_data['action'],
            log_data['interface'],
            log_data['src_ip'],
            log_data['dst_ip'],
            log_data['protocol'],
            int(log_data['src_port']),
            int(log_data['dst_port'])
        ))

        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Log inserted into database.")
    except Exception as e:
        print(f"❌ Database Error: {e}")

# Run 'tail -f' on the UFW log file to read live updates
process = subprocess.Popen(['tail', '-f', UFW_LOG_FILE], stdout=subprocess.PIPE, text=True)

print(f"\n🔍 Monitoring UFW Logs on {hostname}...\n")

try:
    for line in iter(process.stdout.readline, ''):
        match = ufw_regex.search(line)
        if match:
            log_data = match.groupdict()
            print(f"""
📅 Timestamp: {log_data['timestamp']}
🖥️ Hostname: {hostname}
🚦 Action: {log_data['action']}
🌐 Network Interface: {log_data['interface']}
📡 Source IP: {log_data['src_ip']}
🎯 Destination IP: {log_data['dst_ip']}
🔄 Protocol: {log_data['protocol']}
🎯 Source Port: {log_data['src_port']}
🎯 Destination Port: {log_data['dst_port']}
---------------------------------------------
""")
            insert_into_db(log_data)  # Insert into database
except KeyboardInterrupt:
    print("\n❌ Stopping UFW Log Monitoring...")
    process.terminate()
