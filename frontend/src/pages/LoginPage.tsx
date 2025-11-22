import { FormEvent, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(form);
  };

  return (
    <section className={styles.wrapper}>
      <form className={styles.form} onSubmit={onSubmit}>
        <header>
          <h1>Welcome back</h1>
          {location.state?.from?.pathname && (
            <p>You must sign in to access {location.state.from.pathname}.</p>
          )}
        </header>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
            placeholder="••••••••"
          />
        </label>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </section>
  );
};

export default LoginPage;




