import { File } from '@shared/gql/graphql';
import { Rating } from '@kolking/react-native-rating';

export const FileRating = ({
  file,
  onChange,
}: {
  file: Pick<File, 'rating'>;
  onChange: (rating: number) => void;
}) => {
  const handleChange = (r: number) => {
    return onChange(r === file.rating ? 0 : r);
  };
  return (
    <Rating
      rating={file.rating ?? undefined}
      size={16}
      onChange={handleChange}
    />
  );
};
