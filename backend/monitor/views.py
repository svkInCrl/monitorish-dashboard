from rest_framework.decorators import api_view
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from .models import SystemMonitor, SystemDetails, ProcessInfo, InstalledSoftware, InitialHardwareConfig, HardwareChangeTracking, ProcessResources, CriticalFile
from .serializers import SystemDetailsSerializer, ProcessInfoSerializer, ProcessResourcesSerializer, SystemMonitorSerializer, SoftwareMonitorSerializer, InitialHardwareConfigSerializer, HardwareChangeTrackingSerializer, CriticalFileSerializer
import psutil
import subprocess
import os
import datetime
import json
import time
from django.utils.timezone import now, timedelta, make_aware, is_aware
from django.http import JsonResponse, StreamingHttpResponse
from datetime import datetime
import threading
import Xlib
from Xlib import X, display, error
from collections import defaultdict
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from queue import Queue
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from .user_activity_check import ActivityMonitor

process_queue = Queue()
file_queue = Queue()
window_queue = Queue()

IGNORED_PROCESSES = {
"mutter-x11-frames", "ibus-x11", "gsd-xsettings", "Xwayland",
"gnome-session-binary", "pipewire", "dbus-daemon", "systemd",
"systemd-journald", "systemd-udevd", "snapd", "gvfsd", "upowerd",
"polkitd", "avahi-daemon", "wpa_supplicant", "bluetoothd"
}

# Ignore system users
IGNORED_USERS = {"root", "dbus", "systemd-resolve", "avahi", "polkitd"}

excluded_processes = ['cpuUsage.sh', 'python3', 'python', 'desktop-launch', 
                                     'WebExtensions', 'Privileged Cont', 'Socket Process', 
                                     'RDD Process', 'pingsender', 'kworker', 'sh', 'sleep','kworker', 'gnome-shell']

ignored_processes = {"gnome-shell", "systemd", "snapd"}


class ProcessInfoListView(ListAPIView):
    queryset = ProcessInfo.objects.all()
    serializer_class = ProcessInfoSerializer

class SoftwareInfoListView(ListAPIView):
    queryset = InstalledSoftware.objects.all()
    serializer_class = SoftwareMonitorSerializer
    
class InitialHardwareConfigListView(ListAPIView):
    queryset = InitialHardwareConfig.objects.all()
    serializer_class = InitialHardwareConfigSerializer
    
class HardwareChangeTrackingListView(ListAPIView):
    queryset = HardwareChangeTracking.objects.all()
    serializer_class = HardwareChangeTrackingSerializer
    
class ProcessResourceListView(ListAPIView):
    queryset = ProcessResources.objects.all()
    serializer_class = ProcessResourcesSerializer
    
class SystemDetailsListView(ListAPIView):
    queryset = SystemDetails.objects.all()
    serializer_class = SystemDetailsSerializer

def get_temperatures(request):
    """Fetch system temperature data and return as JSON."""
    try:
        temps = psutil.sensors_temperatures()
        
        return JsonResponse({"temperatures": temps['acpitz'][0].current})

    except AttributeError:
        return JsonResponse({"error": "Temperature sensing is not supported on this system."}, status=500)

    
# def get_metrics(request):
#     """Fetch real-time system metrics."""
    
#     interval = 1
    
#     net_io_start = psutil.net_io_counters()
#     bytes_sent_start = net_io_start.bytes_sent
#     bytes_recv_start = net_io_start.bytes_recv
    
#     time.sleep(interval)
    
#     net_io_end = psutil.net_io_counters()
#     bytes_sent_end = net_io_end.bytes_sent
#     bytes_recv_end = net_io_end.bytes_recv
    
#     bytes_sent_diff = bytes_sent_end - bytes_sent_start
#     bytes_recv_diff = bytes_recv_end - bytes_recv_start
    
#     kb_sent_per_sec = round(bytes_sent_diff / 1024 / interval, 2)
#     kb_recv_per_sec = round(bytes_recv_diff / 1024 / interval, 2)
    
#     system_data = {
#         "CPU Usage (%)": psutil.cpu_percent(interval=1),
#         "GPU Usage (%)": get_gpu_utilization(),
#         "RAM Usage (%)": psutil.virtual_memory().percent,
#         "Disk Usage (%)": psutil.disk_usage('/').percent,
#         "KB/s Sent": kb_sent_per_sec,
#         "KB/s Received": kb_recv_per_sec
#     }

#     print(system_data["CPU Usage (%)"])

#     return JsonResponse(system_data)

@api_view(['GET'])
def get_metrics(request):
    """Fetch the latest row of system monitor data."""
    try:
        latest_record = SystemMonitor.objects.latest('timestamp')
        serializer = SystemMonitorSerializer(latest_record)
        return Response(serializer.data)
    except SystemMonitor.DoesNotExist:
        return Response({'error': 'No records found'}, status=404)
    

def get_system_monitor_data(request):
    duration_map = {
        "live": timedelta(minutes=1),
        "day": timedelta(days=1),
        "week": timedelta(weeks=1),
        "month": timedelta(weeks=4),
        "year": timedelta(weeks=52),
    }

    duration = request.GET.get("duration", "live")  # Default to 1 min
    time_threshold = now() - duration_map.get(duration, timedelta(minutes=1))

    # print(SystemMonitor.objects.first().timestamp)  # Check one entry
    # print(time_threshold)

    # print(now())

    if not is_aware(time_threshold):
        time_threshold = make_aware(time_threshold)

    # Query filtered data
    data = SystemMonitor.objects.filter(timestamp__gte=time_threshold).values(
        "timestamp", "cpu_usage", "gpu_usage", "ram_usage", "disk_usage", "kb_sent", "kb_received"
    )
    
    # datetime.datetime(2025, 3, 21, 13, 40, 11, tzinfo=datetime.timezone.utc)


    # print(data)
    
    datalist = list(data)
    # for entry in datalist:
    #     entry['timestamp'] = entry['timestamp'].isoformat()

    return JsonResponse(datalist, safe=False)

def process_count(request):
    count = ProcessInfo.objects.count()
    return JsonResponse({"process_count": count})

def get_timestamp():
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def sse_stream_hardware(request):
    def stream_hardware_updates():
        """Stream real-time updates from HardwareChangeTracking."""
        last_timestamp = HardwareChangeTracking.objects.latest('timestamp').timestamp if HardwareChangeTracking.objects.exists() else None

        while True:
            # Get new hardware changes
            if last_timestamp:
                new_changes = HardwareChangeTracking.objects.filter(timestamp__gt=last_timestamp).order_by('timestamp')
            else:
                new_changes = HardwareChangeTracking.objects.all().order_by('timestamp')

            if new_changes.exists():
                for change in new_changes:
                    data = {
                        "timestamp": change.timestamp.strftime('%d-%m-%Y %H:%M:%S'),
                        "hw_id": change.hw_id,
                        "hw_type": change.hw_type,
                        "hw_description": change.hw_description,
                        "hw_status": change.hw_status,
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                    last_timestamp = change.timestamp
            time.sleep(1)  # Poll the database every 1 second

    response = StreamingHttpResponse(stream_hardware_updates(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    return response

# disp = display.Display()
# root = disp.screen().root

# def event_stream(queue):
#     """Generator function to stream events from the queue."""
#     while True:
#         event = queue.get()
#         if event is None:
#             break  # Stop streaming if None is received
#         yield f"data: {json.dumps(event)}\n\n"
        
def should_ignore_process(proc_name):
        process_name = proc_name.lower()

        # Ignore known system background processes
        if process_name in ignored_processes:
            return True

        # Ignore kernel worker threads (e.g., "kworker/14:1-rcu_par_gp")
        if process_name.startswith("kworker/"):
            return True 

        return False
        
# @csrf_exempt
# @require_GET
def sse_process_activity(request):
    """SSE endpoint for process activity."""
    # def get_processes():
    #     """Returns a set of (pid, name) tuples for running processes."""
    #     return {(p.pid, p.info['name']) for p in psutil.process_iter(['pid', 'name'])}
    
    def event_stream():
        previous_processes = set(psutil.process_iter(['pid', 'name']))
        process_count = defaultdict(int)
        while True:
            try:
                # Get current running processes
                current_processes = set(psutil.process_iter(['pid', 'name']))

                # Check for newly started applications
                new_processes = current_processes - previous_processes
                for process in new_processes:
                    try:
                        app_name = process.info['name']
                        app_pid = process.info['pid']
                        if process_count[app_name] == 0 and app_name not in excluded_processes and not should_ignore_process(app_name):  # Exclude specific processes
                            process_count[app_name] = 1
                            print(f"{app_name} started")
                            # process_activity.emit(f"{app_name} started")
                            yield f"data: {json.dumps({'message': f'{app_name} started'})}\n\n"
                            
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass

                # Check for closed applications
                terminated_processes = previous_processes - current_processes
                for process in terminated_processes:
                    try:
                        app_pid = process.info['pid']
                        app_name = process.info['name']
                        if process_count[app_name] == 1 and app_name not in excluded_processes and not should_ignore_process(app_name):  # Exclude specific processes
                            process_count[app_name] = 0
                            print(f"{app_name} closed")
                            # process_activity.emit(f"{app_name} closed")
                            yield(f"data: {json.dumps({'message': f'{app_name} closed'})}\n\n")
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass

                # Update previous processes
                previous_processes = current_processes
                time.sleep(1)
            except Exception as e:
                print(f"Error monitoring applications: {str(e)}")
    
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    # response['Connection'] = 'keep-alive'
    # print(response)
    return response

# @csrf_exempt
# @require_GET
def sse_file_activity(request):
    """SSE endpoint for file activity."""
    monitor = ActivityMonitor()
    
    def handle_file_activity(message):
        file_queue.put({'type': 'file', 'message': message})
        
    monitor.file_activity.connect(handle_file_activity)
    monitor.start()
        
    response = StreamingHttpResponse(event_stream(file_queue), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    return response

def get_active_window_title():
        """Fetch the title of the currently active window"""
        try:
            disp = display.Display()  # Reinitialize display
            root = disp.screen().root
            
            window_id = root.get_full_property(disp.intern_atom('_NET_ACTIVE_WINDOW'), X.AnyPropertyType)
            
            if not window_id or not window_id.value:
                return None  # No active window detected
            
            window = disp.create_resource_object('window', window_id.value[0])
            title = window.get_full_property(disp.intern_atom('_NET_WM_NAME'), 0)

            if title and title.value:
                return title.value.decode('utf-8')
        except Xlib.error.BadWindow:
            return None  # Ignore BadWindow errors
        except Exception as e:
            print(f"Error getting active window title: {e}")
            return None

        return None

# @csrf_exempt
# @require_GET
def sse_window_activity(request):
    """SSE endpoint for window activity."""
    
    def event_stream():
        previous_window = None
        while True:
            try:
                current_window = get_active_window_title()
                if current_window and current_window != previous_window:
                    # print(f"Active Window: {current_window}")
                    yield f"data: {json.dumps({'message': f'Switched to Window: {current_window}'})}\n\n"
                    previous_window = current_window
                time.sleep(1)
            except Exception as e:
                print(f"Error monitoring window activity: {str(e)}")
    
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    return response

def get_gpu_utilization():
    """Fetches GPU utilization if an NVIDIA GPU is present."""
    if not os.path.exists("/usr/bin/nvidia-smi"):  # Check if nvidia-smi exists
        return "N/A"
    try:
        output = subprocess.check_output(
            "nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits",
            shell=True, text=True
        )
        return int(output.strip())  # Convert to integer
    except Exception:
        return "N/A"
    
def get_timestamp():
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def get_usb_devices():
    """Fetch USB device details."""
    result = subprocess.run(['lsusb'], stdout=subprocess.PIPE)
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


@api_view(['GET'])
def get_historical_data(request):
    """Fetch historical system metrics from database."""
    records = SystemMonitor.objects.all().order_by('-timestamp')
    serializer = SystemMonitorSerializer(records, many=True)
    return Response(serializer.data)

@api_view(['GET', 'POST'])
def critical_files(request):
    """Fetch or add critical files."""
    if request.method == 'GET':
        files = CriticalFile.objects.all()
        serializer = CriticalFileSerializer(files, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        print(request.data)
        serializer = CriticalFileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
            "message": "File details added successfully",
            "file_data": serializer.data
        }, status=201)
        return Response(serializer.errors, status=400)
    
@api_view(['DELETE'])
def delete_file(request, hash):
    """Delete a critical file by ID."""
    print(hash)
    try:
        file = CriticalFile.objects.get(file_hash=hash)
        file.delete()
        return Response({"message": "File deleted successfully"}, status=200)
    except CriticalFile.DoesNotExist:
        return Response({"error": "File not found"}, status=404)
    
def get_process_resources(request):
    """Fetch process resource usage."""
    records = ProcessResources.objects.all().order_by('-timestamp')
    serializer = ProcessResourcesSerializer(records, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def kill_process(request):
    """Kill a process by its PID."""
    pid = request.data.get('pid')
    if not pid:
        return Response({"error": "PID is required"}, status=400)
    
    try:
        pid = int(pid)
        process = psutil.Process(pid)
        process.terminate()  # Attempt to terminate the process
        return Response({"message": f"Process with PID {pid} terminated successfully"}, status=200)
    except psutil.NoSuchProcess:
        return Response({"error": f"No process found with PID {pid}"}, status=404)
    except psutil.AccessDenied:
        return Response({"error": f"Permission denied to terminate process with PID {pid}"}, status=403)
    except ValueError:
        return Response({"error": "Invalid PID format"}, status=400)
    except Exception as e:
        return Response({"error": f"An error occurred: {str(e)}"}, status=500)

# @api_view(['GET'])
# def get_live_data(request):
#     """Fetch live hardware data from Redis."""
#     keys = redis_client.keys('*')
#     data = {}

#     for key in keys:
#         key_decoded = key.decode()
#         value = redis_client.get(key_decoded)

#         if value:
#             try:
#                 data[key_decoded] = json.loads(value.decode())
#             except json.JSONDecodeError:
#                 data[key_decoded] = {"error": "Invalid JSON stored in Redis"}
#         else:
#             data[key_decoded] = {"error": "No data available"}

# #     return Response(data)

# @api_view(['GET'])
# def get_historical_data(request):
#     """Fetch historical hardware data."""
#     records = HardwareMonitor.objects.all().order_by('-timestamp')
#     serializer = HardwareMonitorSerializer(records, many=True)
#     return Response(serializer.data)