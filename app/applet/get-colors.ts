import { Vibrant } from 'node-vibrant/node';
import fs from 'fs';

async function run() {
  const res = await fetch('https://drive.google.com/uc?export=download&id=1Fjr3y0RrilzVO_Bj9N3ZMnFrnotQNpkC');
  const buffer = await res.arrayBuffer();
  fs.writeFileSync('logo.png', Buffer.from(buffer));
  const palette = await Vibrant.from('logo.png').getPalette();
  console.log('Vibrant:', palette.Vibrant?.hex);
  console.log('DarkVibrant:', palette.DarkVibrant?.hex);
  console.log('LightVibrant:', palette.LightVibrant?.hex);
  console.log('Muted:', palette.Muted?.hex);
  console.log('DarkMuted:', palette.DarkMuted?.hex);
  console.log('LightMuted:', palette.LightMuted?.hex);
}
run();
