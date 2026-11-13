import type { Source } from './types';

/**
 * Every fact in the app points at one of these. Before submission, a second team member should
 * open each URL and confirm the facts that cite it (see docs/FACT_CHECK.md).
 */
export const sources: Source[] = [
  {
    id: 'src-apollo11',
    title: 'Apollo 11 mission overview',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/mission/apollo-11/',
  },
  {
    id: 'src-apollo11-lm-nssdc',
    title: 'Apollo 11 Lunar Module / EASEP (NSSDC Master Catalog)',
    publisher: 'NASA Space Science Data Coordinated Archive',
    url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C',
  },
  {
    id: 'src-apollo-lrrr',
    title: 'Lunar laser ranging retroreflectors',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/moon/lunar-laser-ranging/',
  },
  {
    id: 'src-opportunity',
    title: 'Mars Exploration Rover: Opportunity',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mer-opportunity/',
  },
  {
    id: 'src-opportunity-end',
    title: "NASA's Record-Setting Opportunity Rover Mission on Mars Comes to End",
    publisher: 'NASA JPL',
    url: 'https://www.jpl.nasa.gov/news/nasas-record-setting-opportunity-rover-mission-on-mars-comes-to-end',
  },
  {
    id: 'src-spirit',
    title: 'Mars Exploration Rover: Spirit',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mer-spirit/',
  },
  {
    id: 'src-phoenix',
    title: 'Phoenix Mars Lander',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/phoenix/',
  },
  {
    id: 'src-pathfinder',
    title: 'Mars Pathfinder and the Sojourner rover',
    publisher: 'NASA JPL',
    url: 'https://www.jpl.nasa.gov/missions/mars-pathfinder-sojourner-rover',
  },
  {
    id: 'src-pioneer10',
    title: 'Pioneer 10',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/pioneer-10/',
  },
  {
    id: 'src-mariner2',
    title: 'Mariner 2',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mariner-2/',
  },
  {
    id: 'src-mariner4',
    title: 'Mariner 4',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mariner-4/',
  },
  {
    id: 'src-viking',
    title: 'Viking 1 & 2',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/viking-1/',
  },
  {
    id: 'src-voyager',
    title: 'Voyager',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/voyager/',
  },
  {
    id: 'src-curiosity',
    title: 'Mars Science Laboratory: Curiosity rover',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/msl-curiosity/',
  },
  {
    id: 'src-perseverance',
    title: 'Mars 2020: Perseverance rover',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
  },
  {
    id: 'src-artemis1',
    title: 'Artemis I',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/mission/artemis-i/',
  },
  {
    id: 'src-apollo17',
    title: 'Apollo 17 mission overview',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/mission/apollo-17/',
  },
  {
    id: 'src-nasa-images',
    title: 'NASA Image and Video Library',
    publisher: 'NASA',
    url: 'https://images.nasa.gov/',
  },
];

const byId = new Map(sources.map((s) => [s.id, s]));

export function getSource(id: string): Source {
  const source = byId.get(id);
  if (!source) throw new Error(`Unknown source id: ${id}`);
  return source;
}
