import { gql } from '../helpers/gql';
import { useQuery } from 'urql';
import { Box, Card, Meter, Page, PageContent } from 'grommet';
import { useEffect } from 'react';
import { linksToDownloadAtom } from './DownloadZipButton';
import { useAtom } from 'jotai/index';

export const TaskSummary = ({ folderId }: { folderId: string }) => {
  const [result, requery] = useQuery({
    query: taskQuery,
    variables: { folderId },
  });

  const [zips, setZips] = useAtom(linksToDownloadAtom);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.visibilityState || document.visibilityState === 'visible')
        requery({ requestPolicy: 'network-only' });
    }, 1000);
    return () => clearInterval(timer);
  });

  const tasks = result.data?.tasks;
  const complete = tasks?.filter((t) => t.status == 'Complete');

  useEffect(() => {
    zips.map((fh) => {
      const task = complete?.find(({ id }) => id === fh.folder?.id + fh.hash);
      if (task) {
        console.log(task);
        console.log(fh);
        const url = `/zip/${fh.folder?.id}/${fh.hash}/${fh.folder?.name}`;
        triggerDownload(url);
        setZips((list) => list.filter((zz) => zz !== fh));
      }
    });
  }, [zips, complete]);
  const remaining = tasks?.filter((t) => t.status != 'Complete');
  if (!remaining || !remaining.length) return null;
  return (
    <Page>
      <PageContent>
        <Card pad="small" margin={{ bottom: 'small' }}>
          {remaining.map(({ id, name, step, totalSteps }) => {
            return (
              <Box direction="row" gap="small" key={id}>
                <Box>
                  {name} {step}/{totalSteps}
                </Box>
                <Box flex="grow" pad={{ top: 'xsmall' }}>
                  <Meter
                    type="bar"
                    value={step}
                    max={totalSteps}
                    thickness="small"
                    size="full"
                  />
                </Box>
                {/*<Box>yo dawg</Box>*/}
              </Box>
            );
          })}
        </Card>
      </PageContent>
    </Page>
  );
};

const taskQuery = gql(/* GraphQL */ `
  query TaskQuery($folderId: ID!) {
    tasks(folderId: $folderId) {
      id
      name
      step
      totalSteps
      status
    }
  }
`);

const triggerDownload = (href: string) => {
  const link = document.createElement('a');
  link.href = href;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
