import { PicrFolder } from '../../types';
import { Blurhash } from 'react-blurhash';

export const FolderPreview = ({ folder }: { folder: PicrFolder }) => {
  const hero = folder?.heroImage;
  if (!hero || hero.__typename !== 'Image' || !hero.blurHash) return null;
  return (
    <Blurhash
      hash={hero.blurHash}
      resolutionX={32}
      resolutionY={32}
      punch={1}
      width={16 * (hero.imageRatio ?? 1)}
      height={16}
      title={hero.name ?? undefined}
    />
  );
};
