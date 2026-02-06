import { MinimalFile } from '../../../../types';
import { useMe } from '../../../hooks/useMe';
import { ActionIcon, Tooltip } from '@mantine/core';
import { HeroImageIcon } from '../../../PicrIcons';
import { useMutation } from 'urql';
import { useId, useState } from 'react';
import { useReward } from 'react-rewards';
import { confettiOptions } from './ConfettiOptions';
import { editFolderMutation } from '@shared/urql/mutations/editFolderMutation';

export const SetHeroImageButton = ({ file }: { file: MinimalFile }) => {
  const me = useMe();
  const [, mutate] = useMutation(editFolderMutation);
  const [loading, setLoading] = useState(false);

  const id = useId();
  const { reward } = useReward(id, 'confetti', confettiOptions);

  if (!me?.isUser || !file || !file.type == 'Image') return null;
  //TODO: look different if we are looking at the current hero image :)
  const onClick = () => {
    // 2025: i've commented out the next line as it's already the hero image for this folder but you might want to set it again to cascade parents
    // if (file.isHeroImage) return;
    setLoading(true);
    mutate({
      folderId: file.folderId,
      heroImageId: file?.id,
    }).then(() => {
      setLoading(false);
      reward();
    });
  };
  return (
    <>
      <span id={id} />
      <Tooltip
        label={
          file.isHeroImage
            ? 'This is the Hero Image for this folder'
            : "Use this Image as the 'Hero Image' for this folder"
        }
      >
        <ActionIcon
          variant={file.isHeroImage ? 'filled' : 'default'}
          onClick={onClick}
          loading={loading}
          color="violet"
          // disabled={file.isHeroImage}
        >
          <HeroImageIcon />
        </ActionIcon>
      </Tooltip>
    </>
  );
};
