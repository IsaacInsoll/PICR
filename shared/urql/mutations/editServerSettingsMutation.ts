import { gql } from '../gql';

export const editServerSettingsMutation = gql(/* GraphQL */ `
  mutation EditServerSettingsMutation($input: EditServerSettingsInput!) {
    editServerSettings(input: $input) {
      useOriginalsForLightbox
      thumbnailJpegQuality
      thumbnailVariants {
        ...ThumbnailVariantFragment
      }
    }
  }
`);
