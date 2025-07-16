/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'about',
    'intent',
    'README',
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/system-overview',
        'architecture/phase-plan',
        'architecture/post-mvp-roadmap',
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
        {
          type: 'category',
          label: 'Phase 1 (Complete)',
          items: [
            'features/phase1/message-import-intent',
            'features/phase1/message-import-design',
            'features/phase1/message-import-pitch',
          ],
        },
        {
          type: 'category',
          label: 'Phase 2 (In Progress)',
          items: [
            'features/phase2/memory-extraction-intent',
            'features/phase2/memory-extraction-design',
            'features/phase2/memory-extraction-pitch',
            {
              type: 'category',
              label: 'Sub-Features',
              items: [
                'features/phase2/memory-schema/memory-schema-intent',
                'features/phase2/memory-schema/memory-schema-design',
                'features/phase2/memory-schema/memory-schema-pitch',
                'features/phase2/memory-processing/memory-processing-intent',
                'features/phase2/memory-processing/memory-processing-design',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Phase 3 (Planned)',
          items: [
            'features/phase3/claude-memory-integration-intent',
            'features/phase3/claude-memory-integration-design',
            'features/phase3/claude-memory-integration-pitch',
          ],
        },
        {
          type: 'category',
          label: 'Archived',
          items: [
            'features/archived/dual-logging/intent',
            'features/archived/dual-logging/design',
            'features/archived/dual-logging/pitch',
            'features/archived/logger-api-unification/intent',
            'features/archived/logger-api-unification/design',
            'features/archived/logger-api-unification/pitch',
            'features/archived/docusaurus-site/intent',
            'features/archived/docusaurus-site/design',
            'features/archived/docusaurus-site/pitch',
            'features/archived/mnemosyne-docs-theme/intent',
            'features/archived/mnemosyne-docs-theme/design',
            'features/archived/mnemosyne-docs-theme/pitch',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'planning-guide',
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
