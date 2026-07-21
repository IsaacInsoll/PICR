export interface PosterFrameCandidate {
  lumaMean: number;
  lumaStdev: number;
}

const nearBlackLuma = 8;
const lowDetailStdev = 4;

export const pickPosterFrame = (candidates: PosterFrameCandidate[]): number => {
  if (candidates.length === 0) return 0;

  const middleIndex = Math.floor(candidates.length / 2);
  let bestIndex = middleIndex;
  let bestDistance = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate, index) => {
    if (!isUsablePosterFrame(candidate)) return;

    const distance = Math.abs(index - middleIndex);
    if (
      distance < bestDistance ||
      (distance === bestDistance && index === middleIndex)
    ) {
      bestIndex = index;
      bestDistance = distance;
    }
  });

  return bestIndex;
};

export const isUsablePosterFrame = ({
  lumaMean,
  lumaStdev,
}: PosterFrameCandidate): boolean => {
  return lumaMean > nearBlackLuma && lumaStdev > lowDetailStdev;
};
