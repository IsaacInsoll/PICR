import { Badge, Code, Group, Rating, Table, Text } from '@mantine/core';
import { metadataIcons } from '../metadataIcons';
import { PicrFile } from '../../../../types';
import {
  metadataForPresentation,
  MetadataPresentationResult,
} from '@shared/fileMetadata';
import { toReadableFraction } from 'readable-fractions';

// get all keys, remove nulls, add/merge others as expected
export const MetadataTableRows = (file: PicrFile) => {
  const list = metadataForPresentation(file);
  if (!list.length) return null;

  return (
    <>
      {list.map((res) => {
        const { subLabel, description, icon } = res;
        const label = formatValue(res);
        const iconKey = (icon ?? description) as keyof typeof metadataIcons;
        return (
          <Table.Tr key={description}>
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
  if (res.description == 'Aspect Ratio' && typeof res.data === 'number') {
    const { denominator, numerator } = toReadableFraction(res.data);
    return (
      <>
        <sup>{numerator}</sup>/<sub>{denominator}</sub>
      </>
    );
  }

  if (res.description == 'Original Rating') {
    const rating = Number(res.label);
    return <Rating value={Number.isFinite(rating) ? rating : 0} readOnly />;
  }

  if (res.description == 'Framerate')
    return res.label ? (
      <>
        {res.label}
        <sub>/s</sub>
      </>
    ) : null;

  return res.label;
};
