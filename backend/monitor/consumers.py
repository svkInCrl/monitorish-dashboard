import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ProcessDetails
from .serializers import ProcessDetailsSerializer
import psutil
import asyncio

class ProcessConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def receive(self, text_data):
        latest_processes = ProcessDetails.objects.order_by("-timestamp")[:10]
        serializer = ProcessDetailsSerializer(latest_processes, many=True)
        await self.send(json.dumps(serializer.data))

class SystemMonitorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()  # Accept WebSocket connection
        self.running = True
        asyncio.create_task(self.send_system_data())  # Start streaming data

    async def disconnect(self, close_code):
        self.running = False  # Stop sending updates

    async def send_system_data(self):
        """Continuously send system data to the client."""
        while self.running:
            system_data = {
                "cpu_usage": psutil.cpu_percent(interval=1),
                "ram_usage": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent,
                "network_sent": psutil.net_io_counters().bytes_sent,
                "network_received": psutil.net_io_counters().bytes_recv,
            }
            await self.send(text_data=json.dumps(system_data))  # Send data as JSON
            await asyncio.sleep(2)  # Send data every 2 seconds