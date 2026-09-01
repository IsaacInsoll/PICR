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
        baseUrl: 'https://github.com/IsaacInsoll/PICR/edit/master/docs/',
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
          ],
        },
        {
          label: 'Galleries',
          items: [{ autogenerate: { directory: 'galleries' } }],
        },
        {
          label: 'Sharing and proofing',
          items: [{ autogenerate: { directory: 'sharing' } }],
        },
        {
          label: 'Operations',
          items: [{ autogenerate: { directory: 'operations' } }],
        },
        {
          label: 'Integrations',
          items: [{ autogenerate: { directory: 'integrations' } }],
        },
        {
          label: 'Reference',
          items: [{ autogenerate: { directory: 'reference' } }],
        },
      ],
    }),
  ],
});
