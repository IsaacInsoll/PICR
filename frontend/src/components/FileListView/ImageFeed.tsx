import { FileListViewStyleComponentProps } from './FolderContentsView';
import { imageURL } from '../../helpers/imageURL';
import { useEffect, useMemo } from 'react';
import useMeasure from 'react-use-measure';
import {
  ActionIcon,
  Box,
  Container,
  Divider,
  Group,
  Title,
  Tooltip,
} from '@mantine/core';
import { Page } from '../Page';
import { PicrImage } from '../PicrImage';
import { FileReview } from './Review/FileReview';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';
import { TbCloudDownload, TbSlideshow } from 'react-icons/tb';
import { useOpenFileInfoModal } from '../../atoms/modalAtom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSetFolder } from '../../hooks/useSetFolder';
import { InfoIcon } from '../../PicrIcons';
import { PicrFolder, PicrGenericFile } from '../PicrFolder';
import { useInView } from 'react-intersection-observer';
import { useLazyLoad } from '../../hooks/useLazyLoad';
import {
  FolderContentsItem,
  isFolderContentsFile,
  ViewFolderFileWithHero,
  ViewFolderSubFolder,
} from '@shared/files/folderContentsViewModel';

//from https://codesandbox.io/p/sandbox/o7wjvrj3wy?file=%2Fcomponents%2Frestaurant-card.js%3A174%2C7-182%2C13

export const ImageFeed = ({
  files,
  folders,
  items,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  const setFolder = useSetFolder();
  const [ref, bounds] = useMeasure();
  const orderedItems: FolderContentsItem[] = items ?? [...folders, ...files];

  const [lazyLoaded, onBecomeVisible] = useLazyLoad(15, orderedItems.length);
  const loadedItems = orderedItems.slice(0, lazyLoaded);

  return (
    <Container>
      <Box ref={ref}></Box>
      {bounds.width == 0 ? null : (
        <>
          {loadedItems.map((item, i) =>
            isFolderContentsFile(item) ? (
              <FeedItem
                file={item}
                key={item.id}
                onClick={setSelectedFileId}
                width={bounds.width}
                onBecomeVisible={() => onBecomeVisible(i)}
              />
            ) : (
              <FeedFolderItem
                folder={item}
                key={item.id}
                onClick={() => setFolder(item)}
                onBecomeVisible={() => onBecomeVisible(i)}
              />
            ),
          )}
        </>
      )}
    </Container>
  );
};

//I've done a bunch of 'detect if image loaded' because it feels shit without it
const FeedItem = ({
  file,
  onClick,
  width,
  onBecomeVisible,
}: {
  file: ViewFolderFileWithHero;
  onClick: (str: string) => void;
  width: number;
  onBecomeVisible?: () => void;
}) => {
  const { isNone } = useCommentPermissions();
  const isMobile = useIsMobile();

  const { ref, inView } = useInView({ threshold: 0 });
  useEffect(() => {
    if (inView && onBecomeVisible) {
      onBecomeVisible();
    }
  }, [inView, onBecomeVisible]);

  //we know image ratios and viewport width, so size things correctly before images have loaded
  const dimensions = useMemo(() => {
    return {
      width: width,
      height: file.imageRatio ? width / file.imageRatio : 75,
    };
  }, [width, file.imageRatio]);

  const { type } = file;
  return (
    <Box
      ref={ref}
      style={{ minHeight: dimensions.height }}
      // round="small"
      // elevation="small"
      // overflow="hidden"
      // margin={{ bottom: 'small' }}
    >
      <Box style={{ position: 'relative' }}>
        {/*{!imageLoaded ? (*/}
        {/*  <Skeleton style={{ height: tempHeight, ...tempBoxStyle }}>*/}
        {/*    <LoadingIndicator size="large" />*/}
        {/*  </Skeleton>*/}
        {/*) : null}*/}
        {/*<Link to={`./${file.id}`}>*/}
        {type == 'Image' ? (
          <Box style={{ ...dimensions, overflowY: 'hidden' }}>
            <PicrImage
              file={file}
              size="lg"
              src={imageURL(file, 'lg')}
              onClick={() => onClick(file.id)}
              clickable={true}
              style={dimensions}
            />
          </Box>
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
        {file.type == 'File' ? (
          <PicrGenericFile file={file} style={{ height: 75 }} />
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
    </Box>
  );
};

const FeedFolderItem = ({
  folder,
  onClick,
  onBecomeVisible,
}: {
  folder: ViewFolderSubFolder;
  onClick: () => void;
  onBecomeVisible?: () => void;
}) => {
  const { ref, inView } = useInView({ threshold: 0 });
  useEffect(() => {
    if (inView && onBecomeVisible) {
      onBecomeVisible();
    }
  }, [inView, onBecomeVisible]);

  return (
    <Box ref={ref}>
      <Page key={folder.id}>
        <PicrFolder
          folder={folder}
          mb="md"
          style={{ height: 75 }}
          onClick={onClick}
        />
      </Page>
    </Box>
  );
};

const FileDownloadButton = ({ file }: { file: ViewFolderFileWithHero }) => {
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

const FileInfoButton = ({ file }: { file: ViewFolderFileWithHero }) => {
  const openFileInfo = useOpenFileInfoModal();

  return (
    <Tooltip label={`File Info for ${file.name}`}>
      <ActionIcon variant="default" onClick={() => openFileInfo(file.id)}>
        <InfoIcon />
      </ActionIcon>
    </Tooltip>
  );
};
const OpenFileButton = ({ file }: { file: ViewFolderFileWithHero }) => {
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
