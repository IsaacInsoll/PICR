import {Container, ContainerProps} from '@mantine/core';
import { ReactNode } from 'react';

export const Page = ({ children,...props }: { children: ReactNode , props?: ContainerProps}) => {
  return <Container {...props}>{children}</Container>;
};
