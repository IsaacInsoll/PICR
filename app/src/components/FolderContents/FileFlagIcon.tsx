import { File, FileFlag } from '@shared/gql/graphql';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Icon, IconProps } from '@expo/vector-icons/build/createIconSet';
import { ComponentProps } from 'react';
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
  const isApproved = flag == 'approved';
  const isRejected = flag == 'rejected';

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
        onPress={() => onChange(!isApproved ? 'approved' : 'none')}
      >
        <ApprovedIcon
          size={16}
          color={isApproved ? '#0f0' : theme.dimmedColor}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onChange(!isRejected ? 'rejected' : 'none')}
      >
        <RejectedIcon
          size={16}
          color={isRejected ? '#f00' : theme.dimmedColor}
        />
      </TouchableOpacity>
    </View>
  );
};
