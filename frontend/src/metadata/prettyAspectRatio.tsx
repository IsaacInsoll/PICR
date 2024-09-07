import { ReactNode } from 'react';
import { MinimalFile } from '../../types';
import { toReadableFraction } from 'readable-fractions';

export const prettyAspectRatio: ReactNode | null = (file: MinimalFile) => {
  const ratio = file.imageRatio;
  if (!ratio) return null;
  const { denominator, numerator } = toReadableFraction(ratio);

  return (
    <>
      <sup>{numerator}</sup>/<sub>{denominator}</sub>
    </>
  );
};
