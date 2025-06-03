'use client';

import { useState } from 'react';

export default function TestUser() {
  const [msg, setMsg] = useState('');

  const createUser = async () => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Sam',
        password: 'mypassword123',
      }),
    });

    const data = await res.json();
    setMsg(JSON.stringify(data, null, 2));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Create Test User</h1>
      <button
        onClick={createUser}
        style={{
          padding: '0.5rem 1rem',
          background: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Create User
      </button>
      <pre style={{ marginTop: '1rem' }}>{msg}</pre>
    </div>
  );
}
