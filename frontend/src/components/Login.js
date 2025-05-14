import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from '../firebase';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'register'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let userCredential;
      if (mode === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('firebaseToken', token);
      onLogin && onLogin();
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('firebaseToken');
    window.location.reload();
  };

  // If already logged in, show logout button
  if (localStorage.getItem('firebaseToken')) {
    return (
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 350, margin: '60px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center' }}>{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          style={{ width: '100%', marginBottom: 12, padding: 8 }}
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          style={{ width: '100%', marginBottom: 12, padding: 8 }}
        />
        <button type="submit" style={{ width: '100%', marginBottom: 8 }}>
          {mode === 'login' ? 'Login' : 'Register'}
        </button>
        <button
          type="button"
          style={{ width: '100%', background: 'none', border: 'none', color: '#003366', textDecoration: 'underline', cursor: 'pointer' }}
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  );
}

export default Login; 