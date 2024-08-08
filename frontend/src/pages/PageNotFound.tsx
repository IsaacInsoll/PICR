import { Center, MantineStyleProp, Stack, Text, Title } from '@mantine/core';

export const PageNotFound = () => {
  const center: MantineStyleProp = { textAlign: 'center' };
  return (
    <Center style={{ height: '100vh' }}>
      <Stack gap={8}>
        <Title style={center}>Error</Title>
        <Text style={center} size="xl">
          We couldn't find what you are looking for
        </Text>
        <Text style={center} size="md" fs="italic">
          Contact the person who gave you the link
        </Text>
      </Stack>
    </Center>
  );
};