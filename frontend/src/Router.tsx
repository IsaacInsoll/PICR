import { matchPath, Route, Routes, useNavigate } from 'react-router-dom';
import { LoginForm } from './pages/LoginForm';
import { ViewFolder } from './pages/ViewFolder';
import { PageNotFound } from './pages/PageNotFound';
import { useMe } from './hooks/useMe';
import { Settings } from './pages/management/Settings';
import { FileViewType } from './atoms/modalAtom';

const folderRoute = '/:folderId/:fileId?/:fileView?';

export interface FolderRouteParams {
  folderId: string;
  fileId?: string;
  fileView?: FileViewType;
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
      <Route path="*" element={loggedIn ? <PageNotFound /> : <LoginForm />} />
    </Routes>
  );
};

export const getUUID = () => {
  const match = matchPath({ path: '/s/:uuid/*' }, window.location.pathname);
  return match?.params.uuid;
};

const HomePage = () => {
  const me = useMe();
  const navigate = useNavigate();
  if (me) navigate('/admin/f/' + me?.folderId);
  return null;
};
