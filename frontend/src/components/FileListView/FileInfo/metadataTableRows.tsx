import { Badge, Code, Group, Rating, Table, Text } from '@mantine/core';
import { metadataIcons } from '../metadataIcons';
import type { PicrFile } from '@shared/types/picr';
import type { MetadataPresentationResult } from '@shared/fileMetadata';
import { metadataForPresentation } from '@shared/fileMetadata';
import { toReadableFraction } from 'readable-fractions';
import { useLanguage } from '../../../i18n/useLanguage';

// get all keys, remove nulls, add/merge others as expected
export const MetadataTableRows = (file: PicrFile) => {
  const { formattingLocale } = useLanguage();
  const list = metadataForPresentation(file, formattingLocale);
  if (!list.length) return null;

  return (
    <>
      {list.map((res) => {
        const { key, subLabel, description, icon } = res;
        const label = formatValue(res);
        const iconKey = (icon ?? key) as keyof typeof metadataIcons;
        return (
          <Table.Tr key={key}>
            <Table.Td>{metadataIcons[iconKey] ?? null}</Table.Td>
            <Table.Td>
              <Text c="dimmed" style={{ fontSize: 11 }}>
                {description}
              </Text>
            </Table.Td>
            <Table.Td>
              {!subLabel ? (
                label
              ) : (
                <Group gap={1}>
                  <Badge>{label}</Badge>
                  <Code
                    style={{ opacity: 0.2, fontSize: 9, letterSpacing: -0.5 }}
                  >
                    {subLabel}
                  </Code>
                </Group>
              )}
            </Table.Td>
          </Table.Tr>
        );
      })}
    </>
  );
};

const formatValue = (res: MetadataPresentationResult) => {
  if (res.key === 'AspectRatio' && typeof res.data === 'number') {
    const { denominator, numerator } = toReadableFraction(res.data);
    return (
      <>
        <sup>{numerator}</sup>/<sub>{denominator}</sub>
      </>
    );
  }

  if (res.key === 'OriginalRating') {
    const rating = Number(res.label);
    return <Rating value={Number.isFinite(rating) ? rating : 0} readOnly />;
  }

  return res.label;
};
