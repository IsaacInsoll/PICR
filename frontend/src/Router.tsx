import { Navigate, Route, Routes } from 'react-router';
import { LoginForm } from './pages/LoginForm';
import { ViewFolder } from './pages/ViewFolder';
import { PageNotFound } from './pages/PageNotFound';
import { Settings } from './pages/management/Settings';
import { ParticleBackground } from './components/ParticleBackground';
import { Dashboard } from './pages/Dashboard';

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
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<Dashboard />} />
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
