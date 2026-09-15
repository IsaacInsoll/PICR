import type { ButtonProps } from '@mantine/core';
import { Button, Menu } from '@mantine/core';
import { useState } from 'react';
import { atom } from 'jotai';
import { ChevronDownIcon, DownloadIcon, FolderIcon } from '../PicrIcons';
import { useGenerateZip } from '../hooks/useGenerateZip';
import type { PicrFolder } from '@shared/types/picr';
import { useTranslation } from 'react-i18next';
import type { MediaResultsSelectionInput } from '@shared/gql/graphql';

// list of URLs we have requested to download that are currently generating.
// delete from list once you have triggered it's download
export type PendingZipDownload = {
  folder: PicrFolder;
  hash: string;
};

export const linksToDownloadAtom = atom<PendingZipDownload[]>([]);

export const DownloadZipButton = ({
  folder,
  disabled,
  selection,
  selectionCount,
  selectionKind = 'shown',
  selectionDisabled,
  selectionUnavailableReason,
  ...props
}: {
  folder: PicrFolder;
  disabled?: boolean;
  selection?: MediaResultsSelectionInput;
  selectionCount?: number;
  selectionKind?: 'shown' | 'results';
  selectionDisabled?: boolean;
  selectionUnavailableReason?: string;
} & ButtonProps) => {
  const { t } = useTranslation('gallery');
  const [tempDisabled, setTempDisabled] = useState(false);
  const generateFolderZip = useGenerateZip(folder, () =>
    setTempDisabled(false),
  );
  const generateSelectionZip = useGenerateZip(
    folder,
    () => setTempDisabled(false),
    selection,
    selectionCount,
  );
  const run = (generate: (() => Promise<number | undefined>) | null) => {
    if (!generate) return;
    setTempDisabled(true);
    void generate().finally(() => setTempDisabled(false));
  };

  if (!generateFolderZip) return null;
  const button = (
    <Button
      variant="filled"
      {...props}
      title={t('download.title')}
      onClick={() => run(generateFolderZip)}
      disabled={disabled || tempDisabled}
      leftSection={<DownloadIcon />}
    >
      {t('download.button')}
    </Button>
  );

  if (selectionCount === undefined) return button;

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Button
          variant="filled"
          {...props}
          title={t('download.chooseTarget')}
          disabled={disabled || tempDisabled}
          leftSection={<DownloadIcon />}
          rightSection={<ChevronDownIcon size={14} />}
        >
          {t('download.button')}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<DownloadIcon size={18} />}
          disabled={!selection || selectionDisabled || selectionCount === 0}
          onClick={() => run(generateSelectionZip)}
        >
          {selectionKind === 'results'
            ? t('download.results', { count: selectionCount })
            : t('download.shown', { count: selectionCount })}
        </Menu.Item>
        {selectionUnavailableReason ? (
          <Menu.Label maw={280}>{selectionUnavailableReason}</Menu.Label>
        ) : null}
        <Menu.Item
          leftSection={<FolderIcon size={18} />}
          onClick={() => run(generateFolderZip)}
        >
          {t('download.entireFolder', { folder: folder.name })}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
