import { Badge, Code, Group, Rating, Table, Text } from '@mantine/core';
import { metadataDescription, metadataIcons } from '../metadataIcons';
import { formatMetadataValue } from '../../../metadata/formatMetadataValue';
import { AnyMetadataKey } from '../Filtering/MetadataBox';
import { MinimalFile } from '../../../../types';
import { prettyAspectRatio } from '../../../metadata/prettyAspectRatio';

// get all keys, remove nulls, add/merge others as expected
export const MetadataTableRows = (file: MinimalFile) => {
  const metadata = file.metadata;
  if (!metadata) return null;

  const keys: AnyMetadataKey[] = Object.keys(metadata).filter(
    (x) => !!metadata[x],
  );

  const list = keys.map((k) => ({
    icon: metadataIcons[k],
    description: metadataDescription[k] ?? k,
    label: formatMetadataValue(k, file.metadata[k]).label,
  }));

  const remove: AnyMetadataKey[] = [];

  if (metadata.VideoCodec && metadata.VideoCodecDescription) {
    remove.push('VideoCodec', 'VideoCodecDescription');
    list.push({
      description: 'Video',
      label: (
        <Group gap={1}>
          <Badge>{metadata.VideoCodec}</Badge>
          <Code style={{ opacity: 0.2, fontSize: 9, letterSpacing: -0.5 }}>
            {metadata.VideoCodecDescription}
          </Code>
        </Group>
      ),
    });
  }
  if (metadata.AudioCodec && metadata.AudioCodecDescription) {
    remove.push('AudioCodec', 'AudioCodecDescription');
    list.push({
      description: 'Audio',
      label: (
        <Group gap={1}>
          <Badge>{metadata.AudioCodec}</Badge>
          <Code style={{ opacity: 0.2, fontSize: 9, letterSpacing: -0.5 }}>
            {metadata.AudioCodecDescription}
          </Code>
        </Group>
      ),
    });
  }

  if (file.imageRatio) {
    list.push({
      icon: metadataIcons.AspectRatio,
      description: 'Aspect Ratio',
      label: prettyAspectRatio(file),
    });
  }

  if (metadata.Width && metadata.Height) {
    remove.push('Width', 'Height');
    list.push({
      icon: metadataIcons.AspectRatio,
      description: 'Dimensions',
      label: (
        <>
          {metadata.Width + ' x ' + metadata.Height}
          <sub> px</sub>
        </>
      ),
    });
  }

  if (metadata.Rating) {
    remove.push('Rating');
    list.push({
      icon: metadataIcons.Rating,
      description: 'Original Rating',
      label: <Rating value={metadata.Rating} readOnly />,
    });
  }

  console.log(list.map((x) => x.description));
  console.log(remove);
  const filtered = list.filter(
    ({ description }) => !remove.includes(description),
  );

  return (
    <>
      {filtered.map(({ icon, description, label }) => (
        <Table.Tr key={description}>
          <Table.Td>{icon ?? metadataIcons[description]}</Table.Td>
          <Table.Td>
            <Text c="dimmed" style={{ fontSize: 11 }}>
              {description}
            </Text>
          </Table.Td>
          <Table.Td>{label}</Table.Td>
        </Table.Tr>
      ))}
    </>
  );
};
