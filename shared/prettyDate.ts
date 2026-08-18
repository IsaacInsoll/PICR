import { formatDate } from './i18n/formatting';

export const prettyDate = (dateString: string, locale = 'en') => {
  if (!dateString) return '';
  return formatDate(dateString, locale);
};

// Node reports filesystem creation time as birthtime, but mounted or virtual
// filesystems may expose Unix epoch when creation time is unavailable. In PICR
// that means "unknown file-created date", not a real January 1st 1970 value.
export const isUnavailableFileCreatedDate = (
  dateString?: string | null,
): boolean => {
  if (!dateString) return false;
  const time = new Date(dateString).getTime();
  return Number.isFinite(time) && time === 0;
};
