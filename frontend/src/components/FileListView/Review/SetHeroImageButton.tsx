import { MinimalFile } from '../../../../types';
import { useMe } from '../../../hooks/useMe';
import { ActionIcon, Tooltip } from '@mantine/core';
import { TbPhotoHeart } from 'react-icons/tb';
import { gql } from '../../../helpers/gql';
import { useMutation } from 'urql';
import { useState } from 'react';

export const SetHeroImageButton = ({ file }: { file: MinimalFile }) => {
  const { isUser } = useMe();
  const [, mutate] = useMutation(editFolderMutation);
  const [loading, setLoading] = useState(false);
  if (!isUser || !file || !file.type == 'Image') return null;
  //TODO: actually do mutation
  //TODO: look different if we are looking at the current hero image :)
  const onClick = () => {
    setLoading(true);
    mutate({
      folderId: file.folderId,
      heroImageId: file?.id,
    }).then(() => setLoading(false));
  };
  return (
    <Tooltip label="Use this Image as the 'Hero Image' for this folder">
      <ActionIcon variant="default" onClick={onClick} loading={loading}>
        <TbPhotoHeart />
      </ActionIcon>
    </Tooltip>
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
