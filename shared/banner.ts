export const banner = (
  logo: string[],
  rows: string[],
  minimumRowWidth = 72,
) => {
  const contentWidth =
    Math.max(minimumRowWidth, ...rows.map((value) => value.length)) + 6;
  const boxTop = `┌${'─'.repeat(contentWidth)}┐`;
  const boxBottom = `└${'─'.repeat(contentWidth)}┘`;
  const boxRows = rows.map((value) => `│  ${value.padEnd(contentWidth - 2)}│`);
  const box = [boxTop, ...boxRows, boxBottom];
  const logoWidth = Math.max(0, ...logo.map((value) => value.length));
  const height = Math.max(logo.length, box.length);

  return Array.from(
    { length: height },
    (_, index) => `${(logo[index] ?? '').padEnd(logoWidth)}${box[index] ?? ''}`,
  ).join('\n');
};

export const bannerRow = (icon: string, label: string, value?: string) =>
  value ? `${icon}  ${label.padEnd(12)} ${value}` : `${icon}  ${label}`;

export const wrappedBannerRows = (
  icon: string,
  label: string,
  value: string,
  maxValueLength = 57,
) => {
  if (value.length <= maxValueLength) {
    return [bannerRow(icon, label, value)];
  }

  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxValueLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);

  return lines.map((text, index) =>
    index === 0 ? bannerRow(icon, label, text) : bannerRow(' ', '', text),
  );
};
