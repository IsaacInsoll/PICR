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
import { Comment, File, FileFlag } from '@shared/gql/graphql';
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
import { AppIconButton, appMetadataIcons } from '@/src/components/AppIcons';
import { addCommentMutation } from '@shared/urql/mutations/addCommentMutation';
import { metadataForPresentation } from '@shared/fileMetadata';

// This must be the bottom most element in the view
export const FileInfoBottomSheet = ({
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

  const list = metadataForPresentation(file);

  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [bottomSheetRef, open]);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

  const handleClose = () => {
    Keyboard.dismiss();
    if (onClose) onClose();
  };

  //TODO: refactor metadataTableRows.tsx from frontend to abstract where appropriate

  return (
    <BottomSheet
      ref={bottomSheetRef}
      onChange={handleSheetChanges}
      onClose={handleClose}
      enablePanDownToClose={true}
      enableHandlePanningGesture={true}
      enableContentPanningGesture={true}
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
        <PTitle level={3} style={{ flexGrow: 1, maxWidth: '60%' }}>
          {file.name}
        </PTitle>
        {!file.metadata ? (
          <PText>No Metadata Available</PText>
        ) : (
          <View
            style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap' }}
          >
            {list.map(({ description, label, icon }) => (
              <View
                style={{
                  width: '45%',
                  padding: 8,
                  flexDirection: 'row',
                }}
                key={description}
              >
                <View style={{ width: 32, paddingTop: 0 }}>
                  <Ionicons
                    name={appMetadataIcons[icon]}
                    size={24}
                    color={theme.textColor}
                    style={{ opacity: 0.33 }}
                  />
                </View>
                <View style={{ gap: 4 }}>
                  <PText variant="dimmed">{description}</PText>
                  <PText>{label}</PText>
                </View>
              </View>
            ))}
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({});
