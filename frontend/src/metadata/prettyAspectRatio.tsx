import type { ReactNode } from 'react';
import { toReadableFraction } from 'readable-fractions';
import type { PicrFile } from '@shared/types/picr';

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
