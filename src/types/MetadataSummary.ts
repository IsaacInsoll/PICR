export interface MetadataSummary {
  Camera?: string;
  Lens?: string;
  Artist?: string;
  DateTimeEdit?: Date;
  DateTimeOriginal?: Date;
  Aperture?: number;
  // ShutterSpeed?: string;
  ISO?: number;
  ExposureTime: number; // note this is in seconds so render as 1/${1/ExposureTime} if it's less than 1
}
