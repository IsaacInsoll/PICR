import { Branding } from '../../../graphql-types';
import { useState } from 'react';
import { BrandingModal } from './management/BrandingModal';
import { Button, Tabs } from '@mantine/core';
import { BrandingIcon } from '../PicrIcons';
import { Page } from '../components/Page';
import { ManagePublicLinks } from './management/ManagePublicLinks';
import { GenerateThumbnailsButton } from './GenerateThumbnailsButton';
import { AccessLogs } from './management/AccessLogs';

export const ManageFolder = ({ folder, toggleManaging }) => {
  const [activeTab, setActiveTab] = useState<'links' | 'logs'>('links');
  return (
    <Page>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="links">Links</Tabs.Tab>
          <Tabs.Tab value="logs">Access Logs</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="links">
          <ManagePublicLinks folder={folder} relations="options">
            <GenerateThumbnailsButton folderId={folder.id} />
            <BrandingButton folder={folder} />
            <Button onClick={toggleManaging}>Close Settings</Button>
          </ManagePublicLinks>
        </Tabs.Panel>
        <Tabs.Panel value="logs">
          <AccessLogs folderId={folder.id} />
        </Tabs.Panel>
      </Tabs>
    </Page>
  );
};
const BrandingButton = ({ folder }) => {
  const folderHasBranding = folder.branding.folderId == folder.id;
  // it might be a branding from parent so lets set sensible defaults if so
  const branding: Branding = { ...folder.branding, folderId: folder.id };
  const [open, setOpen] = useState(false);
  return (
    <>
      {open ? (
        <BrandingModal branding={branding} onClose={() => setOpen(false)} />
      ) : null}
      <Button
        variant="default"
        leftSection={<BrandingIcon />}
        onClick={() => setOpen(true)}
      >
        {folderHasBranding ? 'Edit Branding' : 'Add Branding'}
      </Button>
    </>
  );
};
