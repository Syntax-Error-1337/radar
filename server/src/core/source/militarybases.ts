/**
 * Military Bases — KML data source
 * Parses local KML file and serves as GeoJSON.
 */
import fs from 'node:fs';
import path from 'node:path';

export type BaseCategory = 'air' | 'naval' | 'ground' | 'hq';

export interface MilitaryBaseProperties {
  name: string;
  description: string;
  category: BaseCategory;
  country: string;
}

type Feature = {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: MilitaryBaseProperties;
};

type FeatureCollection = {
  type: 'FeatureCollection';
  features: Feature[];
};

let _cache: FeatureCollection | null = null;

function styleToCategory(styleUrl: string): BaseCategory {
  if (/airport/i.test(styleUrl)) return 'air';
  if (/marina|ferry/i.test(styleUrl)) return 'naval';
  if (/truck/i.test(styleUrl)) return 'ground';
  return 'hq';
}

export function getMilitaryBasesGeoJSON(): FeatureCollection {
  if (_cache) return _cache;

  const filePath = path.join(__dirname, '../../Data/Kml Military bases.kml');
  const xml = fs.readFileSync(filePath, 'utf-8');

  type Ev =
    | { pos: number; type: 'folderStart' }
    | { pos: number; type: 'folderEnd' }
    | { pos: number; type: 'pm'; content: string };

  const events: Ev[] = [];

  for (const m of xml.matchAll(/<Folder>/g)) events.push({ pos: m.index!, type: 'folderStart' });
  for (const m of xml.matchAll(/<\/Folder>/g)) events.push({ pos: m.index!, type: 'folderEnd' });
  for (const m of xml.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/g))
    events.push({ pos: m.index!, type: 'pm', content: m[1] });

  events.sort((a, b) => a.pos - b.pos);

  const folderStack: string[] = [];
  const features: Feature[] = [];

  for (const ev of events) {
    if (ev.type === 'folderStart') {
      const nameMatch = xml.slice(ev.pos, ev.pos + 300).match(/<name>([\s\S]*?)<\/name>/);
      folderStack.push(nameMatch ? nameMatch[1].trim() : '');
    } else if (ev.type === 'folderEnd') {
      folderStack.pop();
    } else {
      const { content } = ev;
      const coordMatch = content.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
      if (!coordMatch) continue;

      const [lngStr, latStr] = coordMatch[1].trim().split(',');
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      if (isNaN(lng) || isNaN(lat)) continue;

      const name = content.match(/<name>([\s\S]*?)<\/name>/)?.[1].trim() ?? '';
      const rawDesc = content.match(/<description>([\s\S]*?)<\/description>/)?.[1].trim() ?? '';
      const description = rawDesc
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .trim()
        .slice(0, 500);
      const styleUrl = content.match(/<styleUrl>([\s\S]*?)<\/styleUrl>/)?.[1].trim() ?? '';
      const country = folderStack.find((n) => n && n !== 'Military Bases') ?? 'Unknown';

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { name, description, category: styleToCategory(styleUrl), country },
      });
    }
  }

  _cache = { type: 'FeatureCollection', features };
  console.log(`[MilitaryBases] Loaded ${features.length} installations from KML`);
  return _cache;
}

export function getMilitaryBaseStats() {
  const { features } = getMilitaryBasesGeoJSON();
  const stats = { total: features.length, air: 0, naval: 0, ground: 0, hq: 0 };
  for (const f of features) stats[f.properties.category]++;
  return stats;
}
