export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export const publicURLFor = (hash: string, folderId: string) => {
  return window.location.origin + '/s/' + hash + '/' + folderId;
};
