import { gql } from '../helpers/gql';

export const FolderActivity = ({ folderId }: { folderId: number }) => {
  return <>Viewing activity for folder {folderId}</>;
};

const folderActivityQuery = gql(/* GraphQL */ `
query FolderActivity($folderId: String!) {
    
}`);
