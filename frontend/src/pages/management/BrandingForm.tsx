import { Branding, PrimaryColor, ThemeMode } from '../../../../graphql-types';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Code,
  Group,
  InputDescription,
  InputLabel,
  Select,
  Stack,
  useMantineTheme,
} from '@mantine/core';
import {
  BrightnessAutoIcon,
  CheckIcon,
  DarkModeOutlineIcon,
  LightModeOutlineIcon,
} from '../../PicrIcons';
import {
  fontRegistry,
  type FontDefinition,
  type FontKey,
} from '@shared/branding/fontRegistry';
import { fontFamilies } from '../../fonts.generated';

export const BrandingForm = ({
  branding,
  onChange,
}: {
  branding: Branding;
  onChange: (branding: Branding) => void;
}) => {
  return (
    <Stack gap="lg">
      <HeadingFontSelector
        value={branding.headingFontKey ?? 'default'}
        onChange={(headingFontKey) => onChange({ ...branding, headingFontKey })}
      />
      <ModeSelector
        value={branding.mode}
        onChange={(mode) => onChange({ ...branding, mode })}
      />
      <ColorSelector
        color={branding.primaryColor}
        onChange={(primaryColor) => onChange({ ...branding, primaryColor })}
      />
    </Stack>
  );
};

const categoryLabels: Record<string, string> = {
  sans: 'Sans Serif',
  serif: 'Serif',
  display: 'Display',
  script: 'Script',
  mono: 'Mono',
  accessibility: 'Accessibility',
};

const HeadingFontSelector = ({
  value,
  onChange,
}: {
  value: FontKey;
  onChange: (value: FontKey) => void;
}) => {
  const grouped = Object.entries(
    fontRegistry.reduce<Record<string, FontDefinition[]>>((acc, font) => {
      const group = categoryLabels[font.category] ?? font.category;
      if (!acc[group]) acc[group] = [];
      acc[group].push(font);
      return acc;
    }, {}),
  ).map(([group, items]) => ({
    group,
    items: items.map((font) => ({
      value: font.key,
      label: font.label,
      description: `${font.description}${
        font.headingOnly ? ' (Heading only)' : ''
      }`,
      suitableFor: font.suitableFor,
    })),
  }));

  return (
    <Box>
      <InputLabel>Heading font</InputLabel>
      <InputDescription>
        Applies to titles and section headers only
      </InputDescription>
      <Select
        data={grouped}
        value={value}
        searchable
        clearable={false}
        styles={{
          input: {
            fontFamily:
              fontFamilies[value as keyof typeof fontFamilies] ??
              fontFamilies.default,
          },
        }}
        onChange={(next) => {
          if (next != null) onChange(next as FontKey);
        }}
        renderOption={({ option }) => (
          <Stack
            gap="xs"
            pb="sm"
            wrap="nowrap"
            style={{
              fontFamily:
                fontFamilies[option.value as keyof typeof fontFamilies] ??
                fontFamilies.default,
            }}
          >
            <div>{option.label}</div>
            {option.description ? (
              <InputDescription>{option.description}</InputDescription>
            ) : null}
            {option.suitableFor?.length ? (
              <InputDescription>
                <Group gap={4} wrap="wrap">
                  {option.suitableFor.map((tag) => (
                    <Badge key={tag} size="xs" variant="light" color="gray">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              </InputDescription>
            ) : null}
          </Stack>
        )}
      />
    </Box>
  );
};

const ModeSelector = ({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (value: ThemeMode) => void;
}) => {
  return (
    <Box>
      <InputLabel>Theme</InputLabel>
      <InputDescription pb="xs">
        <Code>auto</Code> means <em>'match what the users device is set to'</em>
      </InputDescription>
      <Button.Group>
        {options.map((opt) => {
          const isSelected = opt === value;
          const { icon } = themeModeStyle[opt];
          return (
            <Button
              leftSection={icon}
              title={opt}
              variant={isSelected ? 'filled' : 'default'}
              onClick={() => onChange(opt)}
              key={opt}
              size="xs"
            >
              {opt}
            </Button>
          );
        })}
      </Button.Group>
    </Box>
  );
};

const options: ThemeMode[] = [ThemeMode.Auto, ThemeMode.Light, ThemeMode.Dark];

const themeModeStyle = {
  [ThemeMode.Auto]: { icon: <BrightnessAutoIcon /> },
  [ThemeMode.Light]: { icon: <LightModeOutlineIcon /> },
  [ThemeMode.Dark]: { icon: <DarkModeOutlineIcon /> },
};

const ColorSelector = ({
  color,
  onChange,
}: {
  color: PrimaryColor;
  onChange: (color: PrimaryColor) => void;
}) => {
  const options = Object.values(PrimaryColor);
  const theme = useMantineTheme();

  return (
    <>
      <Box>
        <InputLabel>Color</InputLabel>
        <InputDescription>
          <Code c={color}>{color}</Code>
        </InputDescription>
      </Box>
      <Group gap="xs">
        {options.map((c) => {
          return (
            <ActionIcon
              size="xs"
              color={c}
              variant="filled"
              key={c}
              onClick={() => onChange(c)}
            >
              {c == color ? <CheckIcon /> : null}
            </ActionIcon>
          );
        })}
      </Group>
      <Group gap={0}>
        {Array.from({ length: 10 }, (x, i) => {
          // console.log(theme.colors[color]);
          return (
            <Box
              key={i}
              style={{
                backgroundColor: theme.colors[color][i],
                flexGrow: 1,
                height: 2,
              }}
            ></Box>
          );
        })}
      </Group>
    </>
  );
};
