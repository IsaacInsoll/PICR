import { Alert, Box, Button, Code, Text } from '@mantine/core';
import { useQuery } from 'urql';
import { Suspense, useState } from 'react';
import QueryFeedback from '../../components/QueryFeedback';
import { PicrDataGrid } from '../../components/PicrDataGrid';
import { viewBrandingsQuery } from '../../urql/queries/viewBrandingsQuery';
import { BrandingIcon } from '../../PicrIcons';
import { brandingColumns } from './brandingColumns';
import { useSetAtom } from 'jotai/index';
import { defaultBranding, themeModeAtom } from '../../atoms/themeModeAtom';
import { Branding } from '../../../../graphql-types';
import { BrandingModal } from './BrandingModal';
import { ModalLoadingIndicator } from '../../components/ModalLoadingIndicator';

export const ManageBrandings = () => {
  const [result, reQuery] = useQuery({ query: viewBrandingsQuery });
  const [branding, setBranding] = useState<Branding | null>(null);
  const setThemeMode = useSetAtom(themeModeAtom);

  const mouseover = false;

  return (
    <>
      <QueryFeedback result={result} reQuery={reQuery} />
      {branding != null ? (
        <Suspense fallback={<ModalLoadingIndicator />}>
          <BrandingModal
            branding={branding}
            onClose={() => setBranding(null)}
          />
        </Suspense>
      ) : null}
      {mouseover ? (
        <Alert variant="outline" m="sm" p="xs" ta="center">
          Mouseover a branding to preview it
        </Alert>
      ) : null}
      {result.data?.brandings ? (
        <PicrDataGrid
          columns={brandingColumns}
          data={result.data?.brandings}
          onClick={(row) => setBranding(row)}
          onMouseover={(row) => (mouseover ? setThemeMode(row) : null)}
        />
      ) : undefined}
      <Text pt="md" fs="italic" c="dimmed">
        Manage a folder to create a new Branding
      </Text>
      {/*<Box pt="md">*/}
      {/*  <Button*/}
      {/*    onClick={() => setBranding({ ...defaultBranding })}*/}
      {/*    leftSection={<BrandingIcon />}*/}
      {/*  >*/}
      {/*    Add Branding*/}
      {/*  </Button>*/}
      {/*</Box>*/}
    </>
  );
};
