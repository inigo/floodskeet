// Types for our domain models
export interface WaterLevel {
  timestamp: Date;
  height: number;
}

export interface StationData {
  riverName: string;
  stationName: string;
  typicalHigh: number;
  typicalLow: number;
  maxLevel: number;
  minLevel: number;
  warningLevel: number;
}
