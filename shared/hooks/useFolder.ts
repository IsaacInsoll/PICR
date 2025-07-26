import {useState} from "react";

export const useFolder = (folderId: string) => {
    const y = useState(true);
    // const x = useQuery({
    //     query: viewFolderQuery,
    //     variables: { folderId },
    // });
    // return x;
    return y;
}