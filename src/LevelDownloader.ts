import { WaterLevel, StationData } from './types';

export class LevelDownloader {
  private readonly baseCsvUrl = "https://check-for-flooding.service.gov.uk/station-csv/";
  private readonly baseStationUrl = "https://check-for-flooding.service.gov.uk/station/";

  public async getWaterLevels(stationId: number): Promise<WaterLevel[]> {
    const csvData = await this.downloadCsvData(stationId);
    return parseCsvData(csvData);
  }

  public async getStationData(stationId: number): Promise<StationData> {
    const stationHtml = await this.downloadStationData(stationId);
    const stationJson = this.extractJsonStationData(stationHtml);
    return this.retrieveRelevantJsonStationData(stationJson);
  }

  protected async downloadCsvData(stationId: number): Promise<string> {
    const url = this.getCsvDownloadUrl(stationId);
    return await this.download(url);
  }

  protected async downloadStationData(stationId: number): Promise<string> {
    const url = this.getStationDownloadUrl(stationId);
    return await this.download(url);
  }

  private async download(url: string) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download data: ${response.statusText}`);
    }

    return await response.text();
  }

  protected getCsvDownloadUrl(stationId: number): string {
    return `${this.baseCsvUrl}${stationId}`;
  }

  protected retrieveRelevantJsonStationData(json: any): StationData {
    // Parse the warning level, handling potential undefined values
    const warningLevel = json.imtdThresholds?.warning?.threshold_value
      ? parseFloat(json.imtdThresholds.warning.threshold_value)
      : 0;

    return {
      riverName: json.station.river,
      stationName: json.station.name,
      typicalHigh: parseFloat(json.station.percentile5),
      typicalLow: parseFloat(json.station.percentile95),
      maxLevel: parseFloat(json.station.porMaxValue),
      minLevel: parseFloat(json.station.porMinValue),
      warningLevel: warningLevel
    };
  }

  protected extractJsonStationData(htmlText: string): JSON {
    const regex = /window\.flood\.model\s*=\s*({[\s\S]*?})\s*window\.flood\.model\.id/;
    const match = htmlText.match(regex);

    if (!match || !match[1]) {
      throw new Error('Could not find flood model JSON in HTML content');
    }

    try {
      // Parse the extracted JSON string
      return JSON.parse(match[1].trim());
    } catch (error) {
      throw new Error(
        `Failed to parse flood data JSON: ${error}\n` +
        `Extracted content: ${match[1].slice(0, 100)}...`
      );
    }
  }

  protected getStationDownloadUrl(stationId: number): string {
    return `${this.baseStationUrl}${stationId}`;
  }


}

export function parseCsvData(csvText: string): WaterLevel[] {
  const lines = csvText.trim().split('\n');

  // Remove header row and filter out any empty lines
  const dataLines = lines.slice(1).filter(line => line.length > 0);

  return dataLines.map(line => {
    const [timestamp, height] = line.split(',');

    return {
      timestamp: new Date(timestamp),
      height: parseFloat(height)
    };
  });
}