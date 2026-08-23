// The async Clipboard API only exists in a secure context (HTTPS, localhost or
// file://). PICR is commonly self-hosted on a plain-HTTP LAN address, where
// `navigator.clipboard` is undefined and reading `.writeText` off it throws, so
// fall back to the legacy `document.execCommand('copy')` approach.
export const copyToClipboard = (text: string): boolean => {
  // The DOM lib types claim `navigator.clipboard` is always present, which is
  // only true in a secure context.
  const clipboard = navigator.clipboard as Clipboard | undefined;
  if (clipboard) {
    void clipboard.writeText(text).catch(() => {
      // Permission can still be refused inside a secure context.
      legacyCopyToClipboard(text);
    });
    return true;
  }
  return legacyCopyToClipboard(text);
};

const legacyCopyToClipboard = (text: string): boolean => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  // `readOnly` stops mobile Safari opening the keyboard, and the fixed
  // zero-opacity placement keeps the page from scrolling to the element.
  textArea.readOnly = true;
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  let copied = false;
  try {
    // iOS Safari ignores `textArea.select()`, so select the range explicitly.
    const range = document.createRange();
    range.selectNodeContents(textArea);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    textArea.setSelectionRange(0, text.length);
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textArea);
  }
  return copied;
};

export const publicURLFor = (base: string, hash: string, folderId: string) => {
  return base + 's/' + hash + '/' + folderId;
};
