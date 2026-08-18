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
import type { ReviewButtonVariant } from './FileReview';
import { useTranslation } from 'react-i18next';

type HeroImageCandidate = Pick<
  PicrFile,
  'id' | 'type' | 'folderId' | 'isHeroImage' | 'isBannerImage'
>;

export const SetHeroImageButton = ({
  file,
  variant = 'default',
}: {
  file: HeroImageCandidate;
  variant?: ReviewButtonVariant;
}) => {
  const { t } = useTranslation('admin');
  const me = useMe();
  const [, mutate] = useMutation(editFolderMutation);
  const [loading, setLoading] = useState(false);
  const openBannerModal = useOpenSetBannerImageModal();
  const canSetHero = file.type === 'Image' || file.type === 'Video';
  const canSetBanner = file.type === 'Image';

  const id = useId();
  const { reward } = useReward(id, 'confetti', confettiOptions);

  if (!me?.isUser || !canSetHero) return null;

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

  const isActive = file.isHeroImage || (canSetBanner && file.isBannerImage);

  return (
    <>
      <span id={id} />
      <Menu shadow="md" width={200}>
        <Tooltip
          label={
            canSetBanner
              ? t('folder.banner.setHeroOrBanner')
              : t('folder.banner.setHero')
          }
        >
          <Menu.Target>
            <ActionIcon
              variant={isActive ? 'filled' : variant}
              loading={loading}
              // See FileFlagButtons: `subtle` applies `color` to the icon, so it
              // is only passed when the state is actually set.
              color={isActive ? 'violet' : undefined}
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
            {t('folder.banner.setHero')}
          </Menu.Item>
          {canSetBanner ? (
            <Menu.Item leftSection={<BannerImageIcon />} onClick={onSetBanner}>
              {file.isBannerImage
                ? t('folder.banner.changeSize')
                : t('folder.banner.setImage')}
            </Menu.Item>
          ) : null}
        </Menu.Dropdown>
      </Menu>
    </>
  );
};
