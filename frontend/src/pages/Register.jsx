import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!username.trim()) errors.username = 'Username is required';
    else if (username.length < 3) errors.username = 'Username must be at least 3 characters';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(username, email, password);
      toast.success('Account created! Welcome aboard.');
      navigate('/');
    } catch (err) {
      setError(err.message);
      toast.error('Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D0221 0%, #1A0533 30%, #2d1b69 60%, #4F46E5 100%)' }}>
      {/* Neural network background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(124,58,237,0.3) 0%, transparent 50%)',
      }} />
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(139,92,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.4) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Brain className="w-10 h-10 text-purple-400" aria-hidden="true" />
            <span className="text-gradient">DistML</span>
          </h1>
          <p className="text-purple-300/60 mt-2">Distributed Training Platform</p>
        </div>

        <div className="bg-dark-800/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 shadow-glow-purple-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="reg-username">Username</label>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setFieldErrors(prev => ({ ...prev, username: '' })); }}
                className={`input-field w-full ${fieldErrors.username ? 'input-error' : ''}`}
                placeholder="johndoe"
                required
                aria-invalid={!!fieldErrors.username}
                autoComplete="username"
              />
              {fieldErrors.username && <p className="field-error">{fieldErrors.username}</p>}
            </div>

            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })); }}
                className={`input-field w-full ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
                required
                aria-invalid={!!fieldErrors.email}
                autoComplete="email"
              />
              {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); }}
                className={`input-field w-full ${fieldErrors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                required
                aria-invalid={!!fieldErrors.password}
                autoComplete="new-password"
              />
              {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                className={`input-field w-full ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
                required
                aria-invalid={!!fieldErrors.confirmPassword}
                autoComplete="new-password"
              />
              {fieldErrors.confirmPassword && <p className="field-error">{fieldErrors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-purple-300/50">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-accent-blue hover:text-blue-300 transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
