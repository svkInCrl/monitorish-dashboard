from django.urls import re_path
from .consumers import ProcessConsumer
from .consumers import SystemMonitorConsumer

websocket_urlpatterns = [
    re_path(r"ws/process-details/$", ProcessConsumer.as_asgi()),
    re_path(r"ws/system-monitor/$", SystemMonitorConsumer.as_asgi()),

]
