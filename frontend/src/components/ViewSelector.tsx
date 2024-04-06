import { Box, Button } from 'grommet';
import {
  AppsRounded,
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

export const ViewSelector = ({
  managing,
  toggleManaging,
}: {
  managing?: boolean;
  toggleManaging: () => void;
}) => {
  const [view, setView] = useAtom(selectedViewAtom);
  const [filtering, setFiltering] = useAtom(filterAtom);
  return (
    <Box direction="row">
      {viewOptions.map(({ name, icon, label }) => (
        <Button
          icon={icon}
          // label={label}
          {...{ primary: name === view && !managing }}
          onClick={() => {
            if (managing && toggleManaging) {
              toggleManaging();
            }
            setView(name);
          }}
          key={name}
        />
      ))}
    </Box>
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
