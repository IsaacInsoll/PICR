import { gql } from '../gql';

export const editServerSettingsMutation = gql(/* GraphQL */ `
  mutation EditServerSettingsMutation($input: EditServerSettingsInput!) {
    editServerSettings(input: $input) {
      avifEnabled
      useOriginalsForLightbox
      thumbnailSmallPx
      thumbnailMediumPx
      thumbnailLargePx
      thumbnailJpegQuality
      thumbnailAvifQuality
      thumbnailDimensions {
        sm
        md
        lg
      }
    }
  }
`);
