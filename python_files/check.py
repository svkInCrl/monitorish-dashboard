import subprocess
import json

def get_usb_devices():
    """Fetch USB device details in a structured format."""
    result = subprocess.run(['lsusb', '-v'], stdout=subprocess.PIPE)
    devices = result.stdout.decode('utf-8').splitlines()
    
    formatted_devices = []
    device_info = {}
    
    for line in devices:
        if line.startswith('Bus'):
            if device_info:
                formatted_devices.append(device_info)
                device_info = {}
            bus_info = line.split()
            device_info['bus'] = bus_info[1]
            device_info['device'] = bus_info[3].strip(':')
        
        elif 'idVendor' in line:
            parts = line.split()
            device_info['vid'] = parts[2]
        
        elif 'idProduct' in line:
            parts = line.split()
            device_info['pid'] = parts[2]
        
        elif 'iProduct' in line:
            parts = line.split()
            device_info['product'] = parts[2].strip('"')
        
        elif 'iManufacturer' in line:
            parts = line.split()
            device_info['manufacturer'] = parts[2].strip('"')
        
        elif 'iSerial' in line:
            parts = line.split()
            # Check if parts has at least 3 elements before accessing parts[2]
            if len(parts) >= 3:
                device_info['serial'] = parts[2].strip('"')
            else:
                device_info['serial'] = "Unknown"
    
    if device_info:
        formatted_devices.append(device_info)
    
    # Convert to desired format
    trusted_devices = []
    for device in formatted_devices:
        if 'vid' in device and 'pid' in device:
            trusted_devices.append({
                "vid": device['vid'],
                "pid": device['pid'],
                "product": device.get('product', ''),
                "manufacturer": device.get('manufacturer', ''),
                "serial": device.get('serial', '')
            })
    
    return trusted_devices

def save_to_json(devices, filename='check.json'):
    with open(filename, 'w') as f:
        json.dump({"devices": devices}, f, indent=4)

if __name__ == '__main__':
    devices = get_usb_devices()
    save_to_json(devices)
