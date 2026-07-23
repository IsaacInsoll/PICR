import moment from 'moment/moment';

export const prettyDate = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return moment(d).format('MMMM Do YYYY, h:mm:ss a');
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
