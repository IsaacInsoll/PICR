import { ActionIcon, Anchor, Group, Stack, Text, Tooltip } from '@mantine/core';
import type { SocialLink } from '@shared/branding/socialLinkTypes';
import { SocialLinkIcon } from './SocialLinkIcon';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from '../atoms/themeModeAtom';

export const GalleryFooter = () => {
  const theme = useAtomValue(themeModeAtom);
  const socialLinks = (theme.socialLinks as SocialLink[] | null) ?? [];
  const hasContent = theme.footerTitle || socialLinks.length > 0;
  if (!hasContent) return null;

  return (
    <Stack align="center" gap="sm" py="xl" mt="xl">
      {theme.footerTitle ? (
        theme.footerUrl ? (
          <Anchor
            href={theme.footerUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Text fw={600} ff="var(--picr-heading-font)">
              {theme.footerTitle}
            </Text>
          </Anchor>
        ) : (
          <Text fw={600} ff="var(--picr-heading-font)">
            {theme.footerTitle}
          </Text>
        )
      ) : null}
      {socialLinks.length > 0 ? (
        <Group gap="xs">
          {socialLinks.map((link, i) => (
            <Tooltip key={i} label={link.title || link.url}>
              <ActionIcon
                component="a"
                href={link.url}
                target={link.openInNewTab ? '_blank' : undefined}
                rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                variant="default"
                size="lg"
              >
                <SocialLinkIcon type={link.type} size={20} />
              </ActionIcon>
            </Tooltip>
          ))}
        </Group>
      ) : null}
    </Stack>
  );
};
