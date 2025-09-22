import { ReactNode } from 'react';
import { toReadableFraction } from 'readable-fractions';
import { File } from '@shared/gql/graphql';

export const prettyAspectRatio = (file: File): ReactNode | null => {
  const ratio = file.imageRatio;
  if (!ratio) return null;
  const { denominator, numerator } = toReadableFraction(ratio);

  return (
    <>
      <sup>{numerator}</sup>/<sub>{denominator}</sub>
    </>
  );
};
