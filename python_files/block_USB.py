
import re
import json
import subprocess
import sys
from pathlib import Path
from time import sleep

TRUSTED_FILE = 'trusted_usb.json'
UDEV_RULES_DIR = '/etc/udev/rules.d/'
LOG_PATHS = ['/var/log/syslog', '/var/log/kern.log']


class USBGuardian:
    def __init__(self):
        self.trusted = self.load_trusted()
        self.last_pos = {path: Path(path).stat().st_size for path in LOG_PATHS}

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

    def monitor_logs(self):
        """Monitor system logs for USB insertion events."""
        log_path = '/var/log/syslog'

        with subprocess.Popen(['tail', '-F', log_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True) as proc:
            for line in proc.stdout:
                if 'New USB device found' in line:
                    device = self.parse_usb_event(line)
                    if device:
                        self.handle_device(device)

    def handle_device(self, device):
        """Check if a detected USB device is trusted; if not, block it."""
        current_devices = {f"{d['vid']}:{d['pid']}" for d in self.trusted['devices']}

        if f"{device['vid']}:{device['pid']}" not in current_devices:
            print(f"Unauthorized device detected: {device['description']}")
            self.block_device(device['vid'], device['pid'])
        else:
            print(f"Authorized device: {device['description']}")


if __name__ == '__main__':
    guardian = USBGuardian()

    if len(sys.argv) > 1 and sys.argv[1] == '--unblock':
        guardian.unblock_all_devices()
    else:
        print("Starting USB monitoring service...")
        guardian.monitor_logs()
