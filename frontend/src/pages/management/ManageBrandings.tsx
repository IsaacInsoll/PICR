import { Alert, Box, Button } from '@mantine/core';
import { useQuery } from 'urql';
import { useState } from 'react';
import QueryFeedback from '../../components/QueryFeedback';
import { PicrDataGrid } from '../../components/PicrDataGrid';
import { viewBrandingsQuery } from '../../urql/queries/viewBrandingsQuery';
import { BrandingIcon } from '../../PicrIcons';
import { brandingColumns } from './brandingColumns';
import { useSetAtom } from 'jotai/index';
import { themeModeAtom } from '../../atoms/themeModeAtom';

export const ManageBrandings = () => {
  const [result, reQuery] = useQuery({ query: viewBrandingsQuery });
  const [brandingId, setBrandingId] = useState<string | null>(null);
  const setThemeMode = useSetAtom(themeModeAtom);

  return (
    <>
      <QueryFeedback result={result} reQuery={reQuery} />
      {/*{brandingId !== null ? (*/}
      {/*  <Suspense fallback={<ModalLoadingIndicator />}>*/}
      {/*    <ManageUser*/}
      {/*      onClose={() => {*/}
      {/*        setBrandingId(null);*/}
      {/*      }}*/}
      {/*      id={brandingId}*/}
      {/*    />*/}
      {/*  </Suspense>*/}
      {/*) : null}*/}
      <Alert variant="outline" m="sm" p="xs" ta="center">
        Mouseover a branding to preview it
      </Alert>
      {result.data?.brandings ? (
        <PicrDataGrid
          columns={brandingColumns}
          data={result.data?.brandings}
          onClick={(row) => setBrandingId(row.id)}
          onMouseover={(row) => setThemeMode(row)}
        />
      ) : undefined}
      <Box pt="md">
        <Button
          onClick={() => setBrandingId('')}
          leftSection={<BrandingIcon />}
        >
          Add Branding
        </Button>
      </Box>
    </>
  );
};
