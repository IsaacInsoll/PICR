import type { Metadata } from 'sharp';
import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
});

const field = (value: unknown, key: string): unknown => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return undefined;
  return key in value ? Reflect.get(value, key) : undefined;
};

export const imageRating = (
  metadata: Pick<Metadata, 'xmp' | 'comments'>,
): number => {
  const xmp = imageXmp(metadata);
  if (!xmp) return 0;
  try {
    const xml: unknown = xmlParser.parse(xmp.toString());
    const rdf =
      field(field(xml, 'x:xmpmeta'), 'rdf:RDF') ?? field(xml, 'rdf:RDF');
    const descriptions = field(rdf, 'rdf:Description');
    for (const description of Array.isArray(descriptions)
      ? descriptions
      : [descriptions]) {
      // Both an RDF attribute and an element are valid XMP serializations.
      const value =
        field(description, '@_xmp:Rating') ?? field(description, 'xmp:Rating');
      if (typeof value !== 'number' && typeof value !== 'string') continue;
      if (typeof value === 'string' && !value.trim()) continue;
      const rating = Number(value);
      if (Number.isInteger(rating) && rating >= -1 && rating <= 5)
        return rating;
    }
  } catch {
    // Missing or malformed XMP must not prevent an otherwise valid import.
  }
  return 0;
};

// ImageMagick writes XMP as a hex-encoded PNG text profile. Sharp exposes that
// through comments rather than metadata.xmp, even though ExifTool reads both.
export const imageXmp = (
  metadata: Pick<Metadata, 'xmp' | 'comments'>,
): Buffer | undefined => {
  if (metadata.xmp) return metadata.xmp;

  const standard = metadata.comments?.find(
    ({ keyword }) => keyword === 'XML:com.adobe.xmp',
  );
  if (standard) return Buffer.from(standard.text, 'utf8');

  // libvips can shorten ImageMagick's keyword to "Raw" when re-encoding PNG.
  // Validate the profile's own name and byte count rather than trusting the key.
  const raw = metadata.comments?.find(
    ({ keyword, text }) =>
      (keyword === 'Raw profile type xmp' || keyword === 'Raw') &&
      text.trim().split(/\r?\n/, 1)[0] === 'xmp',
  );
  if (!raw) return undefined;

  const [name, size, ...lines] = raw.text.trim().split(/\r?\n/);
  if (name !== 'xmp' || !size || !/^\s*\d+\s*$/.test(size)) return undefined;
  const byteLength = Number(size);
  const hex = lines.join('').replace(/\s/g, '');
  if (
    !Number.isSafeInteger(byteLength) ||
    byteLength <= 0 ||
    hex.length !== byteLength * 2 ||
    !/^[\da-f]+$/i.test(hex)
  ) {
    return undefined;
  }
  return Buffer.from(hex, 'hex');
};
