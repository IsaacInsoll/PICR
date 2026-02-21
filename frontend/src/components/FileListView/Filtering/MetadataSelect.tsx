import { useAtom } from 'jotai';
import { FilterOptionsInterface, filterOptions } from '@shared/filterAtom';
import { formatMetadataValues } from '../../../metadata/formatMetadataValues';
import { MultiSelect } from '@mantine/core';
import { metadataIcons } from '../metadataIcons';

import { AnyMetadataKey } from '@shared/fileMetadata';

export const MetadataSelect = ({
  title,
  options,
}: {
  title: AnyMetadataKey;
  options: (string | number)[];
}) => {
  const [fo, setFo] = useAtom(filterOptions);
  const metadata = fo.metadata as Record<string, (string | number)[]>;
  const value = options.length === 1 ? options : (metadata[title] ?? []);
  const data = formatMetadataValues(title, options);

  const label = title === 'ExposureTime' ? 'Shutter Speed' : title;
  // <MultiSelect> only accepts string values so we need to do some conversion back-and-forth as some metadata is numeric such as aperture and shutter speed

  const solo = options.length <= 1;

  return (
    <MultiSelect
      clearable
      checkIconPosition="right"
      data={data}
      disabled={solo}
      description={
        solo ? 'Not available as all images are ' + options[0] : undefined
      }
      leftSection={metadataIcons[title as keyof typeof metadataIcons]}
      label={label}
      // placeholder={}
      value={value.map((v: string | number) => v.toString())}
      onChange={(strs) => {
        const newVals = data
          .filter((x) => strs.includes(x.value))
          .map((x) => x.raw);
        setFo((e: FilterOptionsInterface) => ({
          ...e,
          metadata: {
            ...e.metadata,
            [title]: newVals,
          },
        }));
      }}
    />
  );
};
