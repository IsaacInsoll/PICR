import { useAtom } from 'jotai';
import type { FilterOptionsInterface } from '@shared/filterAtom';
import { filterOptions } from '@shared/filterAtom';
import { TextInput } from '@mantine/core';
import { SearchIcon } from '../../../PicrIcons';
import { useTranslation } from 'react-i18next';

export const SearchBox = () => {
  const { t } = useTranslation('gallery');
  const [options, setOptions] = useAtom(filterOptions);
  return (
    <TextInput
      leftSection={<SearchIcon />}
      placeholder={t('filter.search')}
      value={options.searchText}
      onChange={(e) =>
        setOptions((o: FilterOptionsInterface) => ({
          ...o,
          searchText: e.target.value,
        }))
      }
    />
  );
};
