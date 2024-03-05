import { Suspense } from 'react';
import { Page, PageContent } from 'grommet';
import { useQuery } from 'urql';
import { manageFolderQuery } from '../queries/manageFolderQuery';
import QueryFeedback from '../components/QueryFeedback';

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
  const { data } = result;
  console.log(data);
  return (
    <h1>
      <QueryFeedback result={result} reQuery={reQuery} />
    </h1>
  );
};
