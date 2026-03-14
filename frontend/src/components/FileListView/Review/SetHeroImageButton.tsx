import type { PicrFile } from '@shared/types/picr';
import { useMe } from '../../../hooks/useMe';
import { ActionIcon, Menu, Tooltip } from '@mantine/core';
import { BannerImageIcon, HeroImageIcon } from '../../../PicrIcons';
import { useMutation } from 'urql';
import { useId, useState } from 'react';
import { useReward } from 'react-rewards';
import { confettiOptions } from './ConfettiOptions';
import { editFolderMutation } from '@shared/urql/mutations/editFolderMutation';
import { useOpenSetBannerImageModal } from '../../../atoms/modalAtom';

type HeroImageCandidate = Pick<
  PicrFile,
  'id' | 'type' | 'folderId' | 'isHeroImage' | 'isBannerImage'
>;

export const SetHeroImageButton = ({ file }: { file: HeroImageCandidate }) => {
  const me = useMe();
  const [, mutate] = useMutation(editFolderMutation);
  const [loading, setLoading] = useState(false);
  const openBannerModal = useOpenSetBannerImageModal();

  const id = useId();
  const { reward } = useReward(id, 'confetti', confettiOptions);

  if (!me?.isUser || !file || file.type !== 'Image') return null;

  const onSetHero = () => {
    if (!file.folderId) return;
    setLoading(true);
    void mutate({
      folderId: file.folderId,
      heroImageId: file.id,
    }).then(() => {
      setLoading(false);
      reward();
    });
  };

  const onSetBanner = () => {
    openBannerModal(file);
  };

  const isActive = file.isHeroImage || file.isBannerImage;

  return (
    <>
      <span id={id} />
      <Menu shadow="md" width={200}>
        <Tooltip label="Set as Hero / Banner Image">
          <Menu.Target>
            <ActionIcon
              variant={isActive ? 'filled' : 'default'}
              loading={loading}
              color="violet"
            >
              <HeroImageIcon />
            </ActionIcon>
          </Menu.Target>
        </Tooltip>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<HeroImageIcon />}
            disabled={!!file.isHeroImage}
            onClick={onSetHero}
          >
            Set as Hero Image
          </Menu.Item>
          <Menu.Item leftSection={<BannerImageIcon />} onClick={onSetBanner}>
            {file.isBannerImage ? 'Change Banner Size' : 'Set as Banner Image'}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
};
