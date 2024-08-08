import { authKeyAtom } from '../atoms/authAtom';
import { gql } from '../helpers/gql';
import { useQuery } from 'urql';
import { Router } from '../Router';
import { useAtomValue } from 'jotai/index';

const meQuery = gql(/* GraphQL */ `
  query MeQuery {
    me {
      id
      name
    }
  }
`);

// Doesn't do much yet, but will eventually catch "logged in but don't have access to this item" issues
export const UserProvider = () => {
  const token = useAtomValue(authKeyAtom);
  const loggedIn = token !== '';
  console.log('rendering UserProvider');
  const [result] = useQuery({ query: meQuery });
  // console.log(data.data);
  return (
    <>
      <Router loggedIn={loggedIn} />
    </>
  );
};
