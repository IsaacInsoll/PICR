import { Branding, PrimaryColor, ThemeMode } from '../../../../graphql-types';
import {
  ActionIcon,
  Box,
  Button,
  Code,
  Group,
  InputDescription,
  InputLabel,
  Stack,
  useMantineTheme,
} from '@mantine/core';
import {
  MdBrightnessAuto,
  MdOutlineDarkMode,
  MdOutlineLightMode,
} from 'react-icons/md';
import { TbCheck } from 'react-icons/tb';

export const BrandingForm = ({
  branding,
  onChange,
}: {
  branding: Branding;
  onChange: (branding: Branding) => void;
}) => {
  return (
    <Stack gap="lg">
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
  [ThemeMode.Auto]: { icon: <MdBrightnessAuto /> },
  [ThemeMode.Light]: { icon: <MdOutlineLightMode /> },
  [ThemeMode.Dark]: { icon: <MdOutlineDarkMode /> },
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
              {c == color ? <TbCheck /> : null}
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
