import { formatBytes, type FormatBytesOptions } from './i18n/formatting';

export interface PrettyBytesOptions extends FormatBytesOptions {
  locale?: string;
}

export const prettyBytes = (
  bytes: number | bigint | string,
  options: PrettyBytesOptions = {},
) => formatBytes(bytes, options.locale, options).formatted;

export { formatBytes };
export type { FormattedBytes } from './i18n/formatting';
