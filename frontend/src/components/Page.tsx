import type { ContainerProps } from '@mantine/core';
import { Container } from '@mantine/core';
import type { ReactNode } from 'react';

export const Page = ({
  children,
  ...props
}: {
  children: ReactNode;
  props?: ContainerProps;
}) => {
  return (
    <Container size="xl" {...props}>
      {children}
    </Container>
  );
};
