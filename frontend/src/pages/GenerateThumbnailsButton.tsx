import { MinimalFolder } from '../../types';
import { useMutation, useQuery } from 'urql';
import { gql } from '../helpers/gql';
import { generateThumbnailsQuery } from '../urql/mutations/generateThumbnailsQuery';
import { Button } from '@mantine/core';
import { TbPhotoCheck } from 'react-icons/tb';

export const GenerateThumbnailsButton = ({
  folder,
}: {
  folder: MinimalFolder;
}) => {
  const [result] = useQuery({
    query: gql(/* GraphQL*/ `
        query generateThumbnailsStats($folderId: ID!) {
            folder(id: $folderId) {
                totalImages
            }
        }
    `),
    variables: { folderId: folder.id },
  });
  const totalImages = result.data.folder?.totalImages;
  const [, thumbsMutation] = useMutation(generateThumbnailsQuery);
  console.log(folder);
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
