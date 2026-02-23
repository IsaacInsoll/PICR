import { isString } from 'lodash';
import { joinTitles } from '@shared/joinTitle';

export const PicrTitle = ({ title }: { title: string | string[] }) => {
  const value = isString(title) ? title : joinTitles(title);
  return <title>{value ?? 'PICR'}</title>;
};
