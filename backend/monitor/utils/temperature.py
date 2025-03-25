import psutil

def get_temperatures():
    try:
        temps = psutil.sensors_temperatures()
        if not temps:
            print("No temperature sensors found.")
            return
        print(temps['acpitz'][0].current)

        # for name, entries in temps.items():
        #     print(f"\n{name} Temperature Readings:")
        #     for entry in entries:
        #         print(f"  {entry.label or name}: {entry.current}°C")
    except AttributeError:
        print("Temperature sensing is not supported on this system.")

if __name__ == "__main__":
    get_temperatures()
