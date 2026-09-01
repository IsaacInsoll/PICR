import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://isaacinsoll.github.io',
  base: '/PICR',
  integrations: [
    starlight({
      title: 'PICR',
      description:
        'Documentation for PICR, a self-hosted photo and video gallery for photographers.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/IsaacInsoll/PICR',
        },
      ],
      editLink: {
        baseUrl:
          'https://github.com/IsaacInsoll/PICR/edit/master/docs/src/content/docs/',
      },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { slug: 'index', label: 'PICR overview' },
            {
              slug: 'getting-started/install',
              label: 'Install PICR',
            },
            {
              slug: 'getting-started/first-gallery',
              label: 'Create your first gallery',
            },
          ],
        },
        {
          label: 'Galleries',
          items: [
            {
              slug: 'galleries/files-and-folders',
              label: 'Files and folders',
            },
            {
              slug: 'galleries/browsing',
              label: 'Browse, sort, and filter',
            },
            {
              slug: 'galleries/branding',
              label: 'Branding and theming',
            },
          ],
        },
        {
          label: 'Sharing and proofing',
          items: [
            {
              slug: 'sharing/users-and-links',
              label: 'Users and public links',
            },
            {
              slug: 'sharing/delivery',
              label: 'Proofing and delivery',
            },
            {
              slug: 'sharing/reviews',
              label: 'Comments, ratings, and flags',
            },
            {
              slug: 'sharing/notifications',
              label: 'Access logs and notifications',
            },
          ],
        },
        {
          label: 'Operations',
          items: [{ autogenerate: { directory: 'operations' } }],
        },
        {
          label: 'Integrations',
          items: [
            {
              slug: 'integrations/mobile-app',
              label: 'Mobile app',
            },
            {
              slug: 'integrations/lightroom',
              label: 'Lightroom Classic',
            },
          ],
        },
        {
          label: 'Reference',
          items: [{ autogenerate: { directory: 'reference' } }],
        },
      ],
    }),
  ],
});
