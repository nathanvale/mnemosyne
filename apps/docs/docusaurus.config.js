// eslint-disable-next-line @typescript-eslint/no-require-imports
const { themes: prismThemes } = require('prism-react-renderer')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Mnemosyne Engineering Docs',
  tagline: 'Relational Memory System Documentation',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://nathanvale.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/mnemosyne/',

  // GitHub pages deployment config.
  organizationName: 'nathanvale',
  projectName: 'mnemosyne',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/nathanvale/mnemosyne/tree/main/docs/',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Mnemosyne',
      logo: {
        alt: 'Mnemosyne Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/nathanvale/mnemosyne',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Architecture',
              to: '/architecture/system-overview',
            },
            {
              label: 'Features',
              to: '/features',
            },
            {
              label: 'Packages',
              to: '/packages',
            },
          ],
        },
        {
          title: 'Development',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/nathanvale/mnemosyne',
            },
            {
              label: 'Issues',
              href: 'https://github.com/nathanvale/mnemosyne/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Mnemosyne Project. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
}

module.exports = config
