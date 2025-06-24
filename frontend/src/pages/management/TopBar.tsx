import { Group, Title } from '@mantine/core';
import { PicrLogo } from '../LoginForm';
import { PicrTitle } from '../../components/PicrTitle';

export const TopBar = ({ title }: { title: string }) => {
  return (
    <Group pt="lg" pb="sm">
      <PicrLogo style={{ height: 32, width: 32 }} />
      <Title>{title}</Title>
      <PicrTitle title={title} />
    </Group>
  );
};
