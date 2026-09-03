import type { ReactNode } from 'react';
import { Suspense, useMemo, useState } from 'react';
import { useQuery } from 'urql';
import { manageFolderQuery } from '@shared/urql/queries/manageFolderQuery';
import QueryFeedback from '../../components/QueryFeedback';
import { ManagePublicLink } from './ManagePublicLink';
import type { PicrFolder } from '@shared/types/picr';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DisconnectedIcon,
  PublicLinkIcon,
  SearchIcon,
} from '../../PicrIcons';
import { ModalLoadingIndicator } from '../../components/ModalLoadingIndicator';
import {
  Anchor,
  Button,
  Collapse,
  Divider,
  Group,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { PicrDataGrid } from '../../components/PicrDataGrid';
import { EmptyPlaceholder } from '../EmptyPlaceholder';

import { LoadingIndicator } from '../../components/LoadingIndicator';
import { Tips } from '../../components/Tips';
import { publicLinkColumns, userSearchText } from './userColumns';
import type { ManageFolderUserRow } from '@shared/types/queryRows';
import { PublicLinkListItem } from '../../components/PublicLinkListItem';
import { useTranslation } from 'react-i18next';
import { useNow } from '../../hooks/useNow';
import { publicLinkStatus } from '@shared/publicLinkExpiration';

const publicLinkStatusRefreshMs = 60_000;

interface ManagePublicLinksProps {
  folder: PicrFolder;
  children?: ReactNode;
  disableAddingLinks?: boolean;
  relations: 'none' | 'parents' | 'children' | 'options';
  variant?: 'table' | 'list';
  selectedLinkId?: string | null;
  onSelectLink?: (id: string) => void;
  onCreateLink?: () => void;
  onCloseLink?: () => void;
}

export const ManagePublicLinks = ({
  folder,
  children,
  disableAddingLinks,
  relations,
  variant = 'table',
  selectedLinkId,
  onSelectLink,
  onCreateLink,
  onCloseLink,
}: ManagePublicLinksProps) => {
  const { t } = useTranslation('admin');
  const [includeParents, setIncludeParents] = useState(relations === 'parents');
  const [includeChildren, setIncludeChildren] = useState(
    relations === 'children',
  );
  const [showRelatedFilters, setShowRelatedFilters] = useState(false);
  const [search, setSearch] = useState('');

  const [localLinkId, setLocalLinkId] = useState<string | null>(null);
  const isControlled =
    selectedLinkId !== undefined ||
    onSelectLink != null ||
    onCreateLink != null ||
    onCloseLink != null;
  const linkId = isControlled ? (selectedLinkId ?? null) : localLinkId;
  const manageLinkId = linkId === NEW_ITEM_SLUG ? '' : linkId;

  const selectLink = (id: string) => {
    if (onSelectLink) {
      onSelectLink(id);
      return;
    }

    setLocalLinkId(id);
  };

  const createLink = () => {
    if (onCreateLink) {
      onCreateLink();
      return;
    }

    setLocalLinkId('');
  };

  const closeLink = () => {
    if (onCloseLink) {
      onCloseLink();
      return;
    }

    setLocalLinkId(null);
  };

  return (
    <>
      {linkId !== null ? (
        <Suspense fallback={<ModalLoadingIndicator />}>
          <ManagePublicLink
            key={manageLinkId ?? NEW_ITEM_SLUG}
            onClose={closeLink}
            id={manageLinkId ?? ''}
            folder={folder}
          />
        </Suspense>
      ) : null}
      {relations === 'options' ? (
        <Stack>
          <Divider />
          <Tips type="PublicLink" />
        </Stack>
      ) : null}
      <Suspense fallback={<LoadingIndicator />}>
        <Body
          includeChildren={includeChildren}
          includeParents={includeParents}
          onSelectLink={selectLink}
          folderId={folder.id}
          variant={variant}
          search={search}
          setSearch={setSearch}
        />
      </Suspense>
      {relations === 'options' ? (
        <Stack gap="xs" pt="xs">
          <Group justify="flex-end">
            <Anchor
              component="button"
              type="button"
              size="xs"
              c="dimmed"
              onClick={() => setShowRelatedFilters((opened) => !opened)}
              aria-expanded={showRelatedFilters}
              style={{ lineHeight: 1.2 }}
            >
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                {t('links.relatedFilters')}
                {showRelatedFilters ? (
                  <ChevronUpIcon size={14} />
                ) : (
                  <ChevronDownIcon size={14} />
                )}
              </span>
            </Anchor>
          </Group>
          <Collapse expanded={showRelatedFilters}>
            <Stack gap="xs" pb="xs">
              <Switch
                checked={includeParents}
                onChange={(e) => setIncludeParents(e.currentTarget.checked)}
                label={t('links.includeParentsShort')}
                description={t('links.includeParentsDescription')}
                aria-label={t('links.includeParents')}
                style={{ width: '100%' }}
                styles={{
                  body: { width: '100%' },
                  labelWrapper: { flex: 1 },
                }}
              />
              <Switch
                checked={includeChildren}
                onChange={(e) => setIncludeChildren(e.currentTarget.checked)}
                label={t('links.includeChildrenShort')}
                description={t('links.includeChildrenDescription')}
                aria-label={t('links.includeChildren')}
                style={{ width: '100%' }}
                styles={{
                  body: { width: '100%' },
                  labelWrapper: { flex: 1 },
                }}
              />
            </Stack>
          </Collapse>
        </Stack>
      ) : null}
      <Group gap="md" pt="md" justify="space-evenly">
        {!disableAddingLinks ? (
          <Button variant="default" onClick={createLink}>
            <PublicLinkIcon />
            {t('links.create')}
          </Button>
        ) : null}
        {children}
      </Group>
    </>
  );
};

const Body = ({
  folderId,
  includeParents,
  includeChildren,
  onSelectLink,
  variant,
  search,
  setSearch,
}: {
  folderId: string;
  includeParents: boolean;
  includeChildren: boolean;
  onSelectLink: (id: string) => void;
  variant: 'table' | 'list';
  search: string;
  setSearch: (search: string) => void;
}) => {
  const [result, reQuery] = useQuery({
    query: manageFolderQuery,
    variables: { folderId, includeParents, includeChildren },
  });
  const users = result.data?.users ?? [];
  return (
    <>
      <QueryFeedback result={result} reQuery={reQuery} />
      <PublicLinksView
        links={users}
        onSelect={onSelectLink}
        variant={variant}
        search={search}
        setSearch={setSearch}
      />
    </>
  );
};

const NEW_ITEM_SLUG = 'new';

const PublicLinksView = ({
  links,
  onSelect,
  variant,
  search,
  setSearch,
}: {
  links: ManageFolderUserRow[];
  onSelect: (id: string) => void;
  variant: 'table' | 'list';
  search: string;
  setSearch: (search: string) => void;
}) => {
  const { t } = useTranslation('admin');
  const now = useNow(publicLinkStatusRefreshMs);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredLinks = useMemo(
    () =>
      normalizedSearch
        ? links.filter((link) =>
            userSearchText(link, t, publicLinkStatus(link, now)).includes(
              normalizedSearch,
            ),
          )
        : links,
    [links, normalizedSearch, now, t],
  );
  // Rebuilding the column defs hands TanStack a new `columns` array, and
  // PicrDataGrid is excluded from React Compiler, so memoize here rather than
  // re-deriving them on every keystroke and every clock tick.
  const columns = useMemo(() => publicLinkColumns(t, now), [now, t]);

  if (links.length === 0) {
    return (
      <EmptyPlaceholder text={t('links.empty')} icon={<DisconnectedIcon />} />
    );
  }
  if (variant === 'list') {
    return (
      <Stack gap="xs">
        {filteredLinks.map((link) => (
          <PublicLinkListItem
            key={link.id}
            user={link}
            now={now}
            onClick={() => {
              if (link.id) onSelect(link.id);
            }}
          />
        ))}
      </Stack>
    );
  }
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-end">
        <TextInput
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder={t('links.search')}
          leftSection={<SearchIcon />}
          style={{ flexGrow: 1, maxWidth: 420 }}
        />
        <Text size="sm" c="dimmed">
          {t('users.filteredCount', {
            visible: filteredLinks.length,
            total: links.length,
          })}
        </Text>
      </Group>
      <PicrDataGrid
        columns={columns}
        data={filteredLinks}
        onClick={(row) => {
          if (row.id) onSelect(row.id);
        }}
      />
    </Stack>
  );
};
