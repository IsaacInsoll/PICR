import { taskQuery } from '@shared/urql/queries/taskQuery';
// import { useRequery } from '@shared/hooks/useRequery';
import { useQuery } from 'urql';
import { View } from 'react-native';
import { PText } from '@/src/components/PText';
import { useRequery } from '@/src/app-shared/useRequery';
import { PView } from '@/src/components/PView';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { PTitle } from '@/src/components/PTitle';

export const AppTaskSummary = ({ folderId }: { folderId: string }) => {
  const [result, requery] = useQuery({
    query: taskQuery,
    variables: { folderId },
  });

  useRequery(requery, 1000);
  // this crashes with 'Cannot read property useEffect of null' on App :/

  const tasks = result.data?.tasks;
  const remaining = tasks?.filter((t) => t.status != 'Complete');
  if (!remaining || !remaining.length) return null;

  return (
    <View style={{ width: '100%' }}>
      {remaining.map(({ id, name, step, totalSteps }) => {
        const hasSteps = step && totalSteps && totalSteps > 0;
        const percent = hasSteps
          ? (step / totalSteps).toFixed(2) * 100.0
          : null;
        return (
          <PView
            key={id}
            row={true}
            gap="md"
            style={{ padding: 8, width: '100%', justifyContent: 'center' }}
          >
            <AppLoadingIndicator />
            <PTitle level={4}>{name}</PTitle>
            <PTitle level={4}>({percent}%)</PTitle>
          </PView>
        );
      })}
    </View>
  );
};
