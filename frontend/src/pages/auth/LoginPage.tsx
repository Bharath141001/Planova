import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { loginSchema, type LoginForm } from '@/utils/validators';
import { AuthShell } from './AuthShell';
import styles from './AuthShell.module.scss';

export function LoginPage() {
  const { login } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthShell title="Sign in to Planova" subtitle="Plan sprints, track issues, ship faster.">
      <form onSubmit={handleSubmit((v) => login.mutate(v))} className={styles.form}>
        <div className={styles.field}>
          <Label>Email or username</Label>
          <Input autoFocus placeholder="you@company.com" {...register('emailOrUsername')} />
          <FieldError message={errors.emailOrUsername?.message} />
        </div>
        <div className={styles.field}>
          <Label>Password</Label>
          <Input type="password" placeholder="••••••••" {...register('password')} />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" style={{ width: '100%' }} loading={login.isPending}>Sign in</Button>
      </form>
      <div className={styles.links}>
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to="/register">Create account</Link>
      </div>
      <div className={styles.demoBox}>
        <strong>Demo accounts (seed):</strong>
        admin@acme.dev · sara@acme.dev · mike@acme.dev — password: <code>Password123!</code>
      </div>
    </AuthShell>
  );
}
