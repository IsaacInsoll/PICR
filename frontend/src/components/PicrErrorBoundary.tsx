import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Alert, Box, Button, Code, Stack, Text } from '@mantine/core';
import { BiSolidError } from 'react-icons/bi';
import { useState } from 'react';

export const PicrErrorBoundary = ({ children }: { children: ReactNode }) => {
  return (
    <ErrorBoundary fallbackRender={fallbackRender}>{children}</ErrorBoundary>
  );
};

function fallbackRender({ error }: FallbackProps) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.
  return (
    <Alert
      variant="light"
      color="red"
      title="Something went wrong"
      icon={<BiSolidError />}
    >
      <Stack gap="sm">
        <Box>
          <Code color="red.9" c="white" style={{ fontSize: 14 }}>
            {prettyMessage(error.message)}
          </Code>
        </Box>

        <Code block color="transparent" c="red" style={{ fontSize: 9 }}>
          {error.stack}
        </Code>
      </Stack>
    </Alert>
  );
}

const prettyMessage = (errorMessage: string) => {
  if (errorMessage == 'r.definitions is not iterable')
    return 'GraphQL Query Error. Try a build';
  return errorMessage;
};
