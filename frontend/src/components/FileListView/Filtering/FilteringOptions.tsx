import { MinimalFile } from '../../../../types';
import { Page, PageContent, Toolbar } from 'grommet';
import { useMemo } from 'react';
import { metadataForFiltering } from '../../../helpers/metadataForFiltering';
import { AspectSelector } from './AspectSelector';
import { SearchBox } from './SearchBox';
import { MetadataBox } from './MetadataBox';

export const FilteringOptions = ({ files }: { files: MinimalFile[] }) => {
  const meta = useMemo(() => metadataForFiltering(files), [files]);
  //aperture
  //camera
  //lens
  //shutter
  //iso
  return (
    <Page>
      <PageContent>
        <Toolbar
          // background="placeholder"
          border={{ side: 'top', color: 'brand' }}
          // margin={{ top: 'small' }}
          pad="small"
        >
          <SearchBox />
          <AspectSelector />
          <MetadataBox files={files} metadata={meta} />
        </Toolbar>
      </PageContent>
    </Page>
  );
};
