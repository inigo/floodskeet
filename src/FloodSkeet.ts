import { LevelDownloader } from './LevelDownloader';
import { Formatter } from './Formatter';
import { Bluesky } from './Bluesky';
import * as dotenv from 'dotenv';
import * as process from 'process';
import { WaterLevel } from './types';

export class FloodSkeeter {

  constructor(private levelDownloader: LevelDownloader, private formatter: Formatter, private bluesky: Bluesky, private sendTweets: boolean = false) {}

  async postRiverDetails(stationId: number) {
    const stationData = await this.levelDownloader.getStationData(stationId)
    const levels = await this.levelDownloader.getWaterLevels(stationId)

    const lastLevels = this.selectIntervalLevels(levels);
    const lastLevel = levels.at(-1)
    if (lastLevel && lastLevel.height > stationData.typicalHigh) {
      const msg = this.formatter.formatMessage(stationData, lastLevels)
      console.log("Sending message: "+msg)
      const stationUrl = "https://check-for-flooding.service.gov.uk/station/"+stationId
      if (this.sendTweets) {
        await this.bluesky.post(msg, stationUrl)
      }
    }
  }

  selectIntervalLevels(levels: WaterLevel[]): WaterLevel[] {
    if (levels.length === 0) return [];

    const latestReading = levels[levels.length - 1];
    const result = [latestReading];
    const hourIntervals = [6, 12, 18, 24, 30, 36];

    for (const hours of hourIntervals) {
      const targetTime = new Date(latestReading.timestamp.getTime() - hours * 60 * 60 * 1000);
      const reading = levels.findLast(level => level.timestamp <= targetTime);
      if (reading) result.push(reading);
    }

    return result.reverse();
  }

}

// @ts-ignore
async function sendTestTweets() {
// @todo This may be wrong, if launched from the root directory
  dotenv.config({ path: '../.env' });

  const tweeter = new Bluesky(process.env.BLUESKY_USERNAME!, process.env.BLUESKY_PASSWORD!)
  const skeeter = new FloodSkeeter(new LevelDownloader(), new Formatter(), tweeter, false)

  const stationIds = [ 7075, 7074, 7076 ]
  for (const id of stationIds) {
    await skeeter.postRiverDetails(id);
  }
}

// if (1+1==3) {
//   sendTestTweets()
// }