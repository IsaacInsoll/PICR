const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => htmlEscapes[character]);

export const renderEscapedHtmlTemplate = <
  Fields extends { [Key in keyof Fields]: string },
>(
  template: string,
  fields: Readonly<Fields>,
): string =>
  template.replace(
    /\{([A-Za-z][A-Za-z0-9]*)\}/g,
    (placeholder, key: string) => {
      if (!Object.hasOwn(fields, key)) return placeholder;
      return escapeHtml(fields[key as keyof Fields]);
    },
  );
