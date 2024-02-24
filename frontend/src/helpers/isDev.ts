export const isDev = () => {
  const dev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  if (dev) console.warn('DEV MODE');
  return dev;
};
