import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AppTaskSummary } from '@/src/components/AppTaskSummary';

let mockTasks: Array<{
  id: string;
  name: string;
  status: string;
  step?: number;
  totalSteps?: number;
}> = [];

jest.mock('urql', () => ({
  useQuery: () => [{ data: { tasks: mockTasks } }, jest.fn()],
}));

jest.mock('@/src/app-shared/useRequery', () => ({
  useRequery: jest.fn(),
}));

jest.mock('@/src/components/PTitle', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    PTitle: ({ children }: { children: ReactNode }) =>
      mockReact.createElement(MockText, null, children),
  };
});

describe('AppTaskSummary', () => {
  it('shows indeterminate activity without a null percentage', async () => {
    mockTasks = [
      {
        id: 'media-scan',
        name: 'Checking for new media…',
        status: 'Running',
      },
    ];

    await render(<AppTaskSummary folderId="1" />);

    expect(screen.getByText('Checking for new media…')).toBeOnTheScreen();
    expect(screen.queryByText('(null%)')).not.toBeOnTheScreen();
  });

  it('renders zero and subsequent determinate progress', async () => {
    mockTasks = [
      {
        id: 'thumbnails',
        name: 'Generate thumbnails',
        status: 'Running',
        step: 0,
        totalSteps: 4,
      },
    ];

    const view = await render(<AppTaskSummary folderId="1" />);
    expect(screen.getByText('(0.0%)')).toBeOnTheScreen();

    mockTasks = [{ ...mockTasks[0], step: 2 }];
    await view.rerender(<AppTaskSummary folderId="1" />);
    expect(screen.getByText('(50.0%)')).toBeOnTheScreen();
  });
});
