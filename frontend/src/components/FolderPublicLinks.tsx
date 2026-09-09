import { Avatar, Box, Group, Indicator, Tooltip } from '@mantine/core';
import { folderPublicLinksQuery } from '@shared/urql/queries/folderPublicLinksQuery';
import { publicLinkStatus } from '@shared/publicLinkExpiration';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { useQuery } from 'urql';
import { useBaseViewFolderURL } from '../hooks/useBaseViewFolderURL';
import { useDateFormatters } from '../i18n/useDateFormatters';
import { useNow } from '../hooks/useNow';
import { AddUserIcon, PublicLinkIcon } from '../PicrIcons';
import {
  newPublicLinkId,
  publicLinkEditorLink,
} from '../hooks/usePublicLinkEditorRoute';

const visibleAvatarCount = 3;
const statusRefreshMs = 60_000;

export const FolderPublicLinks = ({ folderId }: { folderId: string }) => {
  const { t } = useTranslation('admin');
  const baseUrl = useBaseViewFolderURL();
  const now = useNow(statusRefreshMs);
  const { formatRelativeTime } = useDateFormatters();
  const [result] = useQuery({
    query: folderPublicLinksQuery,
    variables: { folderId },
  });
  const links = useMemo(
    () =>
      [...(result.data?.users ?? [])].sort((a, b) =>
        (a.name ?? '').localeCompare(b.name ?? ''),
      ),
    [result.data?.users],
  );
  const manageLinksPath = `${baseUrl}${folderId}/manage/links`;
  const directLinkEditorPath = `${baseUrl}${folderId}`;
  const visibleLinks = links.slice(0, visibleAvatarCount);
  const remainingLinks = links.length - visibleLinks.length;
  const linksLabel = t('settings.tabs.links');
  const compactCount = links.length > 99 ? '99+' : links.length;

  if (!result.data) return null;

  return (
    <>
      <Box visibleFrom="sm">
        <Group gap={6} wrap="nowrap">
          {visibleLinks.length > 0 ? (
            <Avatar.Group spacing="sm">
              {visibleLinks.map((link) => {
                const id = link.id;
                const name = link.name ?? t('common.unnamed');
                const status = publicLinkStatus(link, now);
                const statusLabel =
                  status === 'active'
                    ? t('common.enabled')
                    : status === 'expired'
                      ? t('links.expired')
                      : t('common.disabled');
                const lastAccessLabel = link.lastAccess
                  ? formatRelativeTime(link.lastAccess)
                  : t('common.never');

                if (!id) return null;

                return (
                  <Tooltip
                    key={id}
                    label={
                      <Box py={2}>
                        <Box fw={600}>{name}</Box>
                        <Box fz="xs" opacity={0.8}>
                          {statusLabel}
                        </Box>
                        <Box fz="xs" opacity={0.8}>
                          {t('users.columns.lastAccess')}: {lastAccessLabel}
                        </Box>
                      </Box>
                    }
                    position="top"
                    offset={10}
                    maw={220}
                    multiline
                    withArrow
                    openDelay={150}
                    closeDelay={75}
                  >
                    <Indicator
                      color="red"
                      size={9}
                      offset={5}
                      position="top-end"
                      withBorder
                      disabled={status === 'active'}
                    >
                      <Avatar
                        component={NavLink}
                        {...publicLinkEditorLink(directLinkEditorPath, id)}
                        name={name}
                        src={link.gravatar ?? undefined}
                        color="initials"
                        radius="xl"
                        size="md"
                        aria-label={`${t('links.editor.title')} ${name}`}
                      />
                    </Indicator>
                  </Tooltip>
                );
              })}
              {remainingLinks > 0 ? (
                <Tooltip label={linksLabel}>
                  <Avatar
                    component={NavLink}
                    to={manageLinksPath}
                    color="gray"
                    radius="xl"
                    size="md"
                    aria-label={`${linksLabel}: ${links.length}`}
                  >
                    +{remainingLinks}
                  </Avatar>
                </Tooltip>
              ) : null}
            </Avatar.Group>
          ) : null}
          <Tooltip label={t('links.create')}>
            <Avatar
              component={NavLink}
              {...publicLinkEditorLink(directLinkEditorPath, newPublicLinkId)}
              color="gray"
              variant="outline"
              radius="xl"
              size="md"
              aria-label={t('links.create')}
            >
              <AddUserIcon size={18} />
            </Avatar>
          </Tooltip>
        </Group>
      </Box>
      <Box hiddenFrom="sm">
        <Tooltip label={`${linksLabel}: ${links.length}`}>
          <Indicator
            inline
            label={compactCount}
            size={18}
            offset={3}
            withBorder
          >
            <Avatar
              component={NavLink}
              to={manageLinksPath}
              color="gray"
              variant="outline"
              radius="xl"
              size="md"
              aria-label={`${linksLabel}: ${links.length}`}
            >
              <PublicLinkIcon size={18} />
            </Avatar>
          </Indicator>
        </Tooltip>
      </Box>
    </>
  );
};
