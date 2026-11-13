import { describe, expect, it } from 'vitest';
import { cleanDescription, parseSearch } from './nasaImages';

// Shape copied from a real images-api.nasa.gov/search response.
const sample = {
  collection: {
    items: [
      {
        data: [
          {
            nasa_id: 'PIA20285',
            title: 'Mars Rover Opportunity at Rock Abrasion Target Potts',
            description: 'The target beneath the <b>tool turret</b> is "Private John Potts."',
            date_created: '2016-01-25T19:10:53Z',
            center: 'JPL',
          },
        ],
        links: [
          {
            href: 'https://images-assets.nasa.gov/image/PIA20285/PIA20285~medium.jpg',
            rel: 'alternate',
            render: 'image',
          },
          {
            href: 'https://images-assets.nasa.gov/image/PIA20285/PIA20285~thumb.jpg',
            rel: 'preview',
            render: 'image',
          },
        ],
      },
      { data: [{ nasa_id: 'no-links', title: 'Skipped' }] },
    ],
  },
};

describe('NASA Image API parsing', () => {
  it('uses the preview thumbnail, strips HTML and builds the NASA page link', () => {
    const [img, ...rest] = parseSearch(sample);
    expect(rest).toHaveLength(0);
    expect(img.thumbnail).toMatch(/~thumb\.jpg$/);
    expect(img.description).toBe('The target beneath the tool turret is "Private John Potts."');
    expect(img.date).toBe('2016-01-25');
    expect(img.pageUrl).toBe('https://images.nasa.gov/details/PIA20285');
  });

  it('survives an unexpected response', () => {
    expect(parseSearch(null)).toEqual([]);
    expect(parseSearch({ collection: {} })).toEqual([]);
  });

  it('shortens long captions on a word boundary', () => {
    const out = cleanDescription('word '.repeat(100), 30);
    expect(out.length).toBeLessThanOrEqual(31);
    expect(out.endsWith('…')).toBe(true);
  });
});
