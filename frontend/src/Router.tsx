import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { PublicLinkHomeRedirect } from './pages/PublicLinkHomeRedirect';
import { adminFolderRoute, publicFolderRoute } from './helpers/folderRoutes';

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((module) => ({
    default: module.Dashboard,
  })),
);
const LoginForm = lazy(() =>
  import('./pages/LoginForm').then((module) => ({
    default: module.LoginForm,
  })),
);
const PageNotFound = lazy(() =>
  import('./pages/PageNotFound').then((module) => ({
    default: module.PageNotFound,
  })),
);
const ParticleBackground = lazy(() =>
  import('./components/ParticleBackground').then((module) => ({
    default: module.ParticleBackground,
  })),
);
const Settings = lazy(() =>
  import('./pages/management/Settings').then((module) => ({
    default: module.Settings,
  })),
);
const ViewFolder = lazy(() =>
  import('./pages/ViewFolder').then((module) => ({
    default: module.ViewFolder,
  })),
);

export interface FolderRouteParams {
  folderId: string;
  fileId?: 'manage' | 'activity' | string;
}

//note: if adding public paths not starting with `/s/:uuid/*` then edit getUUID below as urqlClient.ts depends on it
export const Router = ({ loggedIn }: { loggedIn: boolean }) => {
  return (
    <Routes>
      <Route path={publicFolderRoute} element={<ViewFolder />} />
      <Route path="/s/:uuid" element={<PublicLinkHomeRedirect />} />
      {loggedIn ? (
        <>
          <Route path={adminFolderRoute} element={<ViewFolder />} />
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
