import { Control, Controller } from 'react-hook-form';
import { TextInput, TextInputProps } from 'react-native';

// TextInput wrapped in a React Hook Form Controller
export const CTextInput = ({
  control,
  name,
  ...props
}: {
  control: Control<FormData, any, FormData>;
  name: string;
} & TextInputProps) => {
  return (
    <Controller
      control={control}
      // rules={{
      //   required: true,
      // }}
      render={({ field: { name, value, ref, onChange, onBlur, disabled } }) => (
        <TextInput
          onBlur={onBlur}
          onChangeText={onChange}
          value={value}
          name={name}
          ref={ref}
          disabled={disabled}
          {...props}
        />
      )}
      name={name}
    />
  );
};
