import { Helmet } from 'react-helmet-async';
import { isString } from 'lodash';
import { joinTitles } from '../../../backend/helpers/joinTitle';

export const PicrTitle = ({ title }: { title: string | string[] }) => {
  const value = isString(title) ? title : joinTitles(title);
  return (
    <Helmet>
      <title>{value ?? 'PICR'}</title>
    </Helmet>
  );
};
