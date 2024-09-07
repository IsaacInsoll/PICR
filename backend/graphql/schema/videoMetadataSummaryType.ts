import {
  GraphQLFloat,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';

//TODO: *NOT* capitalize these, that's just how they popped out of the exif reader, lol 🤪
export const videoMetadataSummaryType = new GraphQLObjectType({
  name: 'VideoMetadataSummary',
  fields: () => ({
    //      m.VideoCodec = video.codec_name;
    //       m.VideoCodecDescription = video.codec_long_name;
    //       m.Width = video.width;
    //       m.Height = video.height;
    //       m.Framerate = eval(video.avg_frame_rate) ?? 0; // TODO: convert "25/1" to

    //      m.AudioCodec = audio.codec_name;
    //       m.AudioCodecDescription = audio.codec_long_name;

    //
    Bitrate: { type: GraphQLInt },
    Duration: { type: GraphQLFloat },
    Format: { type: GraphQLString },

    VideoCodec: { type: GraphQLString },
    VideoCodecDescription: { type: GraphQLString },
    Width: { type: GraphQLInt },
    Height: { type: GraphQLInt },
    Framerate: { type: GraphQLFloat },

    AudioCodec: { type: GraphQLString },
    AudioCodecDescription: { type: GraphQLString },
    // Artist: { type: GraphQLString },
    // DateTimeEdit: { type: GraphQLString },
    // DateTimeOriginal: { type: GraphQLString },
    // Aperture: { type: GraphQLFloat },
    // ExposureTime: { type: GraphQLFloat },
    // ISO: { type: GraphQLFloat },
  }),
});
