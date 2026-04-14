'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetch(`/api/blog?slug=${slug}`)
        .then(res => res.json())
        .then(data => {
          setPost(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Грешка:', err);
          setLoading(false);
        });
    }
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Зареждане...
      </div>
    );
  }
  
  if (!post || post.error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div>❌ Статията не е намерена</div>
        <Link href="/blog" style={{ marginTop: '1rem', color: '#8b5cf6' }}>← Назад към блога</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #2e1065)', padding: '2rem' }}>
      <Link href="/blog" style={{ color: '#8b5cf6', textDecoration: 'none' }}>← Назад към блога</Link>
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>{post.title}</h1>
        <div style={{ color: '#9ca3af', marginBottom: '2rem' }}>
          <span>{new Date(post.date).toLocaleDateString('bg-BG')}</span>
          <span style={{ marginLeft: '1rem' }}>👁️ {post.views} преглеждания</span>
          <span style={{ marginLeft: '1rem' }}>✍️ {post.author}</span>
        </div>
        <div style={{ color: '#cbd5e1', lineHeight: '1.8', fontSize: '1.1rem', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </div>
      </div>
    </div>
  );
}