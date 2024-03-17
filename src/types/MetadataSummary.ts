export interface MetadataSummary {
  Camera?: string | null;
  Lens?: string | null;
  Artist?: string | null;
  DateTimeEdit?: Date | null;
  DateTimeOriginal?: Date | null;
  Aperture?: number | null;
  // ShutterSpeed?: string;
  ISO?: number | null;
  ExposureTime: number | null; // note this is in seconds so render as 1/${1/ExposureTime} if it's less than 1
}
