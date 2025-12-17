import { Suspense, useEffect, useMemo, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from 'urql';
import { searchQuery } from '@shared/urql/queries/searchQuery';
import { File, Folder } from '@shared/gql/graphql';
import { useMe } from '@/src/hooks/useMe';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { PTitle } from '@/src/components/PTitle';
import { PText } from '@/src/components/PText';
import { AppView } from '@/src/components/AppView';
import { AppLink } from '@/src/components/AppFolderLink';
import { PFileView } from '@/src/components/PFileView';
import {
  AppFooterPadding,
  AppHeaderPadding,
} from '@/src/components/AppHeaderPadding';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { AppFileFlagChip } from '@/src/components/chips/AppFileFlagChip';
import { AppFileRatingChip } from '@/src/components/chips/AppFileRatingChip';
import { AppCommentsChip } from '@/src/components/chips/AppCommentsChip';
import { folderCache } from '@/src/helpers/folderCache';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { TogglePill } from '@/src/components/TogglePill';

type Scope = 'current' | 'all';
type ResultType = 'all' | 'file' | 'folder';

export default function FindScreen() {
  const params = useLocalSearchParams<{ folderId?: string | string[] }>();
  const me = useMe();
  const theme = useAppTheme();
  const initialFolderId = Array.isArray(params.folderId)
    ? params.folderId[0]
    : params.folderId;
  const initialFolderName =
    initialFolderId && folderCache[initialFolderId]?.name
      ? folderCache[initialFolderId]?.name
      : undefined;
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('current');
  const [type, setType] = useState<ResultType>('all');
  const [debouncedQuery] = useDebouncedValue(query, 250);
  const trimmedQuery = debouncedQuery.trim();

  const activeFolderId =
    scope === 'all' ? me?.folderId : (initialFolderId ?? me?.folderId);

  const queryEnabled = !!activeFolderId && trimmedQuery !== '';

  const currentScopeLabel =
    scope === 'all'
      ? 'All folders'
      : initialFolderName
        ? initialFolderName
        : initialFolderId && initialFolderId !== me?.folderId
          ? 'This folder'
          : 'Home folder';

  const handleChangeQuery = (text: string) => {
    if (text.endsWith('`')) return;
    setQuery(text);
  };

  return (
    <AppView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerTitle: 'Find',
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <AppHeaderPadding />
        <View style={styles.container}>
          <PTitle level={2}>Find files & folders</PTitle>
          <TextInput
            value={query}
            onChangeText={handleChangeQuery}
            placeholder="Type to search"
            placeholderTextColor={theme.dimmedColor}
            style={[
              styles.input,
              {
                color: theme.textColor,
                borderColor: theme.dimmedColor,
                backgroundColor:
                  theme.mode === 'dark' ? '#00000044' : '#00000008',
              },
            ]}
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
          />
          {/*Hiding this, it works but you can only search from default folder currently*/}
          {/*<View style={styles.toggleRow}>*/}
          {/*  <TogglePill*/}
          {/*    label={currentScopeLabel}*/}
          {/*    active={scope === 'current'}*/}
          {/*    onPress={() => setScope('current')}*/}
          {/*  />*/}
          {/*  <TogglePill*/}
          {/*    label="Everywhere"*/}
          {/*    active={scope === 'all'}*/}
          {/*    onPress={() => setScope('all')}*/}
          {/*  />*/}
          {/*</View>*/}
          <View style={styles.toggleRow}>
            <TogglePill
              label="Everything"
              active={type === 'all'}
              onPress={() => setType('all')}
            />
            <TogglePill
              label="Files"
              active={type === 'file'}
              onPress={() => setType('file')}
            />
            <TogglePill
              label="Folders"
              active={type === 'folder'}
              onPress={() => setType('folder')}
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Suspense
            fallback={
              <View style={{ flex: 1, paddingHorizontal: 16 }}>
                <LoadingRow />
              </View>
            }
          >
            <SearchResults
              activeFolderId={activeFolderId}
              trimmedQuery={trimmedQuery}
              queryEnabled={queryEnabled}
              type={type}
            />
          </Suspense>
        </View>
      </SafeAreaView>
    </AppView>
  );
}

const SearchResults = ({
  activeFolderId,
  trimmedQuery,
  queryEnabled,
  type,
}: {
  activeFolderId?: string;
  trimmedQuery: string;
  queryEnabled: boolean;
  type: ResultType;
}) => {
  const [result] = useQuery({
    query: searchQuery,
    variables: { folderId: activeFolderId ?? '', query: trimmedQuery },
    pause: !queryEnabled,
  });

  const folders = result.data?.searchFolders ?? [];
  const files = result.data?.searchFiles ?? [];
  const list = useMemo(() => {
    if (type === 'file') return files;
    if (type === 'folder') return folders;
    return [...folders, ...files];
  }, [files, folders, type]);

  const moreResults = folders.length === 100 || files.length === 100;
  const totalResults = folders.length + files.length;
  const searching = queryEnabled && result.fetching;

  return (
    <FlashList
      data={list}
      estimatedItemSize={96}
      keyExtractor={(item) => item.__typename + item.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
        gap: 8,
      }}
      ListHeaderComponent={searching ? <LoadingRow /> : null}
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      renderItem={({ item }) => <SearchResultRow item={item} />}
      ListEmptyComponent={() => (
        <EmptyState hasQuery={trimmedQuery.length > 0} isLoading={searching} />
      )}
      ListFooterComponent={
        moreResults || totalResults > 0 ? (
          <SearchFooter
            totalFiles={files.length}
            totalFolders={folders.length}
            moreResults={moreResults}
          />
        ) : (
          <AppFooterPadding />
        )
      }
    />
  );
};

const SearchResultRow = ({ item }: { item: File | Folder }) => {
  const isFolder = item.__typename === 'Folder';
  const secondary = isFolder
    ? formatFolderPath(item)
    : formatFilePath(item as File);

  return (
    <AppLink item={item} asChild>
      <TouchableOpacity>
        <View style={styles.resultRow}>
          <PFileView
            file={item}
            variant="rounded-fit"
            style={styles.thumbnail}
            size="sm"
          />
          <View style={{ flex: 1, gap: 6 }}>
            <PTitle level={4}>{item.name}</PTitle>
            {secondary ? (
              <PText variant="dimmed" numberOfLines={1}>
                {secondary}
              </PText>
            ) : null}
            {isFolder ? (
              <PText variant="dimmed">Folder</PText>
            ) : (
              <View style={styles.fileMetaRow}>
                <PText variant="dimmed">{(item as File).type}</PText>
                <AppFileFlagChip flag={(item as File).flag} hideIfNone />
                <AppFileRatingChip rating={(item as File).rating} />
                <AppCommentsChip totalComments={(item as File).totalComments} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </AppLink>
  );
};

const EmptyState = ({
  hasQuery,
  isLoading,
}: {
  hasQuery: boolean;
  isLoading: boolean;
}) => {
  if (isLoading) return <LoadingRow />;
  return (
    <View style={styles.emptyState}>
      <PText variant="dimmed">
        {hasQuery ? 'No matches yet' : 'Start typing to search your library'}
      </PText>
    </View>
  );
};

const LoadingRow = () => (
  <View style={styles.loadingRow}>
    <AppLoadingIndicator />
  </View>
);

const SearchFooter = ({
  totalFiles,
  totalFolders,
  moreResults,
}: {
  totalFiles: number;
  totalFolders: number;
  moreResults: boolean;
}) => {
  const total = totalFiles + totalFolders;
  return (
    <View style={{ paddingVertical: 12, gap: 4 }}>
      {moreResults ? (
        <PText>
          Results limited to 100 files and folders. Refine your search for more
          precise matches.
        </PText>
      ) : null}
      {total > 0 ? (
        <PText variant="dimmed">
          Showing {totalFolders} folder{totalFolders === 1 ? '' : 's'} and{' '}
          {totalFiles} file{totalFiles === 1 ? '' : 's'}.
        </PText>
      ) : null}
      <AppFooterPadding />
    </View>
  );
};

const formatFolderPath = (folder: Folder) => {
  const parents = folder.parents ?? [];
  const names = parents.map((p) => p?.name).filter(Boolean);
  if (!names.length) return '';
  return [...names, folder.name].join(' / ');
};

const formatFilePath = (file: File) => {
  if (file.folder?.name) return file.folder.name;
  return '';
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    opacity: 0.1,
    backgroundColor: '#999',
  },
  fileMetaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
