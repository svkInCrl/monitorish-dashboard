
export interface SystemDetails {
  timestamp: string;
  host_name: string;
  interface_count: number;
  cpu_count: number;
  cpu_freq: number;
  ram_size: number;
  virtual_mem_size: number;
  gpu_size: number | null;
  os_type: string;
  os_details: string;
  os_release: string;
  system_arch: string;
  kernel_version: string | null;
  boot_time: string | null;
}
