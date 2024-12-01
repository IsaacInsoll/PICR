import { MinimalFile } from '../../../../types';
import { useMe } from '../../../hooks/useMe';
import { ActionIcon, Tooltip } from '@mantine/core';
import { TbPhotoHeart } from 'react-icons/tb';
import { gql } from '../../../helpers/gql';
import { useMutation } from 'urql';
import { useState } from 'react';
import { useReward } from 'react-rewards';

export const SetHeroImageButton = ({ file }: { file: MinimalFile }) => {
  const { isUser } = useMe();
  const [, mutate] = useMutation(editFolderMutation);
  const [loading, setLoading] = useState(false);

  const id = 'heroImageButton-' + file.id;
  const { reward } = useReward(id, 'confetti', confettiOptions);

  if (!isUser || !file || !file.type == 'Image') return null;
  //TODO: look different if we are looking at the current hero image :)
  const onClick = () => {
    if (file.isHeroImage) return;
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
          <TbPhotoHeart />
        </ActionIcon>
      </Tooltip>
    </>
  );
};

const editFolderMutation = gql(/* GraphQL */ `
  mutation editFolder($folderId: ID!, $heroImageId: ID!) {
    editFolder(folderId: $folderId, heroImageId: $heroImageId) {
      ...FolderFragment
      ...HeroImageFragment
    }
  }
`);

const confettiOptions = {
  zIndex: 1000,
  position: 'absolute',
  lifetime: 100,
};
