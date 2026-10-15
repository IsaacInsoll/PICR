const oneDayMs = 86_400_000;

export const comingSoonCountdown = (deliveryTime: number, now: number) => {
  const remainingMs = Math.max(0, deliveryTime - now);
  const showSeconds = remainingMs > 0 && remainingMs < oneDayMs;
  const remainingMinutes = Math.ceil(remainingMs / 60_000);
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return {
    remaining: remainingMs > 0,
    showSeconds,
    days: showSeconds ? 0 : Math.floor(remainingMinutes / 1440),
    hours: showSeconds
      ? Math.floor(remainingSeconds / 3600)
      : Math.floor((remainingMinutes % 1440) / 60),
    minutes: showSeconds
      ? Math.floor((remainingSeconds % 3600) / 60)
      : remainingMinutes % 60,
    seconds: remainingSeconds % 60,
  };
};
