import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { PTitle } from '@/src/components/PTitle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { CommentHistoryQueryQuery, FileFlag } from '@shared/gql/graphql';
import { PText } from '@/src/components/PText';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { commentHistoryQuery } from '@shared/urql/queries/commentHistoryQuery';
import { useMutation, useQuery } from 'urql';
import {
  Keyboard,
  StyleSheet,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppAvatar } from '@/src/components/AppAvatar';
import { prettyDate } from '@shared/prettyDate';
import { Rating } from '@kolking/react-native-rating';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { Ionicons } from '@expo/vector-icons';
import { AppIconButton } from '@/src/components/AppIcons';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';

// This must be the bottom most element in the view
export const FileCommentsBottomSheet = ({
  file,
  open,
  onClose,
}: {
  file: { id: string; name: string };
  open: boolean;
  onClose: () => void;
}) => {
  const safe = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const theme = useAppTheme();
  const textInputRef = useRef<TextInput | null>(null);

  const [, mutate] = useMutation(addCommentMutation);

  const [addComment, setAddComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  console.log({ commentText }, commentText.length);
  const onShowAddComment = () => {
    setAddComment(true);
    setTimeout(() => textInputRef.current?.focus(), 100);
    bottomSheetRef.current?.expand();
  };
  const onHideAddComment = () => {
    setAddComment(false);
    Keyboard.dismiss();
    bottomSheetRef.current?.close();
  };

  const onSubmitComment = async () => {
    const result = await mutate({ comment: commentText, id: file.id });
    if (result.data && !result.error) {
      setAddComment(false);
      setCommentText('');
    }
  };

  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.snapToIndex(addComment ? 1 : 0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [addComment, bottomSheetRef, open]);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  const handleClose = () => {
    Keyboard.dismiss();
    if (onClose) onClose();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      onChange={handleSheetChanges}
      onClose={handleClose}
      enablePanDownToClose={!addComment}
      enableHandlePanningGesture={!addComment}
      enableContentPanningGesture={!addComment}
      enableDynamicSizing={false}
      index={-1} // start in closed state
      snapPoints={['50%', '100%']}
      keyboardBehavior="extend"
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
          padding: 8,
          // padding: 100,
          alignItems: 'center',
          paddingBottom: safe.bottom, // system bottom bar :/
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignContent: 'space-between',
            width: '100%',
          }}
        >
          <PTitle level={3} style={{ flexGrow: 1, maxWidth: '60%' }}>
            Comments for {file.name}
          </PTitle>
          <View
            style={{
              flexGrow: 1,
              flex: 1,
              justifyContent: 'flex-start',
              alignItems: 'flex-end',
            }}
          >
            {addComment ? (
              <TouchableOpacity onPress={onHideAddComment}>
                <Ionicons name="close" size={32} color={theme.brandColor} />
              </TouchableOpacity>
            ) : (
              <Ionicons.Button
                backgroundColor={theme.brandColor}
                name="chatbubble-ellipses-outline"
                size={16}
                onPress={onShowAddComment}
              >
                Add Comment
              </Ionicons.Button>
            )}
          </View>
        </View>
        <TextInput
          placeholder="Your comment..."
          multiline={true}
          value={commentText}
          onChangeText={(txt) => setCommentText(txt)}
          ref={textInputRef}
          style={[
            styles.commentInput,
            {
              color: theme.textColor,
              borderColor: theme.textColor + '40',
              display: addComment ? 'flex' : 'none',
            },
          ]}
        />
        {addComment ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              width: '100%',
            }}
          >
            <AppIconButton
              name="chatbubble-ellipses-outline"
              disabled={commentText.length === 0}
              onPress={onSubmitComment}
            >
              Add Comment
            </AppIconButton>
          </View>
        ) : null}
        <Suspense fallback={<AppLoadingIndicator />}>
          <FileCommentsBody id={file.id} />
        </Suspense>
      </BottomSheetView>
    </BottomSheet>
  );
};

const FileCommentsBody = ({ id }: { id: string }) => {
  const [result] = useQuery({
    query: commentHistoryQuery,
    variables: { fileId: id },
    requestPolicy: 'cache-and-network',
  });

  const comments = result.data?.comments ?? [];
  if (comments?.length === 0)
    return <PText variant="dimmed">No Comments (yet!)</PText>;
  return (
    <>
      {comments.map((c: CommentHistoryQueryQuery['comments'][number]) => (
        <AppComment comment={c} key={c.id} />
      ))}
    </>
  );
};

const AppComment = ({
  comment,
}: {
  comment: CommentHistoryQueryQuery['comments'][number];
}) => {
  const { user, timestamp, systemGenerated } = comment;
  return (
    <View style={styles.commentContainer}>
      <AppAvatar user={user ?? { name: 'Unknown', gravatar: null }} size={32} />
      <View style={{ gap: 8 }}>
        <View style={styles.comment}>
          <PText variant="dimmed">{user?.name}</PText>
          <PText variant="dimmed">{prettyDate(timestamp)}</PText>
        </View>
        {systemGenerated ? (
          <CommentAction comment={comment} />
        ) : (
          <PText>{comment.comment}</PText>
        )}
      </View>
    </View>
  );
};

const CommentAction = ({
  comment,
}: {
  comment: CommentHistoryQueryQuery['comments'][number];
}) => {
  const json = JSON.parse(comment?.comment ?? '{}');
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
  if (hideIfNone && (!flag || flag === FileFlag.None)) return null;
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
  [FileFlag.None]: {
    style: { color: '#888' },
    icon: <Ionicons name="flag-outline" size={16} color={'#888'} />,
  },
  [FileFlag.Rejected]: {
    style: { color: '#f00' },
    icon: <Ionicons name="thumbs-down-outline" size={16} color={'#f00'} />,
  },
} as const;

const styles = StyleSheet.create({
  comment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingRight: 32,
  },
  commentInput: {
    width: '100%',
    fontSize: 14,
    borderRadius: 4,
    borderWidth: 1,
    padding: 8,
  },
  commentContainer: {
    paddingHorizontal: 16,
    width: '100%',
    flexDirection: 'row',
    gap: 16,
  },
});
