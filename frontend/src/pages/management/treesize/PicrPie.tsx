import { PieSlice } from './useTreeSize';
import { Box } from '@mantine/core';
import { VictoryPie, VictoryTheme } from 'victory';

export const PicrPie = ({
  slices,
  setHover,
  setFolderId,
  hover,
}: {
  slices: PieSlice[];
  setHover: (id: string) => void;
  setFolderId: (id: string) => void;
  hover: string | null;
}) => {
  const highlightedSlice =
    hover && !slices.map(({ x }) => x).includes(hover) ? 'rest' : hover;
  return (
    <Box>
      <VictoryPie
        // width={bounds.width / 2}
        height={350}
        innerRadius={60}
        data={slices}
        theme={VictoryTheme.clean}
        // labelRadius={60}
        padAngle={3}
        animate={{ duration: 1000 }} //breaks when navigating to another folder,presumably because all IDs changed?
        radius={({ datum }) => (highlightedSlice == datum.x ? 120 : 110)}
        colorScale={slices.map(({ color }) => color)}
        events={[
          {
            target: 'data',
            eventHandlers: {
              onClick: (_, { datum }) => {
                if (!['rest', 'files'].includes(datum.x)) setFolderId(datum.x);
              },
              onMouseOver: (_, { datum }) => {
                setHover(datum.x);
              },
              onMouseOut: () => {
                setHover(null);
              },
            },
          },
        ]}
      />
    </Box>
  );
};
