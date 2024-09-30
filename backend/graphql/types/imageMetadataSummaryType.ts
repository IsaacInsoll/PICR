import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

//TODO: *NOT* capitalize these, that's just how they popped out of the exif reader, lol 🤪
export const imageMetadataSummaryType = new GraphQLObjectType({
  name: 'ImageMetadataSummary',
  fields: () => ({
    Camera: { type: GraphQLString },
    Lens: { type: GraphQLString },
    Artist: { type: GraphQLString },
    DateTimeEdit: { type: GraphQLString },
    DateTimeOriginal: { type: GraphQLString },
    Aperture: { type: GraphQLFloat },
    ExposureTime: { type: GraphQLFloat },
    ISO: { type: GraphQLFloat },
    Width: { type: GraphQLInt },
    Height: { type: GraphQLInt },
    Rating: { type: GraphQLInt },
  }),
});
