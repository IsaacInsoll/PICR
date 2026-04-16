import type { PicrFolder } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import { Blurhash } from 'react-blurhash';

export const FolderPreview = ({ folder }: { folder: PicrFolder }) => {
  const hero = folder.heroImage;
  if (hero?.__typename !== 'Image' || !hero.blurHash) return null;
  return (
    <Blurhash
      hash={hero.blurHash}
      resolutionX={32}
      resolutionY={32}
      punch={1}
      width={16 * (hero.imageRatio ?? 1)}
      height={16}
      title={normalizeDisplayName(hero.name) ?? undefined}
    />
  );
};
