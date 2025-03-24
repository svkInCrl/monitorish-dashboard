from django.urls import path
from .views import delete_file, SystemDetailsListView,sse_process_activity, sse_file_activity, sse_window_activity, sse_stream_hardware, process_count, get_metrics, get_historical_data, get_system_monitor_data, ProcessInfoListView, SoftwareInfoListView, InitialHardwareConfigListView, HardwareChangeTrackingListView, ProcessResourceListView, critical_files

urlpatterns = [
    path('metrics/', get_metrics, name='get_metrics'),
    path('historical/', get_historical_data, name='get_historical_data'),
    path('files/', critical_files, name='critical_files'),
    path('files/<str:hash>/', delete_file, name='delete_file'),
    path("process-info/", ProcessInfoListView.as_view(), name="process-info"),
    path("software-info/", SoftwareInfoListView.as_view(), name="software-info"),
    path('system-info/', get_system_monitor_data, name='system-info'),
    path("hardware-info/", InitialHardwareConfigListView.as_view(), name="hardware-info"),
    path("hardware-change-tracking/", HardwareChangeTrackingListView.as_view(), name="hardware-change-tracking"),
    path("process-resources/", ProcessResourceListView.as_view(), name="process-resources"),
    path('process-count/', process_count, name='process-count'),
    path("sse_stream_hardware/", sse_stream_hardware, name="sse_stream"),
    # path("sse_stream_activity/", sse_view, name="sse_stream_activity"),
    path('system-details/', SystemDetailsListView.as_view(), name='system-details'),
    path('sse_process_activity/', sse_process_activity, name='process_activity'),
    # path('sse_file_activity/', sse_file_activity, name = 'file_activity'),
    path('sse_window_activity/', sse_window_activity, name = 'window_activity')
]

