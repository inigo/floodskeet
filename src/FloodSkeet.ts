import { LevelDownloader } from './LevelDownloader';
import { Formatter } from './Formatter';
import { Bluesky } from './Bluesky';
import * as dotenv from 'dotenv';
import * as process from 'process';

export class FloodSkeeter {
  private previousCount = 10

  constructor(private levelDownloader: LevelDownloader, private formatter: Formatter, private bluesky: Bluesky, private sendTweets: boolean = false) {}

  async postRiverDetails(stationId: number) {
    const stationData = await this.levelDownloader.getStationData(stationId)
    const levels = await this.levelDownloader.getWaterLevels(stationId)

    const lastLevels = levels.slice(Math.max(levels.length - this.previousCount, 0));
    const lastLevel = levels.at(-1)
    if (lastLevel && lastLevel.height > stationData.typicalHigh) {
      const msg = this.formatter.formatMessage(stationData, lastLevels)
      console.log("Sending message: "+msg)
      if (this.sendTweets) {
        await this.bluesky.post(msg)
      }
    }
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
//   await sendTestTweets()
// }