import { Branding, PrimaryColor, ThemeMode } from '../../../graphql-types';

export const defaultBranding: Branding = {
  id: '0',
  name: '',
  mode: ThemeMode.Auto,
  primaryColor: PrimaryColor.Blue,
  folders: [],
};
