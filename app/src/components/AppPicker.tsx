import SegmentedControl from 'react-native-segmented-control-2';
// It took everything I have to not name this PicrPicker 🤣

// This control doesn't currently support deselection. Perhaps contribute this back to them?
// https://github.com/WrathChaos/react-native-segmented-control-2/issues/12
export const AppPicker = ({
  options,
  value,
  onChange,
}: {
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}) => {
  const selectedIndex = value ? options.indexOf(value) : -1;
  console.log(value, options, selectedIndex);
  return (
    <SegmentedControl
      // style={{ backgroundColor: '#f00', width: '100%', height: 32 }}
      tabs={options}
      value={selectedIndex}
      onChange={(i) => {
        console.log('clicked', i);
        if (onChange) {
          return i != selectedIndex ? onChange(options[i]) : onChange(-1);
        }
      }}
    />
  );
};
