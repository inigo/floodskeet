import { StationData, WaterLevel } from './types';

/**
 * Converts measurements into a message.
 */
export class Formatter {
  /** Expects measurements ordered with the newest last in the array. */
  formatMessage(station: StationData, measurements: WaterLevel[]): string {
    switch (measurements.length) {
      case 0:
        return `No information for ${station.riverName} / ${station.stationName}`;
      case 1:
        return this.messageText(station, measurements[measurements.length - 1]);
      case 2:
        return this.messageText(station, measurements[measurements.length - 1], measurements[measurements.length - 2]);
      default:
        return this.messageText(station, measurements[measurements.length - 1], measurements[measurements.length - 2]) +
          " " + this.formatLevelGraph(station, measurements);
    }
  }

  messageText(s: StationData, m: WaterLevel, previous?: WaterLevel): string {
    if (previous && m.height >= (s.typicalHigh * 1.5) && m.height > previous.height) {
      return `RIVER VERY HIGH AND RISING at ${s.riverName} / ${s.stationName} - at ${m.height.toFixed(2)} m (↑ from ${previous.height.toFixed(2)} m) compared to typical high of ${s.typicalHigh.toFixed(2)} m`;
    }
    if (previous && m.height >= (s.typicalHigh * 1.5) && m.height === previous.height) {
      return `RIVER VERY HIGH at ${s.riverName} / ${s.stationName} - ${m.height.toFixed(2)} m (stable) compared to typical high of ${s.typicalHigh.toFixed(2)} m`;
    }
    if (previous && m.height >= (s.typicalHigh * 1.5) && m.height < previous.height) {
      return `RIVER VERY HIGH at ${s.riverName} / ${s.stationName} - ${m.height.toFixed(2)} m (↓ from ${previous.height.toFixed(2)} m) compared to typical high of ${s.typicalHigh.toFixed(2)} m`;
    }
    if (!previous && m.height >= (s.typicalHigh * 1.5)) {
      return `RIVER VERY HIGH at ${s.riverName} / ${s.stationName} - ${m.height.toFixed(2)} m compared to typical high of ${s.typicalHigh.toFixed(2)} m`;
    }
    if (previous && m.height > s.typicalHigh && m.height > previous.height) {
      return `RIVER HIGH at ${s.riverName} / ${s.stationName} - ${m.height.toFixed(2)} m (↑ from ${previous.height.toFixed(2)} m) compared to typical high of ${s.typicalHigh.toFixed(2)} m`;
    }
    if (previous && m.height > s.typicalHigh && m.height === previous.height) {
      return `RIVER HIGH at ${s.riverName} / ${s.stationName} - ${m.height.toFixed(2)} m (stable) compared to typical high of ${s.typicalHigh.toFixed(2)} m`;
    }
    if (previous && m.height > s.typicalHigh && m.height < previous.height) {
      return `RIVER HIGH at ${s.riverName} / ${s.stationName} - ${m.height.toFixed(2)} m (↓ from ${previous.height.toFixed(2)} m) compared to typical high of ${s.typicalHigh.toFixed(2)} m`;
    }
    if (!previous && m.height > s.typicalHigh) {
      return `RIVER HIGH at ${s.riverName} / ${s.stationName} - at ${m.height.toFixed(2)} m compared to typical high of ${s.typicalHigh.toFixed(2)} m`;
    }
    return `River level at ${s.riverName} / ${s.stationName} is at ${m.height.toFixed(2)} m`;
  }

  formatLevelGraph(station: StationData, measurements: WaterLevel[]): string {
    return measurements
      .map(m => this.percentageAboveNormal(station, m))
      .map(p => this.toBlock(p))
      .join("");
  }

  private percentageAboveNormal(s: StationData, m: WaterLevel): number {
    return (m.height - s.typicalHigh) / (s.typicalHigh - s.typicalLow);
  }

  private toBlock(percentage: number): string {
    if (percentage <= (1.0/8.0)) return "▁";
    if (percentage <= (2.0/8.0)) return "▂";
    if (percentage <= (3.0/8.0)) return "▃";
    if (percentage <= (4.0/8.0)) return "▄";
    if (percentage <= (5.0/8.0)) return "▅";
    if (percentage <= (6.0/8.0)) return "▆";
    if (percentage <= (7.0/8.0)) return "▇";
    return "█";
  }
}