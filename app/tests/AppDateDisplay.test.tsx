import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { Provider, createStore } from 'jotai';
import { render, screen } from '@testing-library/react-native';
import { AppDateDisplay } from '@/src/components/AppDateDisplay';
import { dateDisplayRelativeAtom } from '@/src/atoms/atoms';

describe('AppDateDisplay', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders relative time from app-owned Jotai state', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-25T12:00:00Z'));
    const store = createStore();
    store.set(dateDisplayRelativeAtom, true);

    await render(
      <Provider store={store}>
        <AppDateDisplay dateString="2026-08-25T10:00:00Z" />
      </Provider>,
    );

    expect(screen.getByText('2 hours ago')).toBeOnTheScreen();
  });

  it('renders nothing without a date', async () => {
    const result = await render(<AppDateDisplay />);

    expect(result.toJSON()).toBeNull();
  });
});
