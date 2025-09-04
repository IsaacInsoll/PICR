import { Text } from 'react-native';
export default {
  title: 'Test',
  component: () => <Text>Yo dawg</Text>,
  argTypes: {
    //   onArchiveTask: { action: 'onArchiveTask' },
  },
};

export const Default = {
  args: {
    // task: {
    //   id: '1',
    //   title: 'Test Task',
    //   state: 'TASK_INBOX',
    // },
  },
};

// export const Pinned = {
//   args: { task: { ...Default.args.task, state: 'TASK_PINNED' } },
// };
//
// export const Archived = {
//   args: { task: { ...Default.args.task, state: 'TASK_ARCHIVED' } },
// };
