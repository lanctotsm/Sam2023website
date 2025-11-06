import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{padding: '2rem'}}>
      <h1>Welcome to My Modern Website</h1>
      <nav>
        <ul>
          <li><Link href="/resume">Resume</Link></li>
          <li><Link href="/gallery">Gallery</Link></li>
          <li><Link href="/api/auth/signin">Login</Link></li>
        </ul>
      </nav>
    </div>
  );
}
