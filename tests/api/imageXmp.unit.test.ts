import { expect, test } from 'vitest';
import { imageRating, imageXmp } from '../../backend/media/imageXmp';

const xmp = Buffer.from(
  '<x:xmpmeta><rdf:RDF><rdf:Description xmp:Rating="4" /></rdf:RDF></x:xmpmeta>',
);
const rawProfile = `\nxmp\n    ${xmp.length}\n${xmp
  .toString('hex')
  .match(/.{1,72}/g)
  ?.join('\n')}\n`;

test.each([
  ['<rdf:Description xmp:Rating="4"/>', 4],
  ['<rdf:Description><xmp:Rating>4</xmp:Rating></rdf:Description>', 4],
  ['<rdf:Description xmp:Rating="-1"/>', -1],
  ['<rdf:Description xmp:Rating="0"/>', 0],
  ['<rdf:Description/><rdf:Description xmp:Rating="5"/>', 5],
  [
    '<rdf:Description xmp:Rating="bad"/><rdf:Description><xmp:Rating>3</xmp:Rating></rdf:Description>',
    3,
  ],
  ['<rdf:Description xmp:Rating="4.5"/>', 0],
  ['<rdf:Description xmp:Rating="6"/>', 0],
  ['<rdf:Description xmp:Rating=""/>', 0],
])(
  'reads valid XMP RDF ratings and ignores invalid values: %s',
  (description, expected) => {
    expect(
      imageRating({
        xmp: Buffer.from(
          `<x:xmpmeta><rdf:RDF>${description}</rdf:RDF></x:xmpmeta>`,
        ),
      }),
    ).toBe(expected);
  },
);

test('reads an RDF-only XMP packet and treats missing metadata as unrated', () => {
  expect(
    imageRating({
      xmp: Buffer.from('<rdf:RDF><rdf:Description xmp:Rating="2"/></rdf:RDF>'),
    }),
  ).toBe(2);
  expect(imageRating({})).toBe(0);
  expect(imageRating({ xmp: Buffer.from('not XML') })).toBe(0);
  expect(
    imageRating({ comments: [{ keyword: 'Raw', text: rawProfile }] }),
  ).toBe(4);
});

test('prefers Sharp XMP over PNG text representations', () => {
  expect(
    imageXmp({
      xmp,
      comments: [{ keyword: 'XML:com.adobe.xmp', text: 'other metadata' }],
    }),
  ).toBe(xmp);
});

test('reads standard PNG XMP text', () => {
  expect(
    imageXmp({
      comments: [{ keyword: 'XML:com.adobe.xmp', text: xmp.toString() }],
    }),
  ).toEqual(xmp);
});

test.each([rawProfile, rawProfile.replaceAll('\n', '\r\n')])(
  'decodes an ImageMagick XMP profile including its declared byte count',
  (text) => {
    expect(
      imageXmp({ comments: [{ keyword: 'Raw profile type xmp', text }] }),
    ).toEqual(xmp);
  },
);

test('recognizes raw XMP after libvips shortens PNG profile keywords', () => {
  expect(
    imageXmp({
      comments: [
        { keyword: 'Raw', text: '\nicc\n 2\n0000\n' },
        { keyword: 'Raw', text: rawProfile },
      ],
    }),
  ).toEqual(xmp);
});

test.each([
  '\nxmp\n 5\n0123\n',
  '\nxmp\n 2\nzzzz\n',
  '\nicc\n 2\n0123\n',
  '\nxmp\n -2\n0123\n',
  '\nxmp\n 0\n\n',
  '\nxmp\n 99999999999999999999\n0123\n',
  'not a raw profile',
])(
  'ignores a malformed raw XMP profile without partial hex decoding: %s',
  (text) => {
    expect(
      imageXmp({ comments: [{ keyword: 'Raw profile type xmp', text }] }),
    ).toBeUndefined();
  },
);

test('does not treat unrelated image comments as XMP', () => {
  expect(imageXmp({})).toBeUndefined();
  expect(
    imageXmp({ comments: [{ keyword: 'Comment', text: rawProfile }] }),
  ).toBeUndefined();
});
