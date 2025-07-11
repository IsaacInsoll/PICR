export const pluralize = (num: number, title: string, showEmpty = false) => {
  if (num === 0) return showEmpty ? `No ${title}s` : '';
  return `${num} ${title}${num > 1 ? 's' : ''}`;
};