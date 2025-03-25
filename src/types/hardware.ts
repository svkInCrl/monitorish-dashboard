
export interface HardwareDevice {
  timestamp: string;
  hw_id: string;
  hw_type: string;
  hw_description: string;
}

export interface HardwareUpdate {
  timestamp: string;
  hw_id: string;
  hw_type: string;
  hw_description: string;
  hw_status: string;
}
