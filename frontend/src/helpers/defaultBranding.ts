import { HeadingFontKey, PrimaryColor, ThemeMode } from '@shared/gql/graphql';
import {
  DEFAULT_BORDER_RADIUS,
  DEFAULT_HEADING_FONT_SIZE,
  DEFAULT_SPACING,
  DEFAULT_THUMBNAIL_SIZE,
} from '@shared/branding/galleryPresets';

export const defaultBranding = {
  id: '0',
  name: '',
  mode: ThemeMode.Auto,
  primaryColor: PrimaryColor.Blue,
  headingFontKey: HeadingFontKey.Default,
  thumbnailSize: DEFAULT_THUMBNAIL_SIZE,
  thumbnailSpacing: DEFAULT_SPACING,
  thumbnailBorderRadius: DEFAULT_BORDER_RADIUS,
  headingFontSize: DEFAULT_HEADING_FONT_SIZE,
};
