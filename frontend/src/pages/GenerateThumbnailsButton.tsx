import { useMutation, useQuery } from 'urql';
import { generateThumbnailsMutation } from '@shared/urql/mutations/generateThumbnailsMutation';
import { Button } from '@mantine/core';
import { PhotoCheckIcon } from '../PicrIcons';
import { generateThumbnailsQuery } from '@shared/urql/queries/generateThumbnailsQuery';

export const GenerateThumbnailsButton = ({
  folderId,
}: {
  folderId: string;
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
      <PhotoCheckIcon />
      {`Generate ${totalImages} Thumbnails`}
    </Button>
  );
};
