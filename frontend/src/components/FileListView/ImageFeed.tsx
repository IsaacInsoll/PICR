import { Box, Grid, Heading, Image } from 'grommet';
import { FileListViewStyleComponentProps } from './FileListView';
import { MinimalFile } from '../../../types';
import { imageURL } from '../../helpers/imageURL';

//from https://codesandbox.io/p/sandbox/o7wjvrj3wy?file=%2Fcomponents%2Frestaurant-card.js%3A174%2C7-182%2C13
export const ImageFeed = ({ files }: FileListViewStyleComponentProps) => {
  return (
    <Grid>
      {files.map((file) => (
        <FeedItem file={file} />
      ))}
    </Grid>
  );
};

const FeedItem = ({ file }: { file: MinimalFile }) => {
  return (
    <Box
      round="xxsmall"
      elevation="small"
      overflow="hidden"
      margin={{ bottom: 'small' }}
    >
      <Image src={imageURL(file, 'lg')} fit="contain" />
      <Heading level="5" margin="none">
        {file.name}
      </Heading>
    </Box>
  );
};
