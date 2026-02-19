import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { PTitle } from '@/src/components/PTitle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef } from 'react';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { PText } from '@/src/components/PText';
import { Keyboard, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appMetadataIcons } from '@/src/components/AppIcons';
import { metadataForPresentation } from '@shared/fileMetadata';

// This must be the bottom most element in the view
export const FileInfoBottomSheet = ({
  file,
  open,
  onClose,
}: {
  file: any;
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
                    name={
                      appMetadataIcons[icon ?? ''] ??
                      'information-circle-outline'
                    }
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
