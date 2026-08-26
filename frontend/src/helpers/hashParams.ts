export const readHashParam = (hash: string, key: string) =>
  new URLSearchParams(hash.replace(/^#/, '')).get(key) ?? undefined;

export const withHashParam = (hash: string, key: string, value?: string) => {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }

  const nextHash = params.toString();
  return nextHash ? `#${nextHash}` : '';
};
