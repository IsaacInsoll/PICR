import { gql } from '../helpers/gql';
import { useQuery } from 'urql';
import { Box } from 'grommet';

export const TaskSummary = ({ folderId }: { folderId?: string }) => {
  const [result, requery] = useQuery(taskQuery);

  return (
    <Box>
      {result.data.tasks.map(({ id, name, step, totalSteps }) => (
        <Box>
          {name} {step}/{totalSteps}
        </Box>
      ))}
    </Box>
  );
};

const taskQuery = gql(/* GraphQL */ `
  query TaskQuery {
    tasks {
      id
      name
      step
      totalSteps
    }
  }
`);
