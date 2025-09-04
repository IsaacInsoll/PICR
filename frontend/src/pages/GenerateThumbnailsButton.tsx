import { useMutation, useQuery } from 'urql';
import { generateThumbnailsMutation } from '@shared/urql/mutations/generateThumbnailsMutation';
import { Button } from '@mantine/core';
import { TbPhotoCheck } from 'react-icons/tb';
import { generateThumbnailsQuery } from '@shared/urql/queries/generateThumbnailsQuery';

export const GenerateThumbnailsButton = ({
  folderId,
}: {
  folderId: number;
}) => {
  const [result] = useQuery({
    query: generateThumbnailsQuery,
    variables: { folderId },
  });
  const totalImages = result.data?.folder?.totalImages;
  const [, thumbsMutation] = useMutation(generateThumbnailsMutation);
  return (
    <Button
      variant="default"
      disabled={!totalImages || totalImages === 0}
      onClick={() => thumbsMutation({ folderId: folderId })}
    >
      <TbPhotoCheck />
      {`Generate ${totalImages} Thumbnails`}
    </Button>
  );
};
