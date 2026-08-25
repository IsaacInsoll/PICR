export const folderContentsRowTestId = (item: {
  __typename: string;
  id: string;
}): string => `${item.__typename.toLowerCase()}-row-${item.id}`;
