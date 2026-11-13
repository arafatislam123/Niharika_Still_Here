/** Mission definitions for the Mars Explorer game. Every learning card cites a NASA source. */

export interface SiteQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface Site {
  id: string;
  x: number;
  z: number;
  label: string;
  color: string;
  card: { title: string; text: string; sourceId: string };
  question?: SiteQuestion;
}

export interface Mission {
  id: 'explore-mars' | 'find-water' | 'survive-storm';
  number: number;
  title: string;
  goal: string;
  instructions: string;
  sites: Site[];
  storm?: { afterSeconds: number; durationSeconds: number };
}

export const MISSIONS: Mission[] = [
  {
    id: 'explore-mars',
    number: 1,
    title: 'Explore Mars',
    goal: 'Drive to the 3 glowing sample sites and collect a rock sample at each one.',
    instructions:
      'Each sample comes with a learning card and a science question. Correct answers earn bonus points!',
    sites: [
      {
        id: 'layers',
        x: 14,
        z: -10,
        label: 'Layered rocks',
        color: '#ffc94d',
        card: {
          title: 'Rocks in layers',
          text: 'Opportunity studied layered rocks at its landing site. Together with what was inside them, they showed that liquid water once existed there.',
          sourceId: 'src-opportunity',
        },
        question: {
          question: 'What did Opportunity’s rocks tell scientists about Mars long ago?',
          options: [
            'It was covered in trees',
            'Liquid water once existed there',
            'It had oceans of lava only',
            'Nothing at all',
          ],
          answer: 1,
          explanation: 'The rocks and the tiny grains inside them formed with the help of water.',
        },
      },
      {
        id: 'blueberries',
        x: -16,
        z: -22,
        label: '“Blueberry” field',
        color: '#7aa2ff',
        card: {
          title: 'Martian “blueberries”',
          text: 'Opportunity found small round grains rich in a mineral called hematite. Scientists nicknamed them “blueberries”.',
          sourceId: 'src-opportunity',
        },
        question: {
          question: 'What is the nickname for the tiny hematite spheres Opportunity found?',
          options: ['Blueberries', 'Marbles', 'Moon pebbles', 'Space peas'],
          answer: 0,
          explanation:
            'They looked like blueberries scattered in a muffin in the false-colour images.',
        },
      },
      {
        id: 'silica',
        x: 4,
        z: -36,
        label: 'Bright soil',
        color: '#f2f2f2',
        card: {
          title: 'Bright, silica-rich soil',
          text: 'Spirit’s stuck wheel scraped up soil that was almost pure silica. On Earth, soil like this forms near hot springs or steam vents.',
          sourceId: 'src-spirit',
        },
        question: {
          question: 'On Earth, where does silica-rich soil like this usually form?',
          options: [
            'In snowy mountains',
            'Near hot springs or steam vents',
            'At the bottom of deserts',
            'Inside trees',
          ],
          answer: 1,
          explanation:
            'Hot water and steam can leave silica behind, and microbes can live in such places.',
        },
      },
    ],
  },
  {
    id: 'find-water',
    number: 2,
    title: 'Find the Water Evidence',
    goal: 'Visit all 4 formations. At each one, decide: is this evidence of water?',
    instructions: 'Think like a scientist: what does each formation tell you about the past?',
    sites: [
      {
        id: 'hematite',
        x: 12,
        z: -14,
        label: 'Hematite grains',
        color: '#7aa2ff',
        card: {
          title: 'Formation A: hematite grains',
          text: 'Small round grains rich in hematite, like the ones Opportunity found at Meridiani Planum.',
          sourceId: 'src-opportunity',
        },
        question: {
          question: 'Are these hematite grains evidence of water?',
          options: ['Yes, evidence of water', 'No, not by itself'],
          answer: 0,
          explanation:
            'Scientists concluded these grains and their rocks formed where liquid water existed.',
        },
      },
      {
        id: 'basalt',
        x: -14,
        z: -12,
        label: 'Dark volcanic rock',
        color: '#9aa0aa',
        card: {
          title: 'Formation B: dark volcanic rock',
          text: 'The plains where Spirit landed were mostly volcanic rock, formed when lava cooled. To look for water clues, Spirit drove to nearby hills.',
          sourceId: 'src-spirit',
        },
        question: {
          question: 'Is ordinary volcanic rock evidence of water?',
          options: ['Yes, evidence of water', 'No, not by itself'],
          answer: 1,
          explanation:
            'Cooled lava forms without water, so Spirit had to explore further to find water clues.',
        },
      },
      {
        id: 'gypsum',
        x: -6,
        z: -32,
        label: 'Bright veins',
        color: '#ffffff',
        card: {
          title: 'Formation C: bright mineral veins',
          text: 'Bright veins of gypsum, like those Opportunity found at Endeavour crater. Gypsum forms when water flows through cracks in rock.',
          sourceId: 'src-opportunity',
        },
        question: {
          question: 'Are gypsum veins evidence of water?',
          options: ['Yes, evidence of water', 'No, not by itself'],
          answer: 0,
          explanation: 'Water carrying dissolved minerals left the gypsum behind in the cracks.',
        },
      },
      {
        id: 'ice',
        x: 18,
        z: -34,
        label: 'Shallow trench',
        color: '#bfe8ff',
        card: {
          title: 'Formation D: bright chunks in a trench',
          text: 'Bright chunks dug up just under the soil, like the ones Phoenix found. Over a few days they vanished into the thin air.',
          sourceId: 'src-phoenix',
        },
        question: {
          question: 'Are these vanishing bright chunks evidence of water?',
          options: ['Yes, evidence of water', 'No, not by itself'],
          answer: 0,
          explanation: 'They were water ice, turning straight into vapour in the thin Martian air.',
        },
      },
    ],
  },
  {
    id: 'survive-storm',
    number: 3,
    title: 'Save the Mission',
    goal: 'Drive to the crater rim. Watch your solar battery, and make the right call if a dust storm comes.',
    instructions:
      'Your rover runs on sunlight. Driving uses energy; sitting in the sun recharges it.',
    storm: { afterSeconds: 6, durationSeconds: 10 },
    sites: [
      {
        id: 'rim',
        x: 26,
        z: -36,
        label: 'Crater rim',
        color: '#ffc94d',
        card: {
          title: 'You made it!',
          text: 'In 2018 a real planet-wide dust storm blocked the sunlight Opportunity needed, and it went silent. Engineers plan carefully for storms because solar power depends on a clear sky.',
          sourceId: 'src-opportunity-end',
        },
      },
    ],
  },
];
