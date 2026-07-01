import { gql } from '../gql';

export const meGalleryPasscodeQuery = gql(/* GraphQL */ `
  query MeGalleryPasscodeQuery {
    me {
      id
      galleryPasscode
    }
  }
`);
