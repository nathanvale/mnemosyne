/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    'intent',
    'README',
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/system-overview',
        'architecture/phase-plan',
        'architecture/data-flow',
        'architecture/glossary',
        'architecture/monorepo',
        'architecture/packages',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/index',
        'features/dual-logging/intent',
        'features/dual-logging/design',
        'features/dual-logging/pitch',
        'features/logger-api-unification/intent',
        'features/logger-api-unification/design',
        'features/logger-api-unification/pitch',
        'features/docusaurus-site/intent',
        'features/docusaurus-site/design',
        'features/docusaurus-site/pitch',
        'features/mnemosyne-docs-theme/intent',
        'features/mnemosyne-docs-theme/design',
        'features/mnemosyne-docs-theme/pitch',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/planning-guide',
        'guides/focus-vs-churn',
        'guides/github-integration',
        {
          type: 'category',
          label: 'Templates',
          items: ['template/intent', 'template/design', 'template/pitch'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Packages',
      items: [
        'packages/index',
        {
          type: 'category',
          label: 'Logger',
          items: [
            'packages/logger/architecture',
            'packages/logger/api-reference',
            'packages/logger/browser-vs-node',
            'packages/logger/integration-patterns',
          ],
        },
      ],
    },
  ],
}

module.exports = sidebars
