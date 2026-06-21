import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input, Label, FieldError } from '@/components/ui/Input';
import { registerSchema, type RegisterForm } from '@/utils/validators';
import { AuthShell } from './AuthShell';
import styles from './AuthShell.module.scss';

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <AuthShell title="Create your account" subtitle="Start managing projects in minutes.">
      <form onSubmit={handleSubmit((v) => registerUser.mutate(v))} className={styles.form}>
        <div className={styles.field}>
          <Label>Display name</Label>
          <Input autoFocus placeholder="Jane Developer" {...register('displayName')} />
          <FieldError message={errors.displayName?.message} />
        </div>
        <div className={styles.field}>
          <Label>Username</Label>
          <Input placeholder="jane" {...register('username')} />
          <FieldError message={errors.username?.message} />
        </div>
        <div className={styles.field}>
          <Label>Email</Label>
          <Input type="email" placeholder="jane@company.com" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div className={styles.field}>
          <Label>Password</Label>
          <Input type="password" placeholder="At least 8 characters" {...register('password')} />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" style={{ width: '100%' }} loading={registerUser.isPending}>Create account</Button>
      </form>
      <p className={styles.linkCenter}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
