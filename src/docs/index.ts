const modules = import.meta.glob('./*.md', { eager: true, import: 'default' });

const docs = Object.fromEntries(
  Object.entries(modules).map(([path, content]) => [
    path.replace('./', '').replace('.md', ''),
    content,
  ])
) as Record<string, string>;

export default docs;

export type DocId = keyof typeof docs;