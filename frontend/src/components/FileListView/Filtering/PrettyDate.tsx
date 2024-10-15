import { tz } from 'moment-timezone';
import moment from 'moment';

export const prettyDate = (dateString: string) => {
  const d = new Date(dateString);
  return moment(d).format('MMMM Do YYYY, h:mm:ss a');
};

export const prettyDateNoTZ = (dateString: string): string => {
  // This was tested as matching with Adobe Lightroom perfectly for both `capture time` and `export time`
  const d = new Date(dateString);
  return tz(d, 'YYYY-MM-DDTHH:mm:ss[Z]').format('MMMM Do YYYY, h:mm:ss a');
};

export const fromNow = (dateString: string): string => {
  const d = new Date(dateString);
  return moment(d).fromNow();
};
