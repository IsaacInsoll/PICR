import { Box, FormField, Heading, TextInput } from 'grommet';

export const LoginForm = () => {
  return (
    <Box align="center">
      <Box width="medium" margin="large">
        <Heading>grommet + formik</Heading>
        <FormField label="Name">
          <TextInput
            name="name"
            // value={values.name || ''}
            // onChange={handleChange}
          />
        </FormField>
        <FormField label="Email">
          <TextInput
            name="email"
            // value={values.email || ''}
            // onChange={handleChange}
          />
        </FormField>
      </Box>
    </Box>
  );
};
