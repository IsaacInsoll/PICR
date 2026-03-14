export const copyToClipboard = (text: string) => {
  void navigator.clipboard.writeText(text);
};

export const publicURLFor = (base: string, hash: string, folderId: string) => {
  return base + 's/' + hash + '/' + folderId;
};
