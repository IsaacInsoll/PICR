import {
  alpha,
  Box,
  Group,
  Text,
  Tooltip,
  useMantineTheme,
} from '@mantine/core';
import { MediaMatchSource } from '@shared/gql/graphql';
import { useTranslation } from 'react-i18next';
import { FolderIcon } from '../../PicrIcons';
import styles from './ResultFolderContext.module.css';

export interface ResultFileContext {
  folderId: string;
  folderName: string;
  relativePath: string;
  matchSource: MediaMatchSource | null;
}

export const ResultFolderContext = ({
  context,
  rootFolderName,
  overlay = false,
}: {
  context: ResultFileContext;
  rootFolderName: string;
  overlay?: boolean;
}) => {
  const { t } = useTranslation('gallery');
  const theme = useMantineTheme();
  const label = context.relativePath || rootFolderName;
  const matchedByFolder = context.matchSource === MediaMatchSource.FolderPath;
  const content = overlay ? (
    <Box
      maw="calc(100% - 16px)"
      px={7}
      py={3}
      bg={
        matchedByFolder
          ? 'var(--mantine-primary-color-filled)'
          : alpha(theme.colors.dark[9], 0.62)
      }
      c={theme.white}
      className={styles.overlay}
    >
      <Group gap={4} wrap="nowrap">
        <FolderIcon size={12} aria-hidden />
        <Text size="xs" truncate>
          {label}
        </Text>
      </Group>
    </Box>
  ) : (
    <Group gap={4} wrap="nowrap">
      <FolderIcon size={13} aria-hidden />
      <Text
        size="xs"
        c={matchedByFolder ? 'var(--mantine-primary-color-filled)' : 'dimmed'}
        fw={matchedByFolder ? 600 : undefined}
        truncate
      >
        {label}
      </Text>
    </Group>
  );

  return (
    <Tooltip
      label={
        matchedByFolder
          ? t('results.matchedFolderPath', { folder: label })
          : label
      }
      withArrow
    >
      <Box
        data-testid="result-folder-context"
        data-folder-match={matchedByFolder || undefined}
        miw={0}
      >
        {content}
      </Box>
    </Tooltip>
  );
};
