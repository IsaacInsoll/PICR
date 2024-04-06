import { Box, Layer, Spinner } from 'grommet';

export const ModalLoadingIndicator = () => {
  return (
    <Layer>
      <Box
        align="center"
        justify="center"
        gap="small"
        direction="row"
        alignSelf="center"
        pad="large"
      >
        <Spinner />
      </Box>
    </Layer>
  );
};
