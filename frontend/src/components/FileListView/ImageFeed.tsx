import { FileListViewStyleComponentProps } from './FolderContentsView';
import { MinimalFile } from '../../../types';
import { imageURL } from '../../helpers/imageURL';
import { useMemo, useState } from 'react';
import useMeasure from 'react-use-measure';
import { ActionIcon, Box, Divider, Group, Title, Tooltip } from '@mantine/core';
import { Page } from '../Page';
import { PicrImage } from '../PicrImage';
import { FileReview } from './Review/FileReview';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import { TbCloudDownload, TbInfoCircle, TbSlideshow } from 'react-icons/tb';
import { useOpenFileInfoModal } from '../../atoms/modalAtom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSetFolder } from '../../hooks/useSetFolder';

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
  const { isNone } = useCommentPermissions();
  const isMobile = useIsMobile();

  //we know image ratios and viewport width, so size things correctly before images have loaded
  const tempHeight = useMemo(() => {
    return bounds.width / (file.imageRatio ?? 1);
  }, [bounds.width, file.imageRatio]);

  const { type } = file;

  return (
    <Page
    // round="small"
    // elevation="small"
    // overflow="hidden"
    // margin={{ bottom: 'small' }}
    >
      <Box ref={ref} style={{ position: 'relative' }}>
        {/*{!imageLoaded ? (*/}
        {/*  <Skeleton style={{ height: tempHeight, ...tempBoxStyle }}>*/}
        {/*    <LoadingIndicator size="large" />*/}
        {/*  </Skeleton>*/}
        {/*) : null}*/}
        {/*<Link to={`./${file.id}`}>*/}
        {type == 'Image' ? (
          <PicrImage
            file={file}
            size="lg"
            src={imageURL(file, 'lg')}
            onImageLoaded={() => setImageLoaded(true)}
            onClick={() => onClick(file.id)}
            clickable={true}
          />
        ) : null}
        {/*</Link>*/}
        {file.type == 'Video' ? (
          <Box>
            <video controls playsInline style={{ maxWidth: '100%' }}>
              <source src={imageURL(file, 'raw')} />
            </video>
            {/*<VideoBadge file={file} size="xl" />*/}
          </Box>
        ) : null}
      </Box>
      <Group
        pb="lg"
        pt={4}
        style={{ flexDirection: isMobile && !isNone ? 'column' : 'row' }}
        gap={4}
      >
        <Title order={5} flex={1}>
          {file.name}
        </Title>
        <Group gap="xs">
          <FileReview file={file} />
          {!isNone ? <Divider orientation="vertical" /> : null}
          {file.type == 'Video' ? <OpenFileButton file={file} /> : null}
          <FileInfoButton file={file} />
          <FileDownloadButton file={file} />
        </Group>
      </Group>
    </Page>
  );
};

const FileDownloadButton = ({ file }: { file: MinimalFile }) => {
  return (
    <Tooltip label={`Download ${file.name}`}>
      <ActionIcon
        variant="default"
        component="a"
        href={imageURL(file, 'raw')}
        download={true}
      >
        <TbCloudDownload />
      </ActionIcon>
    </Tooltip>
  );
};

const FileInfoButton = ({ file }: { file: MinimalFile }) => {
  const openFileInfo = useOpenFileInfoModal();

  return (
    <Tooltip label={`File Info for ${file.name}`}>
      <ActionIcon variant="default" onClick={() => openFileInfo(file)}>
        <TbInfoCircle />
      </ActionIcon>
    </Tooltip>
  );
};
const OpenFileButton = ({ file }: { file: MinimalFile }) => {
  const setFolder = useSetFolder();

  return (
    <Tooltip label={`Open in Slideshow View`}>
      <ActionIcon
        variant="default"
        onClick={() => {
          setFolder({ id: file.folderId }, file);
        }}
      >
        <TbSlideshow />
      </ActionIcon>
    </Tooltip>
  );
};
