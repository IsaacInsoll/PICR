import { Card, Text } from '@mantine/core';

export const StatCard = ({
  value,
  label,
}: {
  value: string;
  label: string;
}) => {
  return (
    <Card style={{ flexGrow: 1 }}>
      <Text fz="lg" fw={500}>
        {value}
      </Text>
      <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
        {label}
      </Text>
    </Card>
  );
};
