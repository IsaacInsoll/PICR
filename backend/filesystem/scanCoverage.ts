export interface SuccessfulScanCoverage {
  startedAt: Date;
  completedAt: Date;
}

let lastSuccessfulFullLibraryScan: SuccessfulScanCoverage | null = null;

export const recordSuccessfulFullLibraryScan = (
  startedAt: Date,
  completedAt = new Date(),
): void => {
  lastSuccessfulFullLibraryScan = { startedAt, completedAt };
};

export const getLastSuccessfulFullLibraryScan =
  (): SuccessfulScanCoverage | null =>
    lastSuccessfulFullLibraryScan
      ? {
          startedAt: new Date(lastSuccessfulFullLibraryScan.startedAt),
          completedAt: new Date(lastSuccessfulFullLibraryScan.completedAt),
        }
      : null;

export const resetScanCoverageForTests = (): void => {
  lastSuccessfulFullLibraryScan = null;
};
