import { matchPath, Route, Routes } from 'react-router-dom';
import { LoginForm } from './pages/LoginForm';
import { ViewFolder } from './pages/ViewFolder';
import { Center, Title, Text, Stack, MantineStyleProp } from '@mantine/core';
import { ManageUsers } from './pages/ManageUsers';

//note: if adding public paths not starting with `/s/:uuid/*` then edit getUUID below as urqlClient.ts depends on it
export const Router = ({ loggedIn }: { loggedIn: boolean }) => {
  return (
    <Routes>
      <Route path="/" element={<LoginForm />} />
      {/*<Route path="/login" element={<LoginForm />} />*/}
      <Route
        path="/admin/f/:folderId/:fileId?"
        element={loggedIn ? <ViewFolder /> : <LoginForm />}
      />
      <Route
        path="/admin/users/:userId?"
        element={loggedIn ? <ManageUsers /> : <LoginForm />}
      />
      <Route path="/s/:uuid/:folderId/:fileId?" element={<ViewFolder />} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
};

export const getUUID = () => {
  const match = matchPath({ path: '/s/:uuid/*' }, window.location.pathname);
  return match?.params.uuid;
};

const NoMatch = () => {
  const center: MantineStyleProp = { textAlign: 'center' };
  return (
    <Center style={{ height: '100vh' }}>
      <Stack gap={8}>
        <Title style={center}>Error</Title>
        <Text style={center} size="xl">
          We couldn't find what you are looking for
        </Text>
        <Text style={center} size="md" fs="italic">
          Contact the person who gave you the link
        </Text>
      </Stack>
    </Center>
  );
};
