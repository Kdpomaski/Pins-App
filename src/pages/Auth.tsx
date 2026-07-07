import { supabase } from '@/lib/supabase';
import { useState } from 'react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) console.error(error);
    else alert('Check your email for confirmation');
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error(error);
  };

  const googleSignIn = async () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const redirectTo = `${window.location.origin}${base}/auth/callback`;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Welcome to Pins</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-4 p-3 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-6 p-3 border rounded"
      />

      <button onClick={signIn} className="w-full bg-blue-600 text-white p-3 rounded mb-3">
        Sign In
      </button>
      <button onClick={signUp} className="w-full bg-green-600 text-white p-3 rounded mb-3">
        Sign Up
      </button>
      <button onClick={googleSignIn} className="w-full bg-red-600 text-white p-3 rounded">
        Sign in with Google
      </button>
    </div>
  );
};

export default Auth;