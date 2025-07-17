export const pow2abs = (a: number, b: number): number => {
  return Math.pow(Math.abs(a - b), 2);
};
export const getDistance = (touches: any): number => {
  const [a, b] = touches;

  if (a == null || b == null) {
    return 0;
  }
  return Math.sqrt(pow2abs(a.pageX, b.pageX) + pow2abs(a.pageY, b.pageY));
};

export const getScale = (
  currentDistance: number,
  initialDistance: number
): number => {
  return (currentDistance / initialDistance) * 1.2;
};
