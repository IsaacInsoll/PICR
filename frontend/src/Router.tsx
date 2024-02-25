import { Route, Routes, useNavigate } from 'react-router-dom';
import { LoginForm } from './pages/LoginForm';
import { ViewFolder } from './pages/ViewFolder';
import { ReactNode } from 'react';
import { Button, Page, PageContent, PageHeader } from 'grommet';
export const Router = ({ loggedIn }: { loggedIn: boolean }) => {
  return (
    <Routes>
      <Route path="/" element={<h1>PICR Server</h1>} />
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/admin"
        element={loggedIn ? <ViewFolder /> : <LoginForm />}
      />
      <Route path="/shared/:hash" element={<h1>Shared Path </h1>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const NotFound = (): ReactNode => {
  const navigate = useNavigate();
  return (
    <Page>
      <PageContent>
        <PageHeader
          title="404: Not Found"
          subtitle="Sorry, we weren't able to find the content you are looking for. Perhaps you have the wrong address or need to log in?"
          actions={<Button label="PICR Home" onClick={() => navigate('/')} />}
          level={1} // Use different levels for different headers
        />
      </PageContent>
    </Page>
  );
};
