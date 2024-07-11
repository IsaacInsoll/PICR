import { atomWithStorage } from 'jotai/utils';
import { useAtom, useAtomValue } from 'jotai';
import { ActionIcon } from '@mantine/core';
import { TbLayoutGrid, TbList, TbPhoto } from 'react-icons/tb';

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
  return (
    <ActionIcon.Group>
      {viewOptions.map(({ name, icon, label }) => (
        <ActionIcon
          title={label + ' View'}
          variant={name === view && !managing ? 'filled' : 'default'}
          onClick={() => {
            if (managing && toggleManaging) {
              toggleManaging();
            }
            setView(name);
          }}
          key={name}
        >
          {icon}
        </ActionIcon>
      ))}
    </ActionIcon.Group>
  );
};

const viewOptions: { name: SelectedView; icon: JSX.Element; label: string }[] =
  [
    { name: 'list', icon: <TbList />, label: 'List' },
    { name: 'gallery', icon: <TbLayoutGrid />, label: 'Gallery' },
    { name: 'slideshow', icon: <TbPhoto />, label: 'Slideshow' },
  ] as const;

export const useSelectedView = () => {
  return useAtomValue(selectedViewAtom);
};
