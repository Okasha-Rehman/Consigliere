import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, checkInAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function CheckIn() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [checkInData, setCheckInData] = useState({
    pages_read: '',
    videos_watched: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.get();
      setDashboard(response.data);

      // If already checked in, redirect to completed
      if (response.data.has_checked_in_today) {
        navigate('/completed');
        return;
      }
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await checkInAPI.create({
        pages_read: parseInt(checkInData.pages_read) || 0,
        videos_watched: parseInt(checkInData.videos_watched) || 0,
        notes: checkInData.notes || null,
      });
      navigate('/completed');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit check-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center page-enter">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter">
      <header className="border-b border-consigliere-border bg-consigliere-charcoal/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="heading-3">Daily Check-In</h1>
          <button
            onClick={logout}
            className="text-sm font-sans tracking-wider uppercase text-consigliere-text-muted hover:text-consigliere-gold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {dashboard?.daily_quote && (
          <div className="mb-16 animate-fade-in">
            <div className="max-w-3xl mx-auto text-center">
              <blockquote className="quote-text mb-6">
                "{dashboard.daily_quote.quote_text}"
              </blockquote>
              {dashboard.daily_quote.author && (
                <p className="font-sans text-sm tracking-widest uppercase text-consigliere-text-muted">
                  — {dashboard.daily_quote.author}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h2 className="heading-2 mb-8 text-center">Today's Progress</h2>
            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckIn}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-sans font-medium mb-2 tracking-wider uppercase">
                    Pages Read
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={checkInData.pages_read}
                    onChange={(e) => setCheckInData({ ...checkInData, pages_read: e.target.value })}
                    className="input-field"
                    placeholder="0"
                    required
                  />
                  <p className="text-xs text-consigliere-text-muted mt-1">
                    Goal: {user?.pages_goal} pages
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-sans font-medium mb-2 tracking-wider uppercase">
                    Videos Watched
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={checkInData.videos_watched}
                    onChange={(e) => setCheckInData({ ...checkInData, videos_watched: e.target.value })}
                    className="input-field"
                    placeholder="0"
                    required
                  />
                  <p className="text-xs text-consigliere-text-muted mt-1">
                    Goal: {user?.videos_goal} videos
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-sans font-medium mb-2 tracking-wider uppercase">
                  Notes (Optional)
                </label>
                <textarea
                  value={checkInData.notes}
                  onChange={(e) => setCheckInData({ ...checkInData, notes: e.target.value })}
                  className="input-field resize-none"
                  rows="6"
                  placeholder="What did you learn today? Key insights, reflections..."
                />
                <p className="text-xs text-consigliere-text-muted mt-1">
                  Markdown supported
                </p>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Complete Check-In'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}