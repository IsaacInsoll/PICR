import { Suspense, useState } from 'react';
import { Box, Button, Page, PageContent } from 'grommet';
import { useQuery } from 'urql';
import { manageFolderQuery } from '../queries/manageFolderQuery';
import QueryFeedback from '../components/QueryFeedback';
import { Add } from 'grommet-icons';
import { ManagePublicLink } from './ManagePublicLink';

export const ManageFolder = ({ folderId }: { folderId: string }) => {
  return (
    <Page>
      <PageContent>
        <Suspense>
          <ManageFolderBody folderId={folderId} />
        </Suspense>
      </PageContent>
    </Page>
  );
};

const ManageFolderBody = ({ folderId }: { folderId: string }) => {
  const [result, reQuery] = useQuery({
    query: manageFolderQuery,
    variables: { folderId },
    // context: headers,
  });
  const [linkId, setLinkId] = useState<number | null>(null);
  const { data } = result;
  console.log(data);
  return (
    <Box>
      {linkId !== null ? (
        <ManagePublicLink
          onClose={() => {
            setLinkId(null);
            reQuery();
          }}
          id={linkId}
          folder={data?.folder}
        />
      ) : null}
      {data?.publicLinks && data.publicLinks.length > 0 ? null : null}
      <Button label="Create Link" icon={<Add />} onClick={() => setLinkId(0)} />
      <QueryFeedback result={result} reQuery={reQuery} />
    </Box>
  );
};
