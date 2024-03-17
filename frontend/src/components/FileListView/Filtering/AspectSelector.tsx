import { useAtom } from 'jotai/index';
import { AspectFilterOptions, filterOptions } from '../../../atoms/filterAtom';
import { Menu } from 'grommet';
import {
  MdOutlineCropFree,
  MdOutlineCropLandscape,
  MdOutlineCropPortrait,
  MdOutlineCropSquare,
} from 'react-icons/md';

export const AspectSelector = () => {
  const [options, setOptions] = useAtom(filterOptions);
  const onChange = (a: AspectFilterOptions) =>
    setOptions((o) => ({ ...o, ratio: a }));
  return (
    <Menu
      label={options.ratio}
      icon={aspectRatioIcon[options.ratio]}
      items={[
        {
          label: 'Any Ratio',
          icon: <MdOutlineCropFree />,
          onClick: () => onChange('Any Ratio'),
        },
        {
          label: 'Landscape',
          icon: <MdOutlineCropLandscape />,
          onClick: () => onChange('Landscape'),
        },
        {
          label: 'Square',
          icon: <MdOutlineCropSquare />,
          onClick: () => onChange('Square'),
        },
        {
          label: 'Portrait',
          icon: <MdOutlineCropPortrait />,
          onClick: () => onChange('Portrait'),
        },
      ]}
    />
  );
};
const aspectRatioIcon = {
  'Any Ratio': <MdOutlineCropFree />,
  Square: <MdOutlineCropSquare />,
  Landscape: <MdOutlineCropLandscape />,
  Portrait: <MdOutlineCropPortrait />,
} as const;
