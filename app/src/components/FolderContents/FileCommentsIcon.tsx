import { File } from '@shared/gql/graphql';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PText } from '@/src/components/PText';
import { CommentIcon } from '@/src/components/AppIcons';

export const FileCommentsIcon = ({
  file,
}: {
  file: Pick<File, 'totalComments'>;
}) => {
  const theme = useAppTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 4,
      }}
    >
      <CommentIcon
        totalComments={file.totalComments}
        size={16}
        color={theme.textColor}
      />
      <PText>{file.totalComments}</PText>
    </View>
  );
};
