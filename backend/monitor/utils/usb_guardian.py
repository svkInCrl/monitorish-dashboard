import re
import json
import subprocess
from pathlib import Path

TRUSTED_FILE = 'trusted_usb.json'
UDEV_RULES_DIR = '/etc/udev/rules.d/'

class USBGuardian:
    def __init__(self):
        self.trusted = self.load_trusted()
        # Ensure udev rules directory exists
        Path(UDEV_RULES_DIR).mkdir(parents=True, exist_ok=True)

    def load_trusted(self):
        """Load trusted USB devices from the JSON file."""
        try:
            with open(TRUSTED_FILE) as f:
                return json.load(f)
        except FileNotFoundError:
            return {'devices': []}

    def save_trusted(self):
        """Save trusted USB devices to the JSON file."""
        with open(TRUSTED_FILE, 'w') as f:
            json.dump(self.trusted, f, indent=4)

    def parse_usb_event(self, line):
        """Extract USB details from syslog lines."""
        pattern = (
            r'usb\s+\d+-\d+: New USB device found, '
            r'idVendor=(?P<vid>\w+), idProduct=(?P<pid>\w+)'
        )
        match = re.search(pattern, line)
        if match:
            return {
                'vid': match.group('vid'),
                'pid': match.group('pid'),
                'description': f"Unknown device {match.group('vid')}:{match.group('pid')}"
            }
        return None

    def block_device(self, vid, pid):
        """Block a USB device by adding a udev rule."""
        rule = (
            f'SUBSYSTEM=="usb", ATTRS{{idVendor}}=="{vid}", '
            f'ATTRS{{idProduct}}=="{pid}", ATTR{{authorized}}="0"\n'
        )
        rule_file = Path(UDEV_RULES_DIR) / f'99-block-{vid}-{pid}.rules'
        rule_file.write_text(rule)

        # Apply the new rule
        subprocess.run(['udevadm', 'control', '--reload-rules'])
        subprocess.run(['udevadm', 'trigger', '--subsystem-match=usb'])
        print(f"Blocked device {vid}:{pid}")

    def unblock_all_devices(self):
        """Remove all USB block rules and restore access to all devices."""
        for rule_file in Path(UDEV_RULES_DIR).glob("99-block-*.rules"):
            rule_file.unlink()

        subprocess.run(['udevadm', 'control', '--reload-rules'])
        subprocess.run(['udevadm', 'trigger', '--subsystem-match=usb'])
        print("All previously blocked USB devices have been unblocked.")

    def monitor_logs(self, callback):
        """Monitor syslog for USB events and block unauthorized devices."""
        log_path = '/var/log/syslog'

        with subprocess.Popen(['tail', '-F', log_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True) as proc:
            for line in proc.stdout:
                if 'New USB device found' in line:
                    device = self.parse_usb_event(line)
                    if device:
                        message = self.handle_device(device)
                        if message:
                            callback(message)

    def handle_device(self, device):
        """Check if a detected USB device is trusted; if not, block it."""
        current_devices = {f"{d['vid']}:{d['pid']}" for d in self.trusted['devices']}

        if f"{device['vid']}:{device['pid']}" not in current_devices:
            self.block_device(device['vid'], device['pid'])
            return f"Blocked unauthorized device: {device['description']}"
        else:
            return f"Authorized device: {device['description']}"
