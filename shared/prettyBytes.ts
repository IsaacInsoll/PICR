import pb from 'pretty-bytes';

export type PrettyBytesOptions = Parameters<typeof pb>[1];

export const prettyBytes = (
  bytes: number | bigint,
  options?: PrettyBytesOptions,
) => pb(bytes, options);
