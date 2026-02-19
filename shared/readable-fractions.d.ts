declare module 'readable-fractions' {
  export function toReadableFraction(value: number): {
    numerator: number;
    denominator: number;
  };
}
