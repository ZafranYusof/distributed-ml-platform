import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-400 flex items-center justify-center gap-2">
            <span className="text-4xl" aria-hidden="true">🧠</span>
            <span>DistML</span>
          </h1>
          <p className="text-dark-400 mt-2">Distributed Training Platform</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-dark-100 mb-6">Create Account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm text-dark-300 mb-1" htmlFor="reg-username">Username</label>
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
              <label className="block text-sm text-dark-300 mb-1" htmlFor="reg-email">Email</label>
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
              <label className="block text-sm text-dark-300 mb-1" htmlFor="reg-password">Password</label>
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
              <label className="block text-sm text-dark-300 mb-1" htmlFor="reg-confirm">Confirm Password</label>
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

          <p className="mt-4 text-center text-sm text-dark-400">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
