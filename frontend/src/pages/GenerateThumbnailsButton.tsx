import { useMutation, useQuery } from 'urql';
import { generateThumbnailsMutation } from '@shared/urql/mutations/generateThumbnailsMutation';
import { Button } from '@mantine/core';
import { PhotoCheckIcon } from '../PicrIcons';
import { generateThumbnailsQuery } from '@shared/urql/queries/generateThumbnailsQuery';
import { useTranslation } from 'react-i18next';

export const GenerateThumbnailsButton = ({
  folderId,
}: {
  folderId: string;
}) => {
  const { t } = useTranslation('admin');
  const [result] = useQuery({
    query: generateThumbnailsQuery,
    variables: { folderId },
  });
  const totalImages = result.data?.folder.totalImages;
  const [, thumbsMutation] = useMutation(generateThumbnailsMutation);
  const handleClick = () => {
    void thumbsMutation({ folderId: folderId });
  };
  return (
    <Button
      variant="default"
      disabled={!totalImages || totalImages === 0}
      onClick={handleClick}
    >
      <PhotoCheckIcon />
      {t('folder.thumbnails.generate', { count: totalImages ?? 0 })}
    </Button>
  );
};
