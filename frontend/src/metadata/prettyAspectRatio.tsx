import { ReactNode } from 'react';
import { toReadableFraction } from 'readable-fractions';
import { PicrFile } from '../../types';

export const prettyAspectRatio = (file: PicrFile): ReactNode | null => {
  if (!('imageRatio' in file)) return null;
  const ratio = file.imageRatio;
  if (!ratio) return null;
  const { denominator, numerator } = toReadableFraction(ratio);

  return (
    <>
      <sup>{numerator}</sup>/<sub>{denominator}</sub>
    </>
  );
};
