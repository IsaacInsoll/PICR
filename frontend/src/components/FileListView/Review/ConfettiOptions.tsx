const rewardOptions = {
  zIndex: 1000,
  position: 'absolute',
};

export const confettiOptions = {
  ...rewardOptions,
  lifetime: 100,
};

export const fiveStarOptions = {
  ...rewardOptions,
  emoji: ['⭐', '🌟', '✨', '😻'],
  lifetime: 50,
  // velocity: 0.99,
  elementCount: 7,
};

export const greenBaloonsOptions = {
  ...rewardOptions,
  lifetime: 100,
  startVelocity: 7,
  elementCount: 3,
  colors: ['#125931', '#014017', '#085924', '#012606'],
};
