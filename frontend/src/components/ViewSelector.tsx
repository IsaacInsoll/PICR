import { atomWithStorage } from 'jotai/utils';
import { useAtom, useAtomValue } from 'jotai';
import { ActionIcon } from '@mantine/core';
import { TbLayoutGrid, TbList, TbPhoto } from 'react-icons/tb';
import { actionIconSize } from '../theme';

export type SelectedView = 'list' | 'gallery' | 'slideshow';

export const selectedViewAtom = atomWithStorage<SelectedView>(
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

export const viewOptions: {
  name: SelectedView;
  icon: JSX.Element;
  label: string;
}[] = [
  { name: 'list', icon: <TbList size={actionIconSize} />, label: 'List' },
  {
    name: 'gallery',
    icon: <TbLayoutGrid size={actionIconSize} />,
    label: 'Gallery',
  },
  {
    name: 'slideshow',
    icon: <TbPhoto size={actionIconSize} />,
    label: 'Slideshow',
  },
] as const;

export const useSelectedView = () => {
  return useAtomValue(selectedViewAtom);
};
