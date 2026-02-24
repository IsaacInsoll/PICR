import { joinTitles } from '@shared/joinTitle';

export const PicrTitle = ({ title }: { title: string | string[] }) => {
  const value = typeof title === 'string' ? title : joinTitles(title);
  return <title>{value ?? 'PICR'}</title>;
};
