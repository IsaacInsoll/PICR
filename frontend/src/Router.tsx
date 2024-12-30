import { Route, Routes, useNavigate } from 'react-router';
import { LoginForm } from './pages/LoginForm';
import { ViewFolder } from './pages/ViewFolder';
import { PageNotFound } from './pages/PageNotFound';
import { useMe } from './hooks/useMe';
import { Settings } from './pages/management/Settings';
import { ParticleBackground } from './components/ParticleBackground';

const folderRoute = '/:folderId/:fileId?/:tab?';

export interface FolderRouteParams {
  folderId: string;
  fileId?: 'manage' | 'activity' | string;
}

//note: if adding public paths not starting with `/s/:uuid/*` then edit getUUID below as urqlClient.ts depends on it
export const Router = ({ loggedIn }: { loggedIn: boolean }) => {
  return (
    <Routes>
      <Route path={`/s/:uuid${folderRoute}`} element={<ViewFolder />} />
      {loggedIn ? (
        <>
          <Route path={`/admin/f${folderRoute}`} element={<ViewFolder />} />
          <Route path="/admin/settings/:tab?/:slug?" element={<Settings />} />
          <Route path="/" element={<HomePage />} />
        </>
      ) : null}
      <Route
        path="*"
        element={
          loggedIn ? (
            <PageNotFound />
          ) : (
            <>
              <ParticleBackground />
              <LoginForm />
            </>
          )
        }
      />
    </Routes>
  );
};

const HomePage = () => {
  const me = useMe();
  const navigate = useNavigate();
  if (me) navigate('/admin/f/' + me?.folderId);
  return null;
};
