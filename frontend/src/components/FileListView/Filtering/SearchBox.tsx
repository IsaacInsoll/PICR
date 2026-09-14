import type { GalleryFilterCriteria } from '@shared/files/mediaCriteria';
import { TextInput } from '@mantine/core';
import { SearchIcon } from '../../../PicrIcons';
import { useTranslation } from 'react-i18next';

export const SearchBox = ({
  filters,
  onChange,
}: {
  filters: GalleryFilterCriteria;
  onChange: (filters: GalleryFilterCriteria) => void;
}) => {
  const { t } = useTranslation('gallery');
  return (
    <TextInput
      leftSection={<SearchIcon />}
      placeholder={t('filter.search')}
      value={filters.searchText}
      onChange={(event) =>
        onChange({ ...filters, searchText: event.target.value })
      }
    />
  );
};
