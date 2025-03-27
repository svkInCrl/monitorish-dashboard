
#!/usr/bin/env python3
import subprocess
import time
import json
import sys
from datetime import datetime
from pathlib import Path
import mysql.connector
from db_config import db_config

TRUSTED_FILE = 'trusted_usb.json'
UDEV_RULES_DIR = '/etc/udev/rules.d/'

def get_timestamp():
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def load_trusted_devices():
    try:
        with open(TRUSTED_FILE) as f:
            return json.load(f).get('devices', [])
    except FileNotFoundError:
        return []
    except Exception as e:
        print(f"Error loading trusted devices: {e}")
        return []

def get_usb_devices():
    try:
        result = subprocess.run(['lsusb'], stdout=subprocess.PIPE, check=True, timeout=5)
        devices = result.stdout.decode('utf-8').splitlines()
        formatted_devices = []
        for device in devices:
            parts = device.split()
            if len(parts) < 6:
                continue
            hw_id = parts[5]
            hw_type = "USB Device"
            hw_description = " ".join(parts[6:])
            formatted_devices.append({
                "HW_ID": hw_id,
                "HW_Type": hw_type,
                "HW_Description": hw_description,
                "HW_Status": "Connected"
            })
        return formatted_devices
    except Exception as e:
        print(f"Error in get_usb_devices: {e}")
        return []

def store_initial_configuration(timestamp, hw_id, hw_type, hw_description):
    try:
        conn = mysql.connector.connect(**db_config, connection_timeout=10)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT IGNORE INTO Initial_Hardware_Config 
            (timestamp, hw_id, hw_type, hw_description)
            VALUES (%s, %s, %s, %s)
        """, (timestamp, hw_id, hw_type, hw_description))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Database Error (Initial Configuration): {e}")

def store_hardware_change(timestamp, hw_id, hw_type, hw_description, hw_status):
    try:
        conn = mysql.connector.connect(**db_config, connection_timeout=10)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Hardware_Change_Tracking 
            (timestamp, hw_id, hw_type, hw_description, hw_status) 
            VALUES (%s, %s, %s, %s, %s)
        """, (timestamp, hw_id, hw_type, hw_description, hw_status))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Database Error (Change Tracking): {e}")

def block_device(vid, pid):
    try:
        rule = f'SUBSYSTEM=="usb", ATTRS{{idVendor}}=="{vid}", ATTRS{{idProduct}}=="{pid}", ATTR{{authorized}}="0"\n'
        rule_file = Path(UDEV_RULES_DIR) / f'99-block-{vid}-{pid}.rules'
        Path(UDEV_RULES_DIR).mkdir(parents=True, exist_ok=True)
        rule_file.write_text(rule)
        subprocess.run(['udevadm', 'control', '--reload-rules'], check=True, timeout=5)
        subprocess.run(['udevadm', 'trigger', '--subsystem-match=usb'], check=True, timeout=5)
        print(f"Blocked device {vid}:{pid}")
    except Exception as e:
        print(f"Error in block_device: {e}")

def unblock_device(vid, pid):
    try:
        rule_file = Path(UDEV_RULES_DIR) / f'99-block-{vid}-{pid}.rules'
        if rule_file.exists():
            rule_file.unlink()
            subprocess.run(['udevadm', 'control', '--reload-rules'], check=True, timeout=5)
            subprocess.run(['udevadm', 'trigger', '--subsystem-match=usb'], check=True, timeout=5)
            print(f"Unblocked device {vid}:{pid}")
        else:
            print(f"No block rule found for device {vid}:{pid}")
    except Exception as e:
        print(f"Error in unblock_device: {e}")

def unblock_all_devices():
    try:
        for rule_file in Path(UDEV_RULES_DIR).glob('99-block-*.rules'):
            rule_file.unlink()
        subprocess.run(['udevadm', 'control', '--reload-rules'], check=True, timeout=5)
        subprocess.run(['udevadm', 'trigger', '--subsystem-match=usb'], check=True, timeout=5)
        print("All USB device blocks removed")
    except Exception as e:
        print(f"Error in unblock_all_devices: {e}")

def monitor_hardware(unblock_mode=False):
    previous_hardware = set()
    initial_hardware_recorded = False
    trusted_devices = load_trusted_devices()
    trusted_ids = {f"{d['vid']}:{d['pid']}" for d in trusted_devices}

    if unblock_mode:
        unblock_all_devices()
        return

    while True:
        try:
            current_hardware = set(tuple(d.items()) for d in get_usb_devices())

            if not initial_hardware_recorded:
                conn = mysql.connector.connect(**db_config, connection_timeout=10)
                cursor = conn.cursor()
                cursor.execute("DELETE FROM Initial_Hardware_Config")
                conn.commit()
                for device in current_hardware:
                    device_dict = dict(device)
                    timestamp = get_timestamp()
                    store_initial_configuration(
                        timestamp,
                        device_dict["HW_ID"],
                        device_dict["HW_Type"],
                        device_dict["HW_Description"]
                    )
                cursor.close()
                conn.close()
                initial_hardware_recorded = True
                previous_hardware = current_hardware
                continue

            new_hardware = current_hardware - previous_hardware
            for device in new_hardware:
                device_dict = dict(device)
                timestamp = get_timestamp()
                vid, pid = device_dict["HW_ID"].split(':')
                status = "Connected (Allowed)" if f"{vid}:{pid}" in trusted_ids else "Connected (Blocked)"
                if status == "Connected (Blocked)":
                    block_device(vid, pid)
                store_hardware_change(timestamp, device_dict["HW_ID"], device_dict["HW_Type"], device_dict["HW_Description"], status)
                print(f"[{timestamp}] {status}: {device_dict}")

            removed_hardware = previous_hardware - current_hardware
            for device in removed_hardware:
                device_dict = dict(device)
                timestamp = get_timestamp()
                vid, pid = device_dict["HW_ID"].split(':')
                last_status = "Allowed" if f"{vid}:{pid}" in trusted_ids else "Blocked"
                status = f"Disconnected (Last: {last_status})"
                store_hardware_change(timestamp, device_dict["HW_ID"], device_dict["HW_Type"], device_dict["HW_Description"], status)
                print(f"[{timestamp}] {status}: {device_dict}")

            previous_hardware = current_hardware
            time.sleep(2)
        except KeyboardInterrupt:
            print("Script terminated by user")
            exit(0)
        except Exception as e:
            print(f"Error in monitor_hardware: {e}")
            time.sleep(2)

if __name__ == '__main__':
    print("Starting USB monitoring...")
    unblock_mode = "--unblock" in sys.argv
    monitor_hardware(unblock_mode)


# import subprocess
# import time
# import json
# from datetime import datetime
# from pathlib import Path
# import mysql.connector
# from db_config import db_config

# TRUSTED_FILE = 'trusted_usb.json'
# UDEV_RULES_DIR = '/etc/udev/rules.d/'

# def get_timestamp():
#     return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

# def load_trusted_devices():
#     try:
#         with open(TRUSTED_FILE) as f:
#             return json.load(f).get('devices', [])
#     except FileNotFoundError:
#         return []
#     except Exception as e:
#         print(f"Error loading trusted devices: {e}")
#         return []

# def get_usb_devices():
#     try:
#         result = subprocess.run(['lsusb'], stdout=subprocess.PIPE, check=True, timeout=5)
#         devices = result.stdout.decode('utf-8').splitlines()
#         formatted_devices = []
#         for device in devices:
#             parts = device.split()
#             if len(parts) < 6:
#                 continue
#             hw_id = parts[5]
#             hw_type = "USB Device"
#             hw_description = " ".join(parts[6:])
#             formatted_devices.append({
#                 "HW_ID": hw_id,
#                 "HW_Type": hw_type,
#                 "HW_Description": hw_description,
#                 "HW_Status": "Connected"
#             })
#         return formatted_devices
#     except Exception as e:
#         print(f"Error in get_usb_devices: {e}")
#         return []

# def store_initial_configuration(timestamp, hw_id, hw_type, hw_description):
#     try:
#         conn = mysql.connector.connect(**db_config, connection_timeout=10)
#         cursor = conn.cursor()
#         cursor.execute("""
#             INSERT IGNORE INTO Initial_Hardware_Config 
#             (timestamp, hw_id, hw_type, hw_description)
#             VALUES (%s, %s, %s, %s)
#         """, (timestamp, hw_id, hw_type, hw_description))
#         conn.commit()
#         cursor.close()
#         conn.close()
#     except Exception as e:
#         print(f"Database Error (Initial Configuration): {e}")

# def store_hardware_change(timestamp, hw_id, hw_type, hw_description, hw_status):
#     try:
#         conn = mysql.connector.connect(**db_config, connection_timeout=10)
#         cursor = conn.cursor()
#         cursor.execute("""
#             INSERT INTO Hardware_Change_Tracking 
#             (timestamp, hw_id, hw_type, hw_description, hw_status) 
#             VALUES (%s, %s, %s, %s, %s)
#         """, (timestamp, hw_id, hw_type, hw_description, hw_status))
#         conn.commit()
#         cursor.close()
#         conn.close()
#     except Exception as e:
#         print(f"Database Error (Change Tracking): {e}")

# def block_device(vid, pid):
#     try:
#         # Write udev rule to block future insertions
#         rule = f'SUBSYSTEM=="usb", ATTRS{{idVendor}}=="{vid}", ATTRS{{idProduct}}=="{pid}", ATTR{{authorized}}="0"\n'
#         rule_file = Path(UDEV_RULES_DIR) / f'99-block-{vid}-{pid}.rules'
#         Path(UDEV_RULES_DIR).mkdir(parents=True, exist_ok=True)
#         rule_file.write_text(rule)
#         subprocess.run(['udevadm', 'control', '--reload-rules'], check=True, timeout=5)
#         subprocess.run(['udevadm', 'trigger', '--subsystem-match=usb'], check=True, timeout=5)

#         # Deauthorize the device if already connected
#         for dev in Path('/sys/bus/usb/devices/').glob('*-*'):
#             if (dev / 'idVendor').exists() and (dev / 'idProduct').exists():
#                 if (dev / 'idVendor').read_text().strip() == vid and (dev / 'idProduct').read_text().strip() == pid:
#                     (dev / 'authorized').write_text('0')
#                     print(f"Deauthorized USB device {vid}:{pid}")

#         # Disable associated network interface
#         result = subprocess.run(['ip', 'link'], capture_output=True, text=True, check=True)
#         for line in result.stdout.splitlines():
#             if 'wwan' in line or 'usb' in line:  # Common for USB modems
#                 iface = line.split(':')[1].strip().split()[0]  # Extract interface name
#                 subprocess.run(['ip', 'link', 'set', iface, 'down'], check=True, timeout=5)
#                 print(f"Disabled network interface: {iface}")

#         print(f"Blocked device {vid}:{pid}")
#     except Exception as e:
#         print(f"Error in block_device: {e}")

# def monitor_hardware():
#     previous_hardware = set()
#     initial_hardware_recorded = False
#     trusted_devices = load_trusted_devices()
#     trusted_ids = {f"{d['vid']}:{d['pid']}" for d in trusted_devices}

#     while True:
#         try:
#             current_hardware = set(tuple(d.items()) for d in get_usb_devices())

#             if not initial_hardware_recorded:
#                 conn = mysql.connector.connect(**db_config, connection_timeout=10)
#                 cursor = conn.cursor()
#                 cursor.execute("DELETE FROM Initial_Hardware_Config")
#                 conn.commit()
#                 for device in current_hardware:
#                     device_dict = dict(device)
#                     timestamp = get_timestamp()
#                     store_initial_configuration(
#                         timestamp,
#                         device_dict["HW_ID"],
#                         device_dict["HW_Type"],
#                         device_dict["HW_Description"]
#                     )
#                 cursor.close()
#                 conn.close()
#                 initial_hardware_recorded = True
#                 previous_hardware = current_hardware
#                 continue

#             new_hardware = current_hardware - previous_hardware
#             for device in new_hardware:
#                 device_dict = dict(device)
#                 timestamp = get_timestamp()
#                 vid, pid = device_dict["HW_ID"].split(':')
#                 status = "Connected (Allowed)" if f"{vid}:{pid}" in trusted_ids else "Connected (Blocked)"
#                 if status == "Connected (Blocked)":
#                     block_device(vid, pid)
#                 store_hardware_change(timestamp, device_dict["HW_ID"], device_dict["HW_Type"], device_dict["HW_Description"], status)
#                 print(f"[{timestamp}] {status}: {device_dict}")

#             removed_hardware = previous_hardware - current_hardware
#             for device in removed_hardware:
#                 device_dict = dict(device)
#                 timestamp = get_timestamp()
#                 vid, pid = device_dict["HW_ID"].split(':')
#                 last_status = "Allowed" if f"{vid}:{pid}" in trusted_ids else "Blocked"
#                 status = f"Disconnected (Last: {last_status})"
#                 store_hardware_change(timestamp, device_dict["HW_ID"], device_dict["HW_Type"], device_dict["HW_Description"], status)
#                 print(f"[{timestamp}] {status}: {device_dict}")

#             previous_hardware = current_hardware
#             time.sleep(2)
#         except KeyboardInterrupt:
#             print("Script terminated by user")
#             exit(0)
#         except Exception as e:
#             print(f"Error in monitor_hardware: {e}")
#             time.sleep(2)

# if __name__ == '__main__':
#     print("Starting USB monitoring...")
#     monitor_hardware()