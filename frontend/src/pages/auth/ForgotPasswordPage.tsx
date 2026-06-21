import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { AuthShell } from './AuthShell';
import { getErrorMessage } from '@/services/api';
import styles from './AuthShell.module.scss';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success('If that email exists, a reset code was sent.');
      setStage('reset');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    setLoading(true);
    try {
      await authService.resetPassword({ email, otp, password });
      toast.success('Password reset. Please sign in.');
      navigate('/login');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a 6-digit code.">
      {stage === 'request' ? (
        <div className={styles.form}>
          <div className={styles.field}>
            <Label>Email</Label>
            <Input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <Button style={{ width: '100%' }} onClick={requestOtp} loading={loading} disabled={!email}>Send reset code</Button>
        </div>
      ) : (
        <div className={styles.form}>
          <div className={styles.field}>
            <Label>Reset code</Label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} />
          </div>
          <div className={styles.field}>
            <Label>New password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <Button style={{ width: '100%' }} onClick={reset} loading={loading} disabled={otp.length !== 6 || password.length < 8}>Reset password</Button>
        </div>
      )}
      <p className={styles.linkCenter}><Link to="/login">Back to sign in</Link></p>
    </AuthShell>
  );
}
