import AccessLog from './models/AccessLog';

export const createAccessLog = (userId: number, folderId: number) => {
  const log = new AccessLog();
  log.userId = userId;
  log.folderId = folderId;
  log.save();
};