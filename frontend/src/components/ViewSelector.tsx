import { Box, Button, Page, PageContent } from 'grommet';
import { Gallery as GalleryIcon, List as ListIcon } from 'grommet-icons';
import { AppsRounded } from 'grommet-icons/icons';
import { atomWithStorage } from 'jotai/utils';
import { useAtom, useAtomValue } from 'jotai';

export type SelectedView = 'list' | 'gallery' | 'slideshow';

const selectedViewAtom = atomWithStorage<SelectedView>(
  'SelectedView',
  'gallery',
);

export const ViewSelector = () => {
  const [view, setView] = useAtom(selectedViewAtom);
  return (
    <Page>
      <PageContent>
        <Box direction="row">
          {viewOptions.map(({ name, icon, label }) => (
            <Button
              icon={icon}
              // label={label}
              {...{ primary: name === view }}
              onClick={() => setView(name)}
            />
          ))}
        </Box>
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
