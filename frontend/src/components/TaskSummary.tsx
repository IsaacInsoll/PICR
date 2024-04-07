import { gql } from '../helpers/gql';
import { useQuery } from 'urql';
import { Box, Card, Meter, Page, PageContent } from 'grommet';
import { useEffect } from 'react';

export const TaskSummary = ({ folderId }: { folderId: string }) => {
  const [result, requery] = useQuery({
    query: taskQuery,
    variables: { folderId },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.visibilityState || document.visibilityState === 'visible')
        requery({ requestPolicy: 'network-only' });
    }, 1000);
    return () => clearInterval(timer);
  });

  const tasks = result.data?.tasks;
  if (!tasks || !tasks.length) return null;
  return (
    <Page>
      <PageContent>
        <Card pad="small" margin={{ bottom: 'small' }}>
          {tasks.map(({ id, name, step, totalSteps }) => {
            return (
              <Box direction="row" gap="small">
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
    }
  }
`);
