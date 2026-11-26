import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const postsDir = path.join(process.cwd(), 'src', 'app', 'blog', 'posts');
  const files = await fs.promises.readdir(postsDir);
  return files.filter(f => f.endsWith('.md')).map(f => ({ slug: f.replace(/\.md$/, '') }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const postPath = path.join(process.cwd(), 'src', 'app', 'blog', 'posts', `${slug}.md`);
  if (!fs.existsSync(postPath)) {
    notFound();
    return null;
  }
  const file = await fs.promises.readFile(postPath, 'utf-8');
  const { data, content } = matter(file);
  const title = data.title || slug;
  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <article className="prose" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
      <p className="mt-6">
        <Link href="/blog" className="text-blue-600 hover:underline">← Back to Blog</Link>
      </p>
    </main>
  );
}
