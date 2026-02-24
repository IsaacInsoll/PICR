import pb from 'pretty-bytes';

export type PrettyBytesOptions = Parameters<typeof pb>[1];

const parseBytes = (bytes: number | bigint | string): number | bigint => {
  if (typeof bytes === 'string') {
    const parsed = Number(bytes);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return bytes;
};

export const prettyBytes = (
  bytes: number | bigint | string,
  options?: PrettyBytesOptions,
) => pb(parseBytes(bytes), options);
