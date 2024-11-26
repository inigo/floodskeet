import { LevelDownloader } from './LevelDownloader';
import { StationData, WaterLevel } from './types.ts';
import { loadText } from './__fixtures__/loadFixture.ts';

// Test helper class to access protected methods
class TestLevelDownloader extends LevelDownloader {
  public testGetDownloadUrl(stationId: number): string {
    return this.getCsvDownloadUrl(stationId);
  }

  public testParseCsvData(csv: string): WaterLevel[] {
    return this.parseCsvData(csv);
  }

  public testDownloadData(stationId: number): Promise<string> {
    return this.downloadCsvData(stationId);
  }

  public testParseJsonStationData(htmlText: string): JSON {
    return this.extractJsonStationData(htmlText);
  }

  public testRetrieveRelevantJsonStationData(json: any): StationData {
    return this.retrieveRelevantJsonStationData(json);
  }

}

describe('LevelDownloader', () => {
  let downloader: TestLevelDownloader;

  beforeEach(() => {
    downloader = new TestLevelDownloader();
  });

  describe('getDownloadUrl', () => {
    it('constructs correct URL for station ID', () => {
      const url = downloader.testGetDownloadUrl(1234);
      expect(url).toBe('https://check-for-flooding.service.gov.uk/station-csv/1234');
    });
  });

  describe('parseCsvData', () => {
    it('parses valid CSV data correctly', () => {
      const csvData = `Timestamp (UTC),Height (m)
2024-11-25T16:00:00Z,2.30
2024-11-25T16:15:00Z,2.31`;

      const result = downloader.testParseCsvData(csvData);

      expect(result).toEqual([
        {
          timestamp: new Date('2024-11-25T16:00:00Z'),
          height: 2.30
        },
        {
          timestamp: new Date('2024-11-25T16:15:00Z'),
          height: 2.31
        }
      ]);
    });

    it('handles empty lines', () => {
      const csvData = `Timestamp (UTC),Height (m)
2024-11-25T16:00:00Z,2.30

2024-11-25T16:15:00Z,2.31
`;

      const result = downloader.testParseCsvData(csvData);
      expect(result).toHaveLength(2);
    });

    it('handles empty input', () => {
      const result = downloader.testParseCsvData('');
      expect(result).toEqual([]);
    });
  });

  describe('downloadData', () => {
    beforeEach(() => {
      // Mock fetch globally
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('handles successful response', async () => {
      const mockResponse = 'mock,csv,data';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockResponse)
      });

      const result = await downloader.testDownloadData(1234);
      expect(result).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://check-for-flooding.service.gov.uk/station-csv/1234'
      );
    });

    it('throws error on unsuccessful response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(downloader.testDownloadData(1234))
        .rejects
        .toThrow('Failed to download data: Not Found');
    });
  });

  describe('getWaterLevels', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('downloads and parses data correctly', async () => {
      const mockCsvData = `Timestamp (UTC),Height (m)
2024-11-25T16:00:00Z,2.30
2024-11-25T16:15:00Z,2.31`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockCsvData)
      });

      const result = await downloader.getWaterLevels(1234);

      expect(result).toEqual([
        {
          timestamp: new Date('2024-11-25T16:00:00Z'),
          height: 2.30
        },
        {
          timestamp: new Date('2024-11-25T16:15:00Z'),
          height: 2.31
        }
      ]);
    });
  });


  describe('extractJsonStationData', () => {
    it('extract JSON from the HTML', () => {
      const html = loadText("bulstake.htm")
      const extractedJson = downloader.testParseJsonStationData(html)
      // @ts-ignore
      expect(extractedJson["station"]["river"]).toBe('Bulstake Stream')
    });
  });


  describe('retrieveRelevantJsonStationData', () => {
    it('parses JSON from the HTML', () => {
      const json = JSON.parse( loadText("bulstake.json") )
      const stationData = downloader.testRetrieveRelevantJsonStationData(json)

      expect(stationData.riverName).toBe('Bulstake Stream');
      expect(stationData.stationName).toBe('New Botley');
      expect(stationData.warningLevel).toBe(2.763);
      expect(stationData.maxLevel).toBe(3.14);
      expect(stationData.minLevel).toBe(0.74);
      expect(stationData.typicalHigh).toBe(2.01);
      expect(stationData.typicalLow).toBe(0.87);
    });
  });


  describe('getWaterLevels', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('downloads and parses data correctly', async () => {
      const mockHtml = loadText("bulstake.htm");

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      });

      const result = await downloader.getStationData(1234);

      expect(result).toEqual(
        {
           "typicalHigh": 2.01,
           "typicalLow": 0.87,
           "maxLevel": 3.14,
           "minLevel": 0.74,
           "riverName": "Bulstake Stream",
           "stationName": "New Botley",
           "warningLevel": 2.763,
        }
      );
    });
  });



});