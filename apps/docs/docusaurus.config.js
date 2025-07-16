// eslint-disable-next-line @typescript-eslint/no-require-imports
const { themes: prismThemes } = require('prism-react-renderer')

/** @type {import('@docusaurus/types').Config} */
const config = {
  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Spline+Sans:wght@400;500;700&display=swap',
      rel: 'stylesheet',
    },
  ],
  title: 'Mnemosyne',
  tagline: 'AI that remembers what matters',
  favicon: 'favicon.ico',

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
  onBrokenAnchors: 'warn',

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
          editUrl:
            'https://github.com/nathanvale/mnemosyne/tree/main/apps/docs/docs/',
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
    // Social card image for sharing
    image: 'img/hero/hero-mnemosyne.png',
    navbar: {
      title: 'Mnemosyne',
      logo: {
        src: 'img/logo-dark.svg',
        srcDark: 'img/logo-light.svg',
        alt: 'Mnemosyne Logo',
        href: '/',
        target: '_self',
      },
      items: [
        { to: '/about', label: 'About', position: 'right' },
        { to: '/packages', label: 'Packages', position: 'right' },
        {
          to: '/architecture/system-overview',
          label: 'Docs',
          position: 'right',
        },
        {
          to: '/intent',
          label: 'Get Started',
          position: 'right',
          className: 'get-started-button',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          items: [
            {
              label: 'About',
              to: '/about',
            },
            {
              label: 'Packages',
              to: '/packages',
            },
            {
              label: 'Docs',
              to: '/architecture/system-overview',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Mnemosyne. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
}

module.exports = config
