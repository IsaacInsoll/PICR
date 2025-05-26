import { Stack } from 'expo-router';

export default function AppLayout() {
  // Only require authentication within the (app) group's layout as users
  // need to be able to access the (auth) group and sign in again.
  // if (!me) {
  //   console.log('No me');
  //   // I tried the <Redirect> but kept getting "maximum call depth exceeded" error
  //   return <Redirect href="/login"/>
  //   return <Login />;
  // }
  // console.log('me exists');

  // return <Text style={{color: 'green'}}>you are logged in</Text>
  return <Stack />;
}
