import {
  alpha,
  Box,
  Code,
  Group,
  Tooltip,
  useComputedColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { UAParser } from 'ua-parser-js';
import type { IconType } from 'react-icons';
import {
  TbBrowser,
  TbDeviceDesktop,
  TbDeviceMobile,
  TbDeviceTablet,
} from 'react-icons/tb';
import {
  SiAndroid,
  SiApple,
  SiBrave,
  SiFirefoxbrowser,
  SiGooglechrome,
  SiLinux,
  SiOpera,
  SiSafari,
} from 'react-icons/si';
import { FaEdge, FaWindows } from 'react-icons/fa6';

interface AccessLogClientMetaProps {
  ipAddress?: string | null;
  userAgent?: string | null;
  showIpAddress?: boolean;
  wrap?: 'wrap' | 'nowrap';
}

interface BadgeIconMatch {
  icon: IconType;
  label: string;
  color: {
    light: string;
    dark: string;
  };
}

export const AccessLogClientMeta = ({
  ipAddress,
  userAgent,
  showIpAddress = true,
  wrap = 'wrap',
}: AccessLogClientMetaProps) => {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });
  const isDark = colorScheme === 'dark';
  const parsed = userAgent ? UAParser(userAgent) : null;
  const browserName = parsed?.browser.name?.trim();
  const osName = parsed?.os.name?.trim();
  const deviceType = parsed?.device.type?.trim();
  const deviceLabel = parsed?.device.model ?? parsed?.device.type;
  const browserIcon = browserName ? findBrowserIcon(browserName) : null;
  const osIcon = osName ? findOsIcon(osName) : null;

  return (
    <Group wrap={wrap} justify="space-between">
      {showIpAddress && ipAddress ? (
        <Code style={{ fontSize: '11px' }}>{ipAddress}</Code>
      ) : null}
      <Group gap="xs">
        {browserName ? (
          <MetaIcon
            icon={browserIcon?.icon ?? TbBrowser}
            tooltip={browserName}
            label={browserIcon?.label}
            color={
              browserIcon
                ? resolveBrandColor(browserIcon.color, isDark)
                : theme.colors.gray[isDark ? 4 : 6]
            }
          />
        ) : null}
        {osName ? (
          <MetaIcon
            icon={osIcon?.icon ?? TbDeviceDesktop}
            tooltip={osName}
            label={osIcon?.label}
            color={
              osIcon
                ? resolveBrandColor(osIcon.color, isDark)
                : theme.colors.gray[isDark ? 4 : 6]
            }
          />
        ) : null}
        {deviceLabel ? (
          <MetaIcon
            icon={getDeviceIcon(deviceType)}
            tooltip={
              deviceType && deviceType !== deviceLabel
                ? `${deviceLabel} (${deviceType})`
                : deviceLabel
            }
            label={deviceType ?? deviceLabel}
            color={getDeviceColor(deviceType, isDark)}
          />
        ) : null}
      </Group>
    </Group>
  );
};

const MetaIcon = ({
  icon: Icon,
  tooltip,
  label,
  color,
}: {
  icon: IconType;
  tooltip: string;
  label?: string;
  color: string;
}) => {
  const icon = (
    <Box
      component="span"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
      }}
      aria-label={label ?? tooltip}
      title={tooltip}
    >
      <Icon size={14} />
    </Box>
  );

  return <Tooltip label={tooltip}>{icon}</Tooltip>;
};

const getDeviceIcon = (deviceType?: string): IconType => {
  const normalized = deviceType?.toLowerCase();
  if (normalized === 'mobile') return TbDeviceMobile;
  if (normalized === 'tablet') return TbDeviceTablet;
  return TbDeviceDesktop;
};

const findBrowserIcon = (browserName: string): BadgeIconMatch | null => {
  const normalized = browserName.toLowerCase();
  return findIcon(normalized, browserIconPresets);
};

const findOsIcon = (osName: string): BadgeIconMatch | null => {
  const normalized = osName.toLowerCase();
  return findIcon(normalized, osIconPresets);
};

const resolveBrandColor = (
  brandColor: { light: string; dark: string },
  isDark: boolean,
): string => {
  const base = isDark ? brandColor.dark : brandColor.light;
  return alpha(base, isDark ? 0.8 : 0.78);
};

interface IconPreset extends BadgeIconMatch {
  match: string;
}

const browserIconPresets: IconPreset[] = [
  {
    match: 'chrome',
    icon: SiGooglechrome,
    label: 'Chrome',
    color: { light: '#2f8f46', dark: '#8ad89c' },
  },
  {
    match: 'chromium',
    icon: SiGooglechrome,
    label: 'Chrome',
    color: { light: '#2f8f46', dark: '#8ad89c' },
  },
  {
    match: 'safari',
    icon: SiSafari,
    label: 'Safari',
    color: { light: '#0f86cc', dark: '#63c3ff' },
  },
  {
    match: 'firefox',
    icon: SiFirefoxbrowser,
    label: 'Firefox',
    color: { light: '#cc5a00', dark: '#ffab66' },
  },
  {
    match: 'edge',
    icon: FaEdge,
    label: 'Edge',
    color: { light: '#0b8f88', dark: '#6ad6cf' },
  },
  {
    match: 'opera',
    icon: SiOpera,
    label: 'Opera',
    color: { light: '#b42318', dark: '#ff8f88' },
  },
  {
    match: 'brave',
    icon: SiBrave,
    label: 'Brave',
    color: { light: '#c2410c', dark: '#ffb089' },
  },
];

const osIconPresets: IconPreset[] = [
  {
    match: 'ios',
    icon: SiApple,
    label: 'Apple',
    color: { light: '#525866', dark: '#d1d5db' },
  },
  {
    match: 'mac',
    icon: SiApple,
    label: 'Apple',
    color: { light: '#525866', dark: '#d1d5db' },
  },
  {
    match: 'windows',
    icon: FaWindows,
    label: 'Windows',
    color: { light: '#0f6cbd', dark: '#8ec8ff' },
  },
  {
    match: 'android',
    icon: SiAndroid,
    label: 'Android',
    color: { light: '#4f8a10', dark: '#a4d46f' },
  },
  {
    match: 'linux',
    icon: SiLinux,
    label: 'Linux',
    color: { light: '#7c5e10', dark: '#e0c27a' },
  },
  {
    match: 'ubuntu',
    icon: SiLinux,
    label: 'Linux',
    color: { light: '#7c5e10', dark: '#e0c27a' },
  },
];

const findIcon = (
  value: string,
  presets: IconPreset[],
): BadgeIconMatch | null =>
  presets.find((preset) => value.includes(preset.match)) ?? null;

const getDeviceColor = (
  deviceType: string | undefined,
  isDark: boolean,
): string => {
  const normalized = deviceType?.toLowerCase();
  if (normalized === 'mobile') {
    return resolveBrandColor({ light: '#7c3aed', dark: '#b79cff' }, isDark);
  }
  if (normalized === 'tablet') {
    return resolveBrandColor({ light: '#0f766e', dark: '#73d4cc' }, isDark);
  }
  return resolveBrandColor({ light: '#6b7280', dark: '#c3cad6' }, isDark);
};
