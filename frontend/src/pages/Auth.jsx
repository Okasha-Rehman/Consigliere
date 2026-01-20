import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Auth() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const redirectPath = await login(formData.email, formData.password);
        navigate(redirectPath || '/dashboard');
      } else {
        // Register
        await register(formData.email, formData.username, formData.password);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ email: '', username: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 page-enter">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="heading-1 mb-4">Consigliere</h1>
          <p className="body-text text-consigliere-text-muted">
            Your trusted advisor in daily learning
          </p>
        </div>

        <div className="card">
          <h2 className="heading-3 mb-6 text-center">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-sans font-medium mb-2 tracking-wider uppercase">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <div className="mb-4">
                <label className="block text-sm font-sans font-medium mb-2 tracking-wider uppercase">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="username"
                  required
                  disabled={loading}
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                  title="Only letters, numbers, and underscores allowed"
                />
                <p className="text-xs text-consigliere-text-muted mt-1">
                  3-30 characters, alphanumeric and underscores only
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-sans font-medium mb-2 tracking-wider uppercase">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
              {!isLogin && (
                <p className="text-xs text-consigliere-text-muted mt-1">
                  Minimum 6 characters
                </p>
              )}
            </div>

            {!isLogin && (
              <div className="mb-6">
                <label className="block text-sm font-sans font-medium mb-2 tracking-wider uppercase">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full mb-4"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="divider my-6"></div>

          <div className="text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-consigliere-gold hover:text-consigliere-gold-dark transition-colors"
            >
              {isLogin ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-consigliere-text-muted">
          <p>Simple. Disciplined. Effective.</p>
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <div className="card">
            <h3 className="heading-3 mb-6 text-center">About Goals</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-consigliere-gold mt-1">•</span>
                <p className="text-consigliere-text-muted">Goals help track your daily progress</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-consigliere-gold mt-1">•</span>
                <p className="text-consigliere-text-muted">Missing goals does NOT reset your streak</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-consigliere-gold mt-1">•</span>
                <p className="text-consigliere-text-muted">Goals are personal targets for self-improvement</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-consigliere-gold mt-1">•</span>
                <p className="text-consigliere-text-muted">Adjust them as your learning pace changes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
