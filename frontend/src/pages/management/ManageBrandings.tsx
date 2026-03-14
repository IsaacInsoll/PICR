import { Box, Button } from '@mantine/core';
import { useQuery } from 'urql';
import { Suspense, useState } from 'react';
import QueryFeedback from '../../components/QueryFeedback';
import { PicrDataGrid } from '../../components/PicrDataGrid';
import { viewBrandingsQuery } from '@shared/urql/queries/viewBrandingsQuery';
import { BrandingIcon } from '../../PicrIcons';
import { brandingColumns } from './brandingColumns';
import { useSetAtom } from 'jotai';
import { themeModeAtom } from '../../atoms/themeModeAtom';
import { BrandingDrawer } from './BrandingDrawer';
import { ModalLoadingIndicator } from '../../components/ModalLoadingIndicator';
import { defaultBranding } from '../../helpers/defaultBranding';
import type { BrandingRow } from '@shared/types/queryRows';
import type { SocialLink } from '@shared/branding/socialLinkTypes';

export const ManageBrandings = () => {
  const [result, reQuery] = useQuery({ query: viewBrandingsQuery });
  const [branding, setBranding] = useState<BrandingRow | null>(null);
  const setThemeMode = useSetAtom(themeModeAtom);

  return (
    <>
      <QueryFeedback result={result} reQuery={reQuery} />
      {branding != null ? (
        <Suspense fallback={<ModalLoadingIndicator />}>
          <BrandingDrawer
            branding={{
              ...branding,
              socialLinks:
                (branding.socialLinks as SocialLink[] | null | undefined) ??
                null,
            }}
            folders={branding.folders}
            onClose={() => setBranding(null)}
          />
        </Suspense>
      ) : null}
      {result.data?.brandings ? (
        <PicrDataGrid
          columns={brandingColumns}
          data={result.data.brandings}
          onClick={(row) => setBranding(row)}
          onMouseover={(row) =>
            setThemeMode(row as Parameters<typeof setThemeMode>[0])
          }
        />
      ) : undefined}
      <Box pt="md">
        <Button
          onClick={() => setBranding({ ...defaultBranding, folders: [] })}
          leftSection={<BrandingIcon />}
        >
          Add Branding
        </Button>
      </Box>
    </>
  );
};
