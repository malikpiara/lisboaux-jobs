'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

/**
 * Signup Page
 *
 * Flow:
 * 1. User enters email, password, and optional full name
 * 2. signUp() creates user in Supabase Auth
 * 3. Supabase trigger (handle_new_user) creates profile row
 * 4. If email confirmation is required, show message
 * 5. Otherwise, redirect to /admin
 *
 * Note: By default, Supabase requires email confirmation.
 * You can disable this in Supabase Dashboard > Auth > Settings.
 */
export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // This data gets stored in raw_user_meta_data
        // and is picked up by our handle_new_user trigger
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Check if email confirmation is required
    // If user.identities is empty, email confirmation is pending
    if (data.user && data.user.identities?.length === 0) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    // If we get here, email confirmation is disabled or user is auto-confirmed
    if (data.session) {
      router.refresh();
      router.push('/admin');
    } else {
      // Email confirmation required
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
        <div className='w-full max-w-sm text-center'>
          <div className='bg-green-50 text-green-700 p-4 rounded-md'>
            <h2 className='font-semibold mb-2'>Check your email</h2>
            <p className='text-sm'>
              We&apos;ve sent you a confirmation link. Click it to activate your
              account.
            </p>
          </div>
          <Link
            href='/signin'
            className='mt-4 inline-block text-blue-600 hover:underline text-sm'
          >
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='w-full max-w-sm'>
        <h1 className='text-2xl font-semibold text-center mb-8'>
          Create your account
        </h1>

        <form onSubmit={handleSignup} className='space-y-4'>
          {error && (
            <div className='bg-red-50 text-red-700 p-3 rounded-md text-sm'>
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor='fullName'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Full name
            </label>
            <input
              id='fullName'
              type='text'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='Jane Doe'
            />
          </div>

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='you@example.com'
            />
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Password
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='••••••••'
            />
            <p className='mt-1 text-xs text-gray-500'>Minimum 6 characters</p>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className='mt-6 text-center text-sm text-gray-600'>
          Already have an account?{' '}
          <Link href='/signin' className='text-blue-600 hover:underline'>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
