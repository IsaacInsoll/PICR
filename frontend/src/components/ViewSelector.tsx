import { Box, Button, Page, PageContent, Toolbar } from 'grommet';
import {
  AppsRounded,
  Filter,
  Gallery as GalleryIcon,
  List as ListIcon,
} from 'grommet-icons';
import { atomWithStorage } from 'jotai/utils';
import { useAtom, useAtomValue } from 'jotai';
import { filterAtom } from '../atoms/filterAtom';

export type SelectedView = 'list' | 'gallery' | 'slideshow';

const selectedViewAtom = atomWithStorage<SelectedView>(
  'SelectedView',
  'gallery',
);

export const ViewSelector = () => {
  const [view, setView] = useAtom(selectedViewAtom);
  const [filtering, setFiltering] = useAtom(filterAtom);
  return (
    <Page>
      <PageContent>
        <Toolbar direction="row" margin={{ bottom: 'small' }}>
          {viewOptions.map(({ name, icon, label }) => (
            <Button
              icon={icon}
              // label={label}
              {...{ primary: name === view }}
              onClick={() => setView(name)}
            />
          ))}
          <Box flex />
          <Button
            icon={<Filter />}
            primary={filtering}
            onClick={() => setFiltering((f) => !f)}
          />
        </Toolbar>
      </PageContent>
    </Page>
  );
};

const viewOptions: { name: SelectedView; icon: JSX.Element; label: string }[] =
  [
    { name: 'list', icon: <ListIcon />, label: 'List' },
    { name: 'gallery', icon: <AppsRounded />, label: 'Gallery' },
    { name: 'slideshow', icon: <GalleryIcon />, label: 'Slideshow' },
  ] as const;

export const useSelectedView = () => {
  return useAtomValue(selectedViewAtom);
};
