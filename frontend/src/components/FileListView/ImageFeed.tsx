import { FileListViewStyleComponentProps } from './FolderContentsView';
import { MinimalFile } from '../../../types';
import { imageURL } from '../../helpers/imageURL';
import { useMemo, useState } from 'react';
import useMeasure from 'react-use-measure';
import { LoadingIndicator } from '../LoadingIndicator';
import { Box, Group, Image, Skeleton, Title } from '@mantine/core';
import { Page } from '../Page';

import { VideoBadge } from './VideoBadge';
import { PicrImage } from '../PicrImage';
import { FileRating } from './FileRating';

//from https://codesandbox.io/p/sandbox/o7wjvrj3wy?file=%2Fcomponents%2Frestaurant-card.js%3A174%2C7-182%2C13
export const ImageFeed = ({
  files,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  return (
    <>
      <Box>
        {files.map((file) => (
          <FeedItem file={file} key={file.id} onClick={setSelectedFileId} />
        ))}
      </Box>
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
    <Page
    // round="small"
    // elevation="small"
    // overflow="hidden"
    // margin={{ bottom: 'small' }}
    >
      <Box ref={ref} style={{ position: 'relative' }}>
        {!imageLoaded ? (
          <Skeleton style={{ height: tempHeight, ...tempBoxStyle }}>
            <LoadingIndicator size="large" />
          </Skeleton>
        ) : null}
        {/*<Link to={`./${file.id}`}>*/}
        <PicrImage
          file={file}
          size="lg"
          src={imageURL(file, 'lg')}
          onImageLoaded={() => setImageLoaded(true)}
          onClick={() => onClick(file.id)}
          clickable={true}
        />
        {/*</Link>*/}
        {file.type == 'Video' ? <VideoBadge file={file} size="xl" /> : null}
      </Box>
      <Group justify="space-between" pb="sm" pt={4}>
        <Title order={5}>{file.name}</Title>
        <FileRating file={file} />
      </Group>
    </Page>
  );
};

const tempBoxStyle = { justifyContent: 'center', alignItems: 'center' };
