import { taskQuery } from '@shared/urql/queries/taskQuery';
// import { useRequery } from '@shared/hooks/useRequery';
import { useQuery } from 'urql';
import { View } from 'react-native';
import { PText } from '@/src/components/PText';

export const AppTaskSummary = ({ folderId }: { folderId: string }) => {
  const [result, requery] = useQuery({
    query: taskQuery,
    variables: { folderId },
  });

  // useRequery(requery, 1000);
  // this crashes with 'Cannot read property useEffect of null' on App :/

  const tasks = result.data?.tasks;
  const remaining = tasks?.filter((t) => t.status != 'Complete');
  if (!remaining || !remaining.length) return null;

  return (
    <View>
      {remaining.map(({ id, name, step, totalSteps }) => {
        const hasSteps = step && totalSteps && totalSteps > 0;
        const percent = hasSteps ? (step / totalSteps) * 100.0 : null;
        return (
          <PText>
            {name} {step} / {totalSteps} ({percent}%)
          </PText>
        );
      })}
    </View>
  );
};
