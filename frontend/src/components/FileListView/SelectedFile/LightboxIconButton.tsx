import { ActionIcon, Divider, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';

// Groups related toolbar controls, matching the vertical dividers FileReview
// already uses in the bottom rail.
export const LightboxToolbarDivider = () => (
  <Divider orientation="vertical" className="picr-lightbox-divider" my={8} />
);

// Shared button for every piece of lightbox chrome, so the rails, the toolbar
// and the plugin buttons all read as one set.
//
// YARL renders its plugin buttons with its own IconButton, but each plugin
// exposes a `render.button*` slot that lets us substitute this instead — that is
// supported API, not a workaround. Every control in the lightbox now goes
// through here, so no YARL IconButton renders at all.
export const LightboxIconButton = ({
  icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: ReactNode;
  /** Used for both the tooltip and the accessible name. */
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  /**
   * Toggle buttons (filmstrip, fullscreen) that are currently on. Gives the
   * button a filled background *and* aria-pressed, so the state is visible
   * rather than implied by swapping the icon for its opposite action.
   */
  active?: boolean;
}) => (
  <Tooltip label={label} openDelay={400} withArrow>
    <ActionIcon
      className="picr-lightbox-button"
      variant={active ? 'light' : 'subtle'}
      size="md"
      radius="md"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </ActionIcon>
  </Tooltip>
);
