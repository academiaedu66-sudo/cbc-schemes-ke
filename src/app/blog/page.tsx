import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export default async function BlogPage() {
  const postsDir = path.join(process.cwd(), 'src', 'app', 'blog', 'posts');
  const files = await fs.promises.readdir(postsDir);
  const posts = files.filter(f => f.endsWith('.md')).map(f => {
    const slug = f.replace(/\.md$/,'');
    const filePath = path.join(postsDir, f);
    const content = fs.readFileSync(filePath, 'utf-8');
    const titleMatch = content.match(/^#\s+(.*)$/m);
    const title = titleMatch ? titleMatch[1] : slug;
    const excerpt = content.split('\n').slice(1,3).join(' ');
    return { slug, title, excerpt };
  });

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">CBC Materials Blog</h1>
      <ul>
        {posts.map(post => (
          <li key={post.slug} className="mb-4">
            <Link href={`/blog/${post.slug}`} className="text-xl text-blue-600 hover:underline">
              {post.title}
            </Link>
            <p className="text-sm text-gray-600">{post.excerpt}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
