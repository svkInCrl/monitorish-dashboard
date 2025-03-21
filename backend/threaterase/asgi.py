"""
ASGI config for threaterase project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import monitor.routing
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from corsheaders.middleware import CorsMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'threaterase.settings')

application = CorsMiddleware(ProtocolTypeRouter({
    "http" : get_asgi_application(),
    "websocket" : URLRouter(monitor.routing.websocket_urlpatterns)
        }) )
