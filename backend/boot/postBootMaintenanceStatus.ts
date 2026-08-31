import type { Task } from '@shared/gql/graphql.js';

interface MaintenanceTaskInput {
  id: string;
  name: string;
  totalSteps?: number;
}

interface MaintenanceTaskProgress {
  incrementStep: () => void;
  setTotalSteps: (totalSteps: number) => void;
}

let activeTask: Task | null = null;

export const postBootMaintenanceTaskStatus = (): Task | null => activeTask;

// Post-boot maintenance currently runs tasks sequentially. If that ever changes,
// replace this single slot with a keyed collection so parallel tasks don't
// clobber each other's visible admin progress.
export const withPostBootMaintenanceTask = async <T>(
  task: MaintenanceTaskInput,
  operation: (progress: MaintenanceTaskProgress) => Promise<T>,
): Promise<T> => {
  activeTask = {
    id: task.id,
    name: task.name,
    step: 0,
    totalSteps: task.totalSteps,
    status: 'Running',
  };

  const progress: MaintenanceTaskProgress = {
    incrementStep: () => {
      if (!activeTask) return;
      activeTask = {
        ...activeTask,
        step: (activeTask.step ?? 0) + 1,
      };
    },
    setTotalSteps: (totalSteps) => {
      if (!activeTask) return;
      activeTask = {
        ...activeTask,
        totalSteps,
      };
    },
  };

  try {
    return await operation(progress);
  } finally {
    activeTask = null;
  }
};

export const resetPostBootMaintenanceTaskStatusForTests = (): void => {
  activeTask = null;
};
