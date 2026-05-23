import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-mermaid-viewer';
import generatedSidebar from './sidebar.generated.json';

const repo = process.env.GITHUB_REPOSITORY ?? 'esteban-m/open-task';
const repoName = repo.split('/')[1];
const base = process.env.DOCS_BASE ?? `/${repoName}/docs/`;

const sidebar = generatedSidebar.map((group: { text?: string; items?: { text: string; link: string }[] }) => {
  if (group.text !== 'Guide' || !group.items) return group;
  const hasUsage = group.items.some((item) => item.link === '/guide/usage');
  if (hasUsage) return group;
  return {
    ...group,
    items: [
      group.items[0],
      { text: "Guide d'utilisation (GIF)", link: '/guide/usage' },
      ...group.items.slice(1),
    ],
  };
});

export default withMermaid(
  defineConfig({
    title: 'Open-Task',
    description: 'Documentation technique — NestJS, Nuxt, PostgreSQL, WebSocket',
    lang: 'fr-FR',
    base,
    cleanUrls: true,
    lastUpdated: true,
    appearance: 'dark',

    ignoreDeadLinks: [
      /^http:\/\/localhost/,
      /README\.md$/,
      /^https:\/\/github\.com\//,
    ],

    head: [['meta', { name: 'theme-color', content: '#2563eb' }]],

    themeConfig: {
      logo: '/hero.svg',
      siteTitle: 'Open-Task',
      nav: [
        { text: 'Portail', link: '../' },
        { text: 'Guide', link: '/guide/getting-started' },
        { text: 'Démos GIF', link: '/guide/usage' },
        { text: 'Architecture', link: '/generated/architecture' },
        { text: 'Backend', link: '/generated/backend/authentication' },
        { text: 'API', link: '/generated/api-reference' },
        { text: 'GitHub', link: `https://github.com/${repo}` },
      ],
      sidebar,
      socialLinks: [{ icon: 'github', link: `https://github.com/${repo}` }],
      footer: {
        message: 'Documentation générée automatiquement (doc-as-code)',
        copyright: 'Open-Task — CC0',
      },
      search: { provider: 'local' },
    },

    markdown: {
      theme: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },

    mermaid: {
      theme: 'dark',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#60a5fa',
        lineColor: '#94a3b8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
      },
    },

    mermaidPlugin: {
      class: 'mermaid',
    },
  }),
);
