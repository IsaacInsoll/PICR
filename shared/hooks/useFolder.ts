import { useState } from 'react';

export const useFolder = (_folderId: string) => {
  void _folderId;
  const y = useState(true);
  // const x = useQuery({
  //     query: viewFolderQuery,
  //     variables: { folderId },
  // });
  // return x;
  return y;
};
