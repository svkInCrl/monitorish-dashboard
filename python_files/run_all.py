
# import multiprocessing
# import subprocess
# import os

# # List of scripts to run in parallel
# scripts = [
#     "directories_config.py",
#     "Hardware_static_live.py",
#     "Software_static_live.py",
#     "logs_merge.py",
#     "interface_Ports_login.py",
#     "process_monitor_final.py",
#     "system_static_live.py",
#     "user_activity_suraj.py",
#     "ufw.py"
# ]

# # Full path to the correct Python interpreter
# PYTHON_PATH = "/home/cstg-ubuntu/Desktop/Threat_Erase_New/Souvik/bin/python3"

# # Scripts that require sudo
# # sudo_scripts = {"logs_merge.py", "process_monitor_final.py", "system_static_live.py", "directories_config.py", "user_activity_suraj.py"}
# sudo_scripts = {"logs_merge.py"}

# def run_script(script):
#     log_file_path = f"{script}.log"  # Store logs in /var/log
    
#     with open(log_file_path, "w") as log_file:
#         cmd = [PYTHON_PATH, script]  # Default command (without sudo)

#         if script in sudo_scripts:
#             cmd = ["sudo", "-E"] + cmd  # Run with sudo and preserve env
        
#         print(cmd)
        
#         # if script == "user_activity_suraj.py":
#         #     cmd = ["python3", script]
#         #     print(cmd)

#         process = subprocess.run(
#             cmd, stdout=log_file, stderr=subprocess.STDOUT
#         )

#         print(process)
#         # else:
#         #     # Run other scripts normally
#         #     process = subprocess.run(
#         #         ["python3", script],
#         #         stdout=log_file, stderr=subprocess.STDOUT
#         #     )

# if __name__ == "__main__":
#     processes = []

#     for script in scripts:
#         p = multiprocessing.Process(target=run_script, args=(script,))
#         p.start()
#         processes.append(p)

#     for p in processes:
#         p.join()  # Ensures all scripts complete execution


# import subprocess
# import multiprocessing

# scripts = [
#     "directories_config.py",
#     "Hardware_static_live.py",
#     "Software_static_live.py",
#     "logs_merge.py",
#     "interface_Ports_login.py",
#     "process_monitor_final.py",
#     "system_static_live.py",
#     "user_activity_suraj.py",
#     "ufw.py"
# ]

# # Update these paths to match your environment
# VENV_PATH = "/home/cstg-ubuntu/Desktop/Threat_Erase_New/Souvik"
# VENV_PYTHON = f"{VENV_PATH}/bin/python"

# def run_regular(script):
#     subprocess.run(["python3", script])
#     print(f"Completed: {script}")

# if __name__ == "__main__":
#     # Run sudo script with venv Python
#     print("\n=== SUDO REQUIRED FOR logs_merge.py ===")
#     subprocess.run(["sudo", VENV_PYTHON, "logs_merge.py"])
    
#     # Run other scripts normally
#     remaining_scripts = [s for s in scripts if s != "logs_merge.py"]
#     processes = []
    
#     for script in remaining_scripts:
#         p = multiprocessing.Process(target=run_regular, args=(script,))
#         p.start()
#         processes.append(p)
    
#     for p in processes:
#         p.join()


# import subprocess
# import multiprocessing
# import sys  # Add this import statement

# scripts = [
#     "directories_config.py",
#     "Hardware_static_live.py",
#     "Software_static_live.py",
#     "logs_merge.py",
#     "interface_Ports_login.py",
#     "process_monitor_final.py",
#     "system_static_live.py",
#     "user_activity_suraj.py",
#     "ufw.py"
# ]

# VENV_PATH = "/home/cstg-ubuntu/Desktop/Threat_Erase_New/Souvik"
# VENV_PYTHON = f"{VENV_PATH}/bin/python"

# def run_regular(script):
#     subprocess.run(["python3", script])  # Uses current venv
#     print(f"Completed: {script}")

# def run_sudo_script(script):
#     # Run with sudo and venv Python, allowing password input
#     subprocess.run(["sudo", VENV_PYTHON, script], stdin=sys.stdin, stdout=sys.stdout, stderr=sys.stderr)
#     print(f"Completed: {script}")

# if __name__ == "__main__":
#     # Run sudo script with venv Python
#     print("\n=== SUDO REQUIRED FOR logs_merge.py ===")
#     run_sudo_script("logs_merge.py")  # Run in main process
    
#     # Run other scripts normally
#     remaining_scripts = [s for s in scripts if s != "logs_merge.py"]
#     processes = []
    
#     for script in remaining_scripts:
#         p = multiprocessing.Process(target=run_regular, args=(script,))
#         p.start()
#         processes.append(p)
    
#     # Wait for all processes to complete
#     for p in processes:
#         p.join()





import subprocess
import multiprocessing
import time
import sys

scripts = [
    "directories_config.py",
    "Hardware_static_live.py",
    "Software_static_live.py",
    "logs_merge.py",
    "interface_Ports_login.py",
    "process_monitor_final.py",
    "system_static_live.py",
    "user_activity_suraj.py",
    "ufw.py"
]

VENV_PATH = "/home/cstg-ubuntu/Desktop/Threat_Erase_New/Souvik"
VENV_PYTHON = f"{VENV_PATH}/bin/python"

def run_regular(script):
    subprocess.run(["python3", script])  # Uses current venv
    print(f"Completed: {script}")

def run_sudo_script(script):
    subprocess.run(["sudo", VENV_PYTHON, script], stdin=sys.stdin, stdout=sys.stdout, stderr=sys.stderr)
    print(f"Completed: {script}")

if __name__ == "__main__":
    # Run logs_merge.py in a separate process
    print("\n=== SUDO REQUIRED FOR logs_merge.py ===")
    sudo_process = multiprocessing.Process(target=run_sudo_script, args=("logs_merge.py",))
    sudo_process.start()

    # Give some time for sudo password entry
    time.sleep(5)

    # Run other scripts in parallel
    remaining_scripts = [s for s in scripts if s != "logs_merge.py"]
    processes = []

    for script in remaining_scripts:
        p = multiprocessing.Process(target=run_regular, args=(script,))
        p.start()
        processes.append(p)

    # Wait for all processes to complete
    for p in processes:
        p.join()

    # Wait for logs_merge.py to finish
    sudo_process.join()
