import { Box, Button, InputDescription, InputLabel } from '@mantine/core';
import { LinkMode } from '@shared/gql/graphql';
import { linkModeStyle } from './LinkModeStyle';
import { useTranslation } from 'react-i18next';

const options: Array<{
  value: LinkMode;
  labelKey: 'links.mode.finalDelivery' | 'links.mode.proofsOnly';
  shortDescriptionKey: 'links.mode.downloadsAllowed' | 'links.mode.noDownloads';
  descriptionKey:
    | 'links.mode.finalDeliveryDescription'
    | 'links.mode.proofsOnlyDescription';
}> = [
  {
    value: LinkMode.FinalDelivery,
    labelKey: 'links.mode.finalDelivery',
    shortDescriptionKey: 'links.mode.downloadsAllowed',
    descriptionKey: 'links.mode.finalDeliveryDescription',
  },
  {
    value: LinkMode.ProofNoDownloads,
    labelKey: 'links.mode.proofsOnly',
    shortDescriptionKey: 'links.mode.noDownloads',
    descriptionKey: 'links.mode.proofsOnlyDescription',
  },
];

export const LinkModeSelector = ({
  value,
  onChange,
}: {
  value: LinkMode;
  onChange: (value: LinkMode) => void;
}) => {
  const { t } = useTranslation('admin');
  const selectedOption = options.find((option) => option.value === value);
  return (
    <Box>
      <InputLabel>{t('links.mode.label')}</InputLabel>

      <Button.Group pb="xs">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          const { icon } = linkModeStyle[opt.value];
          return (
            <Button
              leftSection={icon}
              title={t(opt.shortDescriptionKey)}
              variant={isSelected ? 'filled' : 'default'}
              onClick={() => onChange(opt.value)}
              key={opt.value}
              size="xs"
            >
              {t(opt.labelKey)}
            </Button>
          );
        })}
      </Button.Group>
      <InputDescription pb="xs">
        {selectedOption ? t(selectedOption.descriptionKey) : null}
      </InputDescription>
    </Box>
  );
};
