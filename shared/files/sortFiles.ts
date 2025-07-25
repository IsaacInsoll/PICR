import {File} from "@/gql/graphql";

export type FileSortType =
    | 'Filename'
    | 'LastModified'
    | 'RecentlyCommented'
    | 'Rating';
export type FileSortDirection = 'Asc' | 'Desc';

export interface FileSort {
    type: FileSortType;
    direction: FileSortDirection;
}
export const sortFiles = (files: File[], sort: FileSort):File[] => {
    const {type, direction} = sort;
    const positive = direction == 'Asc' ? 1 : -1;
    if (type == 'Filename') {
        return [...files].sort((a, b) => {
            if (a.name < b.name) return -positive;
            if (a.name > b.name) return positive;
            return 0;
        });
    }
    if (type == 'LastModified') {
        return [...files].sort((a, b) => {
            if (a.fileLastModified < b.fileLastModified) return positive;
            if (a.fileLastModified > b.fileLastModified) return -positive;
            return 0;
        });
    }
    if (type == 'RecentlyCommented') {
        return [...files].sort((a, b) => {
            if (!a.latestComment || a.latestComment < b.latestComment)
                return positive;
            if (!b.latestComment || a.latestComment > b.latestComment)
                return -positive;
            return 0;
        });
    }
    if (type == 'Rating') {
        return [...files].sort((a, b) => {
            const ar = a.rating ?? 0;
            const br = b.rating ?? 0;
            if (ar < br) return positive;
            if (ar > br) return -positive;
            return 0;
        });
    }
    return files;
};