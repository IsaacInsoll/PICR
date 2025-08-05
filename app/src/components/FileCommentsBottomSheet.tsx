import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { PTitle } from '@/src/components/PTitle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReactNode, Suspense, useCallback, useEffect, useRef } from 'react';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Comment, File } from '@shared/gql/graphql';
import { PText } from '@/src/components/PText';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { commentHistoryQuery } from '@shared/urql/queries/commentHistoryQuery';
import { useQuery } from 'urql';
import { TextStyle, View, ViewStyle } from 'react-native';
import { AppAvatar } from '@/src/components/AppAvatar';

import { prettyDate } from '@shared/prettyDate';
import { Rating } from '@kolking/react-native-rating';
import { FileFlag } from '@shared/gql/graphql';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { Ionicons } from '@expo/vector-icons';

// This must be the bottom most element in the view
export const FileCommentsBottomSheet = ({
  file,
  open,
  onClose,
}: {
  file: File;
  open: boolean;
  onClose: () => void;
}) => {
  const safe = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const theme = useAppTheme();

  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [bottomSheetRef, open]);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      onChange={handleSheetChanges}
      onClose={onClose}
      enablePanDownToClose={true}
      index={-1} // start in closed state
      backgroundStyle={{ backgroundColor: theme.backgroundColor + 'ee' }}
      handleIndicatorStyle={{
        backgroundColor: theme.brandColor,
        opacity: 0.5,
      }}
    >
      <BottomSheetView
        style={{
          zIndex: 10000000,
          flex: 1,
          gap: 16,
          // padding: 100,
          alignItems: 'center',
          paddingBottom: safe.bottom, // system bottom bar :/
        }}
      >
        <PTitle level={3}>Comments for {file.name}</PTitle>
        <Suspense fallback={<AppLoadingIndicator />}>
          <FileCommentsBody id={file.id} />
        </Suspense>
      </BottomSheetView>
    </BottomSheet>
  );
};

const FileCommentsBody = ({ id }: { id: string }) => {
  const [result, requery] = useQuery({
    query: commentHistoryQuery,
    variables: { fileId: id },
    requestPolicy: 'cache-and-network',
  });

  const comments = result.data?.comments;
  if (comments?.length == 0)
    return <PText variant="dimmed">No Comments (yet!)</PText>;
  return (
    <>
      {comments.map((c) => (
        <AppComment comment={c} key={c.id} />
      ))}
    </>
  );
};

const AppComment = ({ comment }: { comment: Comment }) => {
  const { user, timestamp, systemGenerated } = comment;
  return (
    <View
      style={{
        paddingHorizontal: 16,
        width: '100%',
        flexDirection: 'row',
        gap: 16,
      }}
    >
      <AppAvatar user={user} size={32} />
      <View style={{ gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            paddingRight: 32,
          }}
        >
          <PText variant="dimmed">{user?.name}</PText>
          <PText variant="dimmed">{prettyDate(timestamp)}</PText>
          {/*TODO: copy commentAction component from web*/}
        </View>
        {systemGenerated ? (
          <CommentAction comment={comment} />
        ) : (
          <PText>Comment {comment.comment}</PText>
        )}
      </View>
    </View>
  );
};

const CommentAction = ({ comment }: { comment: Comment }) => {
  const json = JSON.parse(comment?.comment);
  if (!json) return null;
  return (
    <View>
      {json.rating != null ? (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <PText>Rating</PText>
          <Rating rating={json.rating} disabled size={12} />
        </View>
      ) : null}
      {json.flag ? <AppFileFlagBadge flag={json.flag} /> : null}
    </View>
  );
};

export const AppFileFlagBadge = ({
  flag,
  hideIfNone,
}: {
  flag: FileFlag;
  hideIfNone?: boolean;
}) => {
  if (hideIfNone && (!flag || flag == FileFlag.None)) return null;
  if (!flag) return null;
  const { icon, style } = fileFlagStyles[flag];
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 16,
        width: '100%',
      }}
    >
      {icon}
      <PText style={style}>{flag}</PText>
    </View>
  );
};

const fileFlagStyles: {
  [key in FileFlag]: { style: StyleProp<TextStyle>; icon: ReactNode };
} = {
  [FileFlag.Approved]: {
    style: { color: '#0f0' },
    icon: <Ionicons name="thumbs-up-outline" size={16} color={'#0f0'} />,
  },
  [FileFlag.None]: { style: {}, icon: null },
  [FileFlag.Rejected]: {
    style: {},
    icon: <Ionicons name="thumbs-up-outline" size={16} color={'#0f0'} />,
  },
} as const;
