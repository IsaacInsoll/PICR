import { Container } from '@mantine/core';
import { ReactNode } from 'react';

export const Page = ({ children }: { children: ReactNode }) => {
  return <Container>{children}</Container>;
};
