//valid but i don't like them: :/?#[]',;=
const validchars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~@!$&()*+';

// return array of any "bad" (non-alphanumeric) characters
export const badChars = (link: string): string[] => {
  const bad: string[] = [];
  for (const letter of link) {
    if (!validchars.includes(letter) && !bad.includes(letter)) bad.push(letter);
  }
  return bad;
};
