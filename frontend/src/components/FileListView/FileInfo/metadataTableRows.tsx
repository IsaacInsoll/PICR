import { Badge, Code, Group, Rating, Table, Text } from '@mantine/core';
import { metadataIcons } from '../metadataIcons';
import { MinimalFile } from '../../../../types';
import {
  metadataForPresentation,
  MetadataPresentationResult,
} from '@shared/fileMetadata';
import { toReadableFraction } from 'readable-fractions';

// get all keys, remove nulls, add/merge others as expected
export const MetadataTableRows = (file: MinimalFile) => {
  const list = metadataForPresentation(file);
  if (!list) return null;

  return (
    <>
      {list.map((res) => {
        const { subLabel, description, icon } = res;
        const label = formatValue(res);
        return (
          <Table.Tr key={description}>
            <Table.Td>
              {icon ? metadataIcons[icon] : metadataIcons[description]}
            </Table.Td>
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
  if (res.description == 'Aspect Ratio') {
    const { denominator, numerator } = toReadableFraction(res.data);
    return (
      <>
        <sup>{numerator}</sup>/<sub>{denominator}</sub>
      </>
    );
  }

  if (res.description == 'Original Rating') {
    return <Rating value={res.label} readOnly />;
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
