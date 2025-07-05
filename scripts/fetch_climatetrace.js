import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse';

const streamPipeline = promisify(pipeline);

const DATA_URL = 'https://downloads.climatetrace.org/v4.4.0/country_packages/co2e_100yr/ESP.zip';
const TMP_DIR = path.join('data');
const ZIP_PATH = path.join(TMP_DIR, 'ESP.zip');
const OUTPUT_CSV = path.join('public', 'climatetrace_aggregated.csv');

const regions = [
  { name: 'Andalucía', coords: [37.7749, -4.7324] },
  { name: 'Aragón', coords: [41.5868, -0.8296] },
  { name: 'Asturias', coords: [43.3619, -5.8494] },
  { name: 'Baleares', coords: [39.6953, 3.0176] },
  { name: 'Canarias', coords: [28.2916, -16.6291] },
  { name: 'Cantabria', coords: [43.1828, -3.9878] },
  { name: 'Castilla-La Mancha', coords: [39.5663, -2.9908] },
  { name: 'Castilla y León', coords: [41.6523, -4.7245] },
  { name: 'Cataluña', coords: [41.8019, 1.8734] },
  { name: 'Comunidad Valenciana', coords: [39.4840, -0.7532] },
  { name: 'Extremadura', coords: [39.1622, -6.3432] },
  { name: 'Galicia', coords: [42.5751, -8.1339] },
  { name: 'Madrid', coords: [40.4165, -3.7026] },
  { name: 'Murcia', coords: [37.9922, -1.1307] },
  { name: 'Navarra', coords: [42.6954, -1.6761] },
  { name: 'País Vasco', coords: [43.2630, -2.9340] },
  { name: 'La Rioja', coords: [42.2871, -2.5396] }
];

function distance(a, b) {
  const dLat = a[0] - b[0];
  const dLon = a[1] - b[1];
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function closestRegion(lat, lon) {
  let best = regions[0];
  let bestDist = distance([lat, lon], best.coords);
  for (const r of regions.slice(1)) {
    const dist = distance([lat, lon], r.coords);
    if (dist < bestDist) {
      bestDist = dist;
      best = r;
    }
  }
  return best.name;
}

import { exec } from 'child_process';
async function downloadZip() {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);
  return new Promise((resolve, reject) => {
    exec(`wget -O ${ZIP_PATH} ${DATA_URL}`, (error, stdout, stderr) => {
      if (error) return reject(error);
      console.log(stdout.toString());
      console.error(stderr.toString());
      resolve();
    });
  });
}

async function parseData() {
  const zip = new AdmZip(ZIP_PATH);
  const entries = zip.getEntries().filter(e => e.entryName.endsWith('_emissions_sources_v4_4_0.csv'));
  const aggregates = new Map(); // key: region|year|sector => emissions

  for (const entry of entries) {
    const content = entry.getData().toString('utf8');
    await new Promise((resolve, reject) => {
      parse(content, { columns: true }, (err, records) => {
        if (err) return reject(err);
        for (const r of records) {
          const lat = parseFloat(r.lat);
          const lon = parseFloat(r.lon);
          const year = new Date(r.start_time).getFullYear();
          const region = (!isNaN(lat) && !isNaN(lon)) ? closestRegion(lat, lon) : 'España';
          const sector = `${r.sector}:${r.subsector}`;
          const emissions = parseFloat(r.emissions_quantity);
          const key = `${region}|${year}|${sector}`;
          const prev = aggregates.get(key) || 0;
          aggregates.set(key, prev + (isNaN(emissions) ? 0 : emissions));
        }
        resolve();
      });
    });
  }

  const rows = ['region,year,sector,emissions'];
  for (const [key, value] of aggregates.entries()) {
    const [region, year, sector] = key.split('|');
    rows.push(`${region},${year},${sector},${value}`);
  }
  fs.writeFileSync(OUTPUT_CSV, rows.join('\n'));
  console.log('Wrote aggregated data to', OUTPUT_CSV);
}

async function main() {
  await downloadZip();
  await parseData();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
