# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class HardwareChangeTracking(models.Model):
    timestamp = models.DateTimeField(primary_key=True)  # The composite primary key (timestamp, hw_id, hw_status) found, that is not supported. The first column is selected.
    hw_id = models.CharField(max_length=255)
    hw_type = models.CharField(max_length=255, blank=True, null=True)
    hw_description = models.TextField(blank=True, null=True)
    hw_status = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'Hardware_Change_Tracking'
        unique_together = (('timestamp', 'hw_id', 'hw_status'),)


class InitialHardwareConfig(models.Model):
    timestamp = models.DateTimeField()
    hw_id = models.CharField(max_length=255, primary_key=True)
    hw_type = models.CharField(max_length=255, blank=True, null=True)
    hw_description = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Initial_Hardware_Config'


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.IntegerField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.IntegerField()
    is_active = models.IntegerField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.PositiveSmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class FilePaths(models.Model):
    file_name = models.CharField(primary_key=True, max_length=255)
    paths = models.TextField()
    last_updated = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'file_paths'


class InstalledSoftware(models.Model):
    sw_id = models.CharField(primary_key=True, max_length=255)
    package_manager = models.CharField(max_length=20, blank=True, null=True)
    sw_name = models.CharField(max_length=255, blank=True, null=True)
    sw_privilege = models.CharField(max_length=50, blank=True, null=True)
    path = models.CharField(max_length=255, blank=True, null=True)
    installation_timestamp = models.DateTimeField(blank=True, null=True)
    version = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'installed_software'


class LogFileMonitoring(models.Model):
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=255)
    action = models.CharField(max_length=50)
    checksum = models.CharField(max_length=64, blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'log_file_monitoring'


class LoginEvents(models.Model):
    event = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'login_events'


class CriticalFile(models.Model):
    file_path = models.TextField(primary_key=True)  # Set file_path as primary key
    file_name = models.CharField(max_length=255)
    file_hash = models.CharField(max_length=64)
    file_type = models.CharField(max_length=50)
    added_by = models.CharField(max_length=100)
    added_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'critical_file'


class MonitorHardwaremonitor(models.Model):
    id = models.BigAutoField(primary_key=True)
    timestamp = models.DateTimeField()
    hw_id = models.CharField(max_length=50)
    hw_type = models.CharField(max_length=100)
    hw_description = models.TextField()
    hw_status = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'monitor_hardwaremonitor'


class MonitorSystemmonitor(models.Model):
    id = models.BigAutoField(primary_key=True)
    timestamp = models.DateTimeField()
    cpu_usage = models.FloatField()
    gpu_usage = models.FloatField(blank=True, null=True)
    ram_usage = models.FloatField()
    disk_usage = models.FloatField()
    kb_sent = models.FloatField()
    kb_received = models.FloatField()

    class Meta:
        managed = False
        db_table = 'monitor_systemmonitor'


class NetworkInterfaces(models.Model):
    timestamp = models.DateTimeField(primary_key=True)  # The composite primary key (timestamp, interface_name, status) found, that is not supported. The first column is selected.
    interface_name = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    duplex = models.CharField(max_length=50, blank=True, null=True)
    speed = models.IntegerField(blank=True, null=True)
    mtu = models.IntegerField(blank=True, null=True)
    ipv4_address = models.CharField(max_length=255, blank=True, null=True)
    ipv4_netmask = models.CharField(max_length=255, blank=True, null=True)
    ipv4_broadcast = models.CharField(max_length=255, blank=True, null=True)
    ipv6_address = models.CharField(max_length=255, blank=True, null=True)
    mac_address = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'network_interfaces'
        unique_together = (('timestamp', 'interface_name', 'status'),)


class OpenPorts(models.Model):
    port_number = models.IntegerField()
    protocol = models.CharField(max_length=10)
    process_name = models.CharField(max_length=255, blank=True, null=True)
    pid = models.IntegerField(blank=True, null=True)
    command_line = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'open_ports'


class ProcessInfo(models.Model):
    process_name = models.CharField(primary_key=True, max_length=255)  # The composite primary key (process_name, path) found, that is not supported. The first column is selected.
    path = models.CharField(max_length=255)
    pid = models.IntegerField()
    ppid = models.IntegerField(blank=True, null=True)
    active_connections = models.IntegerField(blank=True, null=True)
    first_seen = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'process_info'
        unique_together = (('process_name', 'path'),)


class ProcessResources(models.Model):
    pid = models.IntegerField(primary_key=True)  # The composite primary key (pid, timestamp) found, that is not supported. The first column is selected.
    cpu_usage = models.FloatField(blank=True, null=True)
    ram_usage = models.FloatField(blank=True, null=True)
    data_sent_mb = models.FloatField(blank=True, null=True)
    data_received_mb = models.FloatField(blank=True, null=True)
    timestamp = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'process_resources'
        unique_together = (('pid', 'timestamp'),)


class SoftwareMonitor(models.Model):
    sw_id = models.CharField(max_length=255, blank=True, null=True)
    package_manager = models.CharField(max_length=20, blank=True, null=True)
    sw_name = models.CharField(max_length=255, blank=True, null=True)
    sw_privilege = models.CharField(max_length=50, blank=True, null=True)
    sw_path = models.CharField(max_length=255, blank=True, null=True)
    version = models.CharField(max_length=50, blank=True, null=True)
    action = models.CharField(max_length=20, blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'software_monitor'


class SystemDetails(models.Model):
    timestamp = models.DateTimeField(primary_key=True)
    host_name = models.CharField(max_length=255, blank=True, null=True)
    interface_count = models.IntegerField(blank=True, null=True)
    cpu_count = models.IntegerField(blank=True, null=True)
    cpu_freq = models.FloatField(blank=True, null=True)
    ram_size = models.FloatField(blank=True, null=True)
    virtual_mem_size = models.FloatField(blank=True, null=True)
    gpu_size = models.FloatField(blank=True, null=True)
    os_type = models.CharField(max_length=50, blank=True, null=True)
    os_details = models.TextField(blank=True, null=True)
    os_release = models.CharField(max_length=50, blank=True, null=True)
    system_arch = models.CharField(max_length=50, blank=True, null=True)
    kernel_version = models.CharField(max_length=255, blank=True, null=True)
    boot_time = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'system_details'


class SystemMonitor(models.Model):
    timestamp = models.DateTimeField()
    cpu_usage = models.FloatField(blank=True, null=True)
    gpu_usage = models.FloatField(blank=True, null=True)
    ram_usage = models.FloatField(blank=True, null=True)
    disk_usage = models.FloatField(blank=True, null=True)
    kb_sent = models.FloatField(blank=True, null=True)
    kb_received = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'system_monitor'


class UserActivity(models.Model):
    event_type = models.CharField(max_length=50, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'user_activity'
