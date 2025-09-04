import moment from 'moment/moment';

export const prettyDate = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return moment(d).format('MMMM Do YYYY, h:mm:ss a');
};
