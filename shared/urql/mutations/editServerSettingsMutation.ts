import { gql } from '../gql';

export const editServerSettingsMutation = gql(/* GraphQL */ `
  mutation EditServerSettingsMutation($input: EditServerSettingsInput!) {
    editServerSettings(input: $input) {
      useOriginalsForLightbox
      thumbnailSmallPx
      thumbnailMediumPx
      thumbnailLargePx
      thumbnailJpegQuality
      thumbnailDimensions {
        sm
        md
        lg
      }
    }
  }
`);
