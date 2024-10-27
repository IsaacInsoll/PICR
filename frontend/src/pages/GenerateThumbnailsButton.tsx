import { MinimalFolder } from '../../types';
import { useMutation, useQuery } from 'urql';
import { gql } from '../helpers/gql';
import { generateThumbnailsQuery } from '../urql/mutations/generateThumbnailsQuery';
import { Button } from '@mantine/core';
import { TbPhotoCheck } from 'react-icons/tb';

export const GenerateThumbnailsButton = ({
  folderId,
}: {
  folderId: number;
}) => {
  const [result] = useQuery({
    query: gql(/* GraphQL*/ `
        query generateThumbnailsStats($folderId: ID!) {
            folder(id: $folderId) {
                ...FolderFragment
                totalImages
            }
        }
    `),
    variables: { folderId },
  });
  const totalImages = result.data?.folder?.totalImages;
  const [, thumbsMutation] = useMutation(generateThumbnailsQuery);
  return (
    <Button
      variant="default"
      disabled={!totalImages || totalImages === 0}
      onClick={() => thumbsMutation({ folderId: folder.id })}
    >
      <TbPhotoCheck />
      {`Generate ${totalImages} Thumbnails`}
    </Button>
  );
};
