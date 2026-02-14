import { Box, Button, InputDescription, InputLabel } from '@mantine/core';
import { LinkMode } from '../../../graphql-types';
import { linkModeStyle } from './LinkModeStyle';

const options: Array<{
  value: LinkMode;
  label: string;
  description: string;
}> = [
  {
    value: LinkMode.FinalDelivery,
    label: 'Final delivery',
    description: 'Downloads allowed',
  },
  {
    value: LinkMode.ProofNoDownloads,
    label: 'Proofs only',
    description: 'No downloads',
  },
];

export const LinkModeSelector = ({
  value,
  onChange,
}: {
  value: LinkMode;
  onChange: (value: LinkMode) => void;
}) => {
  return (
    <Box>
      <InputLabel>Link Mode</InputLabel>

      <Button.Group pb="xs">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          const { icon } = linkModeStyle[opt.value];
          return (
            <Button
              leftSection={icon}
              title={opt.description}
              variant={isSelected ? 'filled' : 'default'}
              onClick={() => onChange(opt.value)}
              key={opt.value}
              size="xs"
            >
              {opt.label}
            </Button>
          );
        })}
      </Button.Group>
      <InputDescription pb="xs">{descriptions[value]}</InputDescription>
    </Box>
  );
};

const descriptions = {
  [LinkMode.FinalDelivery]:
    'Users can see and download individual images or download all images as ZIP',
  [LinkMode.ProofNoDownloads]: "Users can see images but can't download images",
} as const;
