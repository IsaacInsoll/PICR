import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { TextInputProps } from 'react-native';
import { TextInput } from 'react-native';

// TextInput wrapped in a React Hook Form Controller
export const CTextInput = <TFieldValues extends FieldValues>({
  control,
  name,
  ...props
}: {
  control: Control<TFieldValues, unknown, TFieldValues>;
  name: Path<TFieldValues>;
} & TextInputProps) => {
  return (
    <Controller
      control={control}
      // rules={{
      //   required: true,
      // }}
      render={({ field: { value, ref, onChange, onBlur, disabled } }) => (
        <TextInput
          onBlur={onBlur}
          onChangeText={(text) => onChange(text)}
          value={typeof value === 'string' ? value : ''}
          ref={ref}
          editable={!disabled}
          {...props}
        />
      )}
      name={name}
    />
  );
};
