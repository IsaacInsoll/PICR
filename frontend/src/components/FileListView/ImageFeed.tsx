import { Box, Grid, Heading, Image, Spinner } from 'grommet';
import { FileListViewStyleComponentProps } from './FileListView';
import { MinimalFile } from '../../../types';
import { imageURL } from '../../helpers/imageURL';
import { useMemo, useState } from 'react';
import useMeasure from 'react-use-measure';

//from https://codesandbox.io/p/sandbox/o7wjvrj3wy?file=%2Fcomponents%2Frestaurant-card.js%3A174%2C7-182%2C13
export const ImageFeed = ({
  files,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  return (
    <>
      <Grid>
        {files.map((file) => (
          <FeedItem file={file} key={file.id} onClick={setSelectedFileId} />
        ))}
      </Grid>
    </>
  );
};

//I've done a bunch of 'detect if image loaded' because it feels shit without it
const FeedItem = ({
  file,
  onClick,
}: {
  file: MinimalFile;
  onClick: (str: string) => void;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [ref, bounds] = useMeasure();

  //we know image ratios and viewport width, so size things correctly before images have loaded
  const tempHeight = useMemo(() => {
    return bounds.width / (file.imageRatio ?? 1);
  }, [bounds.width, file.imageRatio]);

  return (
    <Box
      round="small"
      elevation="small"
      overflow="hidden"
      margin={{ bottom: 'small' }}
    >
      <Box ref={ref}>
        {!imageLoaded ? (
          <Box style={{ height: tempHeight, ...tempBoxStyle }}>
            <Spinner size="large" />
          </Box>
        ) : null}
        {/*<Link to={`./${file.id}`}>*/}
        <Image
          src={imageURL(file, 'lg')}
          fit="contain"
          fill="horizontal"
          alt={file.name}
          onLoad={() => setImageLoaded(true)}
          onClick={() => onClick(file.id)}
        />
        {/*</Link>*/}
      </Box>
      <Heading level="5" margin="none">
        {file.name}
      </Heading>
    </Box>
  );
};

const tempBoxStyle = { justifyContent: 'center', alignItems: 'center' };
