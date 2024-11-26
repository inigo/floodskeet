

import { Bluesky } from './Bluesky';
import process from 'process';
import { LevelDownloader } from './LevelDownloader';
import { Formatter } from './Formatter';
import { FloodSkeeter } from './FloodSkeet';

export const handler: any = async (_event: any) => {
  const username = process.env.BLUESKY_USERNAME!;
  const password = process.env.BLUESKY_PASSWORD!;

  console.log("Triggering with username "+username);
  const tweeter = new Bluesky(username, password)
  const skeeter = new FloodSkeeter(new LevelDownloader(), new Formatter(), tweeter, true)

  const stationIds = [ 7075, 7074, 7076 ]
  for (const id of stationIds) {
    await skeeter.postRiverDetails(id);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Success!' })
  };
};