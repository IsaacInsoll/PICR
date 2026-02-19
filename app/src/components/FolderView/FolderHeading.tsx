import { StyleSheet } from 'react-native';
import type { ViewFolderQuery } from '@shared/gql/graphql';
import { PView } from '@/src/components/PView';
import { PTitle } from '@/src/components/PTitle';
import { PText } from '@/src/components/PText';
import { PaddingSize } from '@/src/constants';
import { folderSubtitle } from '@/src/helpers/folderSubtitle';

type FolderHeadingData = Pick<
  ViewFolderQuery['folder'],
  'name' | 'title' | 'subtitle' | 'subFolders' | 'files'
>;

export const FolderHeading = ({ folder }: { folder: FolderHeadingData }) => {
  const title = folder.title ?? folder.name ?? 'Folder';
  const customSubtitle = folder.subtitle?.trim() ?? '';
  return (
    <PView style={styles.container} gap="xs">
      <PTitle level={1}>{title}</PTitle>
      {customSubtitle ? <PTitle level={3}>{customSubtitle}</PTitle> : null}
      <PText variant="dimmed">{folderSubtitle(folder)}</PText>
    </PView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: PaddingSize.md,
    paddingTop: PaddingSize.sm,
  },
});
