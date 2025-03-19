
export interface HardwareDevice {
  timestamp: string;
  hw_id: string;
  hw_type: string;
  hw_description: string;
  hw_status: string;
  battery_percentage: number | null;
  power_source: string | null;
}

export interface HardwareUpdate {
  timestamp: string;
  HW_ID: string;
  HW_Status: string;
  HW_Description: string;
}
