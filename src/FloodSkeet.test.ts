import { FloodSkeeter } from './FloodSkeet'
import { LevelDownloader } from './LevelDownloader'
import { Formatter } from './Formatter'
import { Bluesky } from './Bluesky'
import { StationData, WaterLevel } from './types'

describe('FloodSkeeter', () => {
  let levelDownloader: jest.Mocked<LevelDownloader>
  let formatter: jest.Mocked<Formatter>
  let bluesky: jest.Mocked<Bluesky>
  let floodSkeeter: FloodSkeeter

  const mockStationData: StationData = {
    riverName: 'Test River',
    stationName: 'Test Station',
    typicalHigh: 2.0,
    typicalLow: 0.5,
    maxLevel: 4.0,
    minLevel: 0.0,
    warningLevel: 3.0
  }

  const createWaterLevel = (height: number): WaterLevel => ({
    timestamp: new Date(),
    height
  })

  beforeEach(() => {
    levelDownloader = {
      getStationData: jest.fn(),
      getWaterLevels: jest.fn()
    } as any

    formatter = {
      formatMessage: jest.fn()
    } as any

    bluesky = {
      post: jest.fn()
    } as any

    floodSkeeter = new FloodSkeeter(levelDownloader, formatter, bluesky)
  })

  it('should post message when water level is above typical high', async () => {
    const waterLevels = [
      createWaterLevel(1.0),
      createWaterLevel(1.5),
      createWaterLevel(2.5) // Above typical high
    ]

    levelDownloader.getStationData.mockResolvedValue(mockStationData)
    levelDownloader.getWaterLevels.mockResolvedValue(waterLevels)
    formatter.formatMessage.mockReturnValue('Test message')

    await floodSkeeter.postRiverDetails(123)

    expect(levelDownloader.getStationData).toHaveBeenCalledWith(123)
    expect(levelDownloader.getWaterLevels).toHaveBeenCalledWith(123)
    expect(formatter.formatMessage).toHaveBeenCalledWith(mockStationData, waterLevels)
    expect(bluesky.post).not.toHaveBeenCalled() // sendTweets defaults to false
  })

  it('should not post message when water level is below typical high', async () => {
    const waterLevels = [
      createWaterLevel(1.0),
      createWaterLevel(1.5),
      createWaterLevel(1.8) // Below typical high
    ]

    levelDownloader.getStationData.mockResolvedValue(mockStationData)
    levelDownloader.getWaterLevels.mockResolvedValue(waterLevels)

    await floodSkeeter.postRiverDetails(123)

    expect(formatter.formatMessage).not.toHaveBeenCalled()
    expect(bluesky.post).not.toHaveBeenCalled()
  })

  it('should post to Bluesky when sendTweets is true', async () => {
    const waterLevels = [createWaterLevel(2.5)] // Above typical high
    floodSkeeter = new FloodSkeeter(levelDownloader, formatter, bluesky, true)

    levelDownloader.getStationData.mockResolvedValue(mockStationData)
    levelDownloader.getWaterLevels.mockResolvedValue(waterLevels)
    formatter.formatMessage.mockReturnValue('Test message')

    await floodSkeeter.postRiverDetails(123)

    expect(bluesky.post).toHaveBeenCalledWith('Test message')
  })

  describe('selectIntervalLevels', () => {
    const now = new Date()
    const createDate = (hoursAgo: number) =>
      new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    it('selects readings at 6 hour intervals going back 36 hours', () => {
      const levels = [
        { timestamp: createDate(37), height: 0.9 },
        { timestamp: createDate(25), height: 1.0 },
        { timestamp: createDate(23), height: 1.1 },
        { timestamp: createDate(19), height: 1.2 },
        { timestamp: createDate(12), height: 1.3 },
        { timestamp: createDate(7), height: 1.4 },
        { timestamp: createDate(6), height: 1.5 },
        { timestamp: createDate(3), height: 1.6 },
        { timestamp: createDate(0), height: 1.7 },
      ];

      const result = floodSkeeter.selectIntervalLevels(levels);

      expect(result).toEqual([
        { timestamp: createDate(0), height: 1.7 },  // latest
        { timestamp: createDate(6), height: 1.5 },  // 6 hours ago
        { timestamp: createDate(12), height: 1.3 }, // 12 hours ago
        { timestamp: createDate(19), height: 1.2 }, // 18 hours ago
        { timestamp: createDate(25), height: 1.0 }, // 24 hours ago
        { timestamp: createDate(37), height: 0.9 }, // 30 hours ago - duped
        { timestamp: createDate(37), height: 0.9 }, // 36 hours ago
      ]);
    });

    it('handles empty input', () => {
      expect(floodSkeeter.selectIntervalLevels([])).toEqual([]);
    });

    it('handles data span less than 24 hours', () => {
      const levels = [
        { timestamp: createDate(10), height: 1.0 },
        { timestamp: createDate(6), height: 1.1 },
        { timestamp: createDate(0), height: 1.2 },
      ];

      const result = floodSkeeter.selectIntervalLevels(levels);

      expect(result).toEqual([
        { timestamp: createDate(0), height: 1.2 },
        { timestamp: createDate(6), height: 1.1 },
      ]);
    });
  });
})