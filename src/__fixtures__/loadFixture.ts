import fs from 'fs';
import path from 'path';

export function loadText(filename: string) {
  const fixturePath = path.join(__dirname, filename);
  return fs.readFileSync(fixturePath, 'utf-8');
}