/**
 * Cinema-mode films: for each explorer, which scene plays for each story chapter and which
 * captions appear on top. Captions only use dates and facts already in src/data (checked by
 * films.test.ts: same numbers in English and Bengali).
 */
import {
  asteroidBelt,
  deepCoast,
  faintSignal,
  hillClimb,
  jupiterFlyby,
  lmDescent,
  lmLiftoff,
  moonStillHere,
  moonWalk,
  pathfinderSilence,
  phoenixDig,
  phoenixLanding,
  phoenixSnow,
  phoenixWinter,
  rockGarden,
  silicaScrape,
  sojournerDusk,
  stuckWinter,
} from './scenes2';
import {
  discoveries,
  dustStormSilence,
  launchAndLanding,
  longDrive,
  type CinemaScene,
  type SceneContext,
} from './scenes';

/** A caption shown from chapter progress `at` onwards (until the next one). */
export type Caption =
  { at: number; en: string; bn: string } | { at: number; special: 'opportunity-drive' };

export interface Film {
  /** NASA 3D models this film needs loaded before it starts. */
  models: ('rover' | 'pioneer')[];
  chapters: { build: (ctx: SceneContext) => CinemaScene; captions: Caption[] }[];
}

const c = (at: number, en: string, bn: string): Caption => ({ at, en, bn });

export const FILMS: Record<string, Film> = {
  'apollo-11-descent-stage': {
    models: [],
    chapters: [
      {
        build: lmDescent,
        captions: [
          c(0, 'Apollo 11 · July 1969', 'অ্যাপোলো ১১ · জুলাই ১৯৬৯'),
          c(
            0.78,
            'Two stages: descent (bottom) + ascent (top)',
            'দুই অংশ: অবতরণ অংশ (নিচে) + আরোহণ অংশ (উপরে)',
          ),
        ],
      },
      {
        build: moonWalk,
        captions: [
          c(0, '20 July 1969 · Sea of Tranquility', '২০ জুলাই ১৯৬৯ · প্রশান্তি সাগর'),
          c(
            0.75,
            'Experiments set up, including a laser reflector',
            'পরীক্ষা বসানো হলো, লেজার প্রতিফলকসহ',
          ),
        ],
      },
      {
        build: lmLiftoff,
        captions: [
          c(
            0.2,
            'The ascent stage lifts off; the descent stage stays',
            'আরোহণ অংশ উড়ে যায়; অবতরণ অংশ থেকে যায়',
          ),
        ],
      },
      {
        build: moonStillHere,
        captions: [
          c(0, 'Still at Tranquility Base', 'এখনো ট্রাংকুইলিটি বেসে'),
          c(
            0.35,
            'Scientists still bounce lasers off the reflector',
            'বিজ্ঞানীরা আজও প্রতিফলকে লেজার পাঠান',
          ),
        ],
      },
    ],
  },

  opportunity: {
    models: ['rover'],
    chapters: [
      {
        build: (ctx) => launchAndLanding(ctx, 'rover'),
        captions: [
          c(0, 'Launch · July 2003', 'উৎক্ষেপণ · জুলাই ২০০৩'),
          c(
            0.3,
            'Landing · January 2004 · Meridiani Planum',
            'অবতরণ · জানুয়ারি ২০০৪ · মেরিডিয়ানি প্ল্যানাম',
          ),
        ],
      },
      {
        build: discoveries,
        captions: [
          c(
            0.2,
            'Hematite “blueberries”: clues of ancient water',
            'হেমাটাইটের “ব্লুবেরি”: প্রাচীন পানির সূত্র',
          ),
        ],
      },
      { build: longDrive, captions: [{ at: 0, special: 'opportunity-drive' }] },
      {
        build: dustStormSilence,
        captions: [
          c(0, 'June 2018 · a planet-wide dust storm', 'জুন ২০১৮ · গ্রহজোড়া ধুলিঝড়'),
          c(0.82, '10 June 2018 · last signal', '১০ জুন ২০১৮ · শেষ সংকেত'),
        ],
      },
    ],
  },

  spirit: {
    models: ['rover'],
    chapters: [
      {
        build: (ctx) => launchAndLanding(ctx, 'rover'),
        captions: [
          c(0, 'Launch · 10 June 2003', 'উৎক্ষেপণ · ১০ জুন ২০০৩'),
          c(0.3, 'Landing · 4 January 2004 · Gusev crater', 'অবতরণ · ৪ জানুয়ারি ২০০৪ · গুসেভ ক্রেটার'),
        ],
      },
      {
        build: hillClimb,
        captions: [
          c(0, 'Climbing the Columbia Hills', 'কলাম্বিয়া হিলসে চড়া'),
          c(0.6, '2006 · a front wheel stops turning', '২০০৬ · সামনের একটি চাকা থেমে যায়'),
        ],
      },
      {
        build: silicaScrape,
        captions: [
          c(0, 'Driving backwards, dragging the stuck wheel', 'আটকে যাওয়া চাকা টেনে পেছন দিকে চলা'),
          c(0.75, '2007 · almost pure silica', '২০০৭ · প্রায় খাঁটি সিলিকা'),
        ],
      },
      {
        build: stuckWinter,
        captions: [
          c(0, 'May 2009 · stuck in soft soil at Troy', 'মে ২০০৯ · ট্রয়ে নরম মাটিতে আটকা'),
          c(0.8, '22 March 2010 · last signal', '২২ মার্চ ২০১০ · শেষ সংকেত'),
        ],
      },
    ],
  },

  phoenix: {
    models: [],
    chapters: [
      {
        build: phoenixLanding,
        captions: [
          c(0, 'Landing · 25 May 2008 · Martian Arctic', 'অবতরণ · ২৫ মে ২০০৮ · মঙ্গলের মেরু অঞ্চল'),
          c(0.68, 'Two round solar arrays open', 'দুটি গোল সোলার প্যানেল খুলে যায়'),
        ],
      },
      {
        build: phoenixDig,
        captions: [
          c(0, 'Digging a trench with the robotic arm', 'রোবটিক হাতে খাঁজ খোঁড়া'),
          c(
            0.6,
            'Bright chunks vanish in a few days: water ice',
            'উজ্জ্বল টুকরোগুলো কয়েক দিনে মিলিয়ে যায়: পানির বরফ',
          ),
        ],
      },
      {
        build: phoenixSnow,
        captions: [
          c(0, 'A laser points at the clouds', 'মেঘের দিকে লেজার তাক করা'),
          c(
            0.3,
            'Snow falls, but vanishes before the ground',
            'তুষার পড়ে, কিন্তু মাটিতে পৌঁছানোর আগেই মিলিয়ে যায়',
          ),
        ],
      },
      {
        build: phoenixWinter,
        captions: [
          c(0, 'The Arctic winter is coming', 'মেরু-শীত আসছে'),
          c(0.5, '2 November 2008 · last signal', '২ নভেম্বর ২০০৮ · শেষ সংকেত'),
          c(0.85, 'Ice probably broke the solar panels', 'বরফ সম্ভবত সোলার প্যানেল ভেঙে দিয়েছিল'),
        ],
      },
    ],
  },

  sojourner: {
    models: [],
    chapters: [
      {
        build: (ctx) => launchAndLanding(ctx, 'pathfinder'),
        captions: [
          c(0, 'Mars Pathfinder', 'মার্স পাথফাইন্ডার'),
          c(0.3, 'Landing · 4 July 1997 · Ares Vallis', 'অবতরণ · ৪ জুলাই ১৯৯৭ · এরিস ভ্যালিস'),
          c(0.9, 'The first wheeled rover on another planet', 'অন্য গ্রহে প্রথম চাকাওয়ালা রোভার'),
        ],
      },
      {
        build: rockGarden,
        captions: [
          c(
            0,
            'Visiting the rocks “Barnacle Bill” and “Yogi”',
            '“বার্নাকল বিল” আর “ইয়োগি” পাথরের কাছে',
          ),
        ],
      },
      {
        build: sojournerDusk,
        captions: [
          c(0, 'Named after Sojourner Truth', 'সোজার্নার ট্রুথের নামে নাম'),
          c(0.4, 'The name came from a student’s essay', 'নামটি এসেছে এক শিক্ষার্থীর রচনা থেকে'),
        ],
      },
      {
        build: pathfinderSilence,
        captions: [
          c(0, 'Talking to Earth through the lander', 'ল্যান্ডারের মাধ্যমে পৃথিবীর সাথে কথা'),
          c(0.6, '27 September 1997 · last signal', '২৭ সেপ্টেম্বর ১৯৯৭ · শেষ সংকেত'),
        ],
      },
    ],
  },

  'pioneer-10': {
    models: ['pioneer'],
    chapters: [
      {
        build: asteroidBelt,
        captions: [
          c(0, 'Launch · 2 March 1972', 'উৎক্ষেপণ · ২ মার্চ ১৯৭২'),
          c(
            0.35,
            'First through the asteroid belt (real asteroids are much farther apart)',
            'গ্রহাণু বেষ্টনী পার হওয়া প্রথম যান (আসল গ্রহাণুগুলো অনেক দূরে দূরে থাকে)',
          ),
        ],
      },
      {
        build: jupiterFlyby,
        captions: [
          c(0, '3 December 1973 · first visit to Jupiter', '৩ ডিসেম্বর ১৯৭৩ · বৃহস্পতিতে প্রথম সফর'),
        ],
      },
      {
        build: deepCoast,
        captions: [
          c(0, 'Powered by the heat of plutonium (RTGs)', 'প্লুটোনিয়ামের তাপে চলে (আরটিজি)'),
          c(0.5, 'A gold plaque: a message from Earth', 'সোনালি ফলক: পৃথিবীর বার্তা'),
        ],
      },
      {
        build: faintSignal,
        captions: [
          c(
            0,
            '23 January 2003 · last signal, from about 12 billion km away',
            '২৩ জানুয়ারি ২০০৩ · শেষ সংকেত, প্রায় ১২ বিলিয়ন কিমি দূর থেকে',
          ),
          c(0.7, 'Still coasting towards Aldebaran', 'এখনো রোহিণীর (অলডেবারান) দিকে ভেসে চলেছে'),
        ],
      },
    ],
  },
};
