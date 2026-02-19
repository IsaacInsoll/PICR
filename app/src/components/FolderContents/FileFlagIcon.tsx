import { File, FileFlag } from '@shared/gql/graphql';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { TouchableOpacity, View } from 'react-native';
import { ApprovedIcon, RejectedIcon } from '@/src/components/AppIcons';

export const FileFlagIcon = ({
  file,
  onChange,
}: {
  file: Pick<File, 'flag'>;
  onChange: (flag?: FileFlag) => void;
}) => {
  const theme = useAppTheme();
  const flag = file.flag;
  const isApproved = flag === 'approved';
  const isRejected = flag === 'rejected';

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
      }}
    >
      <TouchableOpacity
        onPress={() =>
          onChange(!isApproved ? FileFlag.Approved : FileFlag.None)
        }
      >
        <ApprovedIcon
          size={16}
          color={isApproved ? '#0f0' : theme.dimmedColor}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          onChange(!isRejected ? FileFlag.Rejected : FileFlag.None)
        }
      >
        <RejectedIcon
          size={16}
          color={isRejected ? '#f00' : theme.dimmedColor}
        />
      </TouchableOpacity>
    </View>
  );
};
