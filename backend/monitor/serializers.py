from rest_framework import serializers
from .models import SystemMonitor, SystemDetails, UserActivity, ProcessInfo, ProcessResources, SoftwareMonitor, InstalledSoftware, InitialHardwareConfig, HardwareChangeTracking, CriticalFile
import hashlib
import getpass
import datetime

class ProcessInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessInfo
        fields = [
            "process_name",
            "path",
            "pid",
            "ppid",
            "active_connections",
            "first_seen",
        ]

class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = '__all__'
        
class ProcessResourcesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessResources
        fields = [
            "pid",
            "cpu_usage",
            "ram_usage",
        ]
        
class InitialHardwareConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = InitialHardwareConfig
        fields = '__all__'
        
class SoftwareMonitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstalledSoftware
        fields = '__all__'

class SystemMonitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemMonitor
        fields = '__all__'
        
class HardwareChangeTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = HardwareChangeTracking
        fields = '__all__'
        
class SystemDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemDetails
        fields = '__all__'

class CriticalFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriticalFile
        fields = ['file_path', 'file_name', 'file_hash', 'file_type', 'added_by', 'added_at']
        read_only_fields = ['file_name', 'file_hash', 'file_type', 'added_by', 'added_at']
    
    def create(self, validated_data):
        """Calculate hash before saving the file."""
        file_path = validated_data.get('file_path')
        validated_data['file_name'] = file_path.split('/')[-1]
        validated_data['file_type'] = file_path.split('.')[-1]
        validated_data['added_by'] = getpass.getuser()
        validated_data['added_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        # Calculate SHA-256 file hash
        validated_data['file_hash'] = self.calculate_file_hash(file_path)
        
        return super().create(validated_data)
    
    def calculate_file_hash(self, file_path):
        """Computes the SHA-256 hash of a file."""
        sha256_hash = hashlib.sha256()
        try:
            with open(file_path, 'rb') as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except Exception as e:
            return f"Error calculating hash: {str(e)}"

# class HardwareMonitorSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = HardwareMonitor
#         fields = '__all__'