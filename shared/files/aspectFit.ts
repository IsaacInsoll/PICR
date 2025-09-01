interface Rectangle {
  width: number;
  height: number;
}
export const aspectFit = (rect: Rectangle, ratio: number = 1): Rectangle => {
  const { height, width } = rect;
  const result = width / ratio;
  if (result <= height) return { width, height: result };
  return { width: height * ratio, height };
};
