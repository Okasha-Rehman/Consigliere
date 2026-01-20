import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, checkInAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
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
      setShowCheckIn(!response.data.has_checked_in_today);
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
      await loadDashboard();
      setCheckInData({ pages_read: '', videos_watched: '', notes: '' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit check-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const goalsMet = dashboard?.today_check_in && 
    dashboard.today_check_in.pages_read >= user.pages_goal &&
    dashboard.today_check_in.videos_watched >= user.videos_goal;

  return (
    <div className="min-h-screen page-enter">
      <header className="border-b border-consigliere-border bg-consigliere-charcoal/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="heading-3">Consigliere</h1>
          <div className="flex items-center gap-6">
            {user?.profile_picture && (
              <img 
                src={`/uploads/${user.profile_picture}`} 
                alt={user.username}
                className="profile-picture-small"
              />
            )}
            <span className="text-sm font-sans text-consigliere-gold">@{user?.username}</span>
            <button
              onClick={() => navigate('/analytics')}
              className="text-sm font-sans tracking-wider uppercase text-consigliere-gold hover:text-consigliere-gold-dark transition-colors"
            >
              Analytics
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="text-sm font-sans tracking-wider uppercase text-consigliere-gold hover:text-consigliere-gold-dark transition-colors"
            >
              Settings
            </button>
            <button
              onClick={logout}
              className="text-sm font-sans tracking-wider uppercase text-consigliere-text-muted hover:text-consigliere-gold transition-colors"
            >
              Sign Out
            </button>
          </div>
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

        <div className="mb-16 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="max-w-2xl mx-auto">
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

        <div className="divider"></div>

        {dashboard?.streak && (
          <div className="mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="max-w-2xl mx-auto">
              <div className="card text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <svg className="w-12 h-12 text-consigliere-gold streak-flame" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                  <div>
                    <div className="text-5xl font-serif font-light text-consigliere-gold mb-2">
                      {dashboard.streak.current_streak}
                    </div>
                    <div className="font-sans text-sm tracking-widest uppercase text-consigliere-text-muted">
                      Day Streak
                    </div>
                  </div>
                </div>
                <div className="divider my-6"></div>
                <div className="text-sm text-consigliere-text-muted">
                  Longest Streak: <span className="text-consigliere-gold font-semibold">{dashboard.streak.longest_streak} days</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          {showCheckIn ? (
            <div className="max-w-2xl mx-auto">
              <div className="card">
                <h2 className="heading-2 mb-8 text-center">Today's Check-In</h2>
                
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
                    {submitting ? 'Submitting...' : 'Submit Check-In'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="card">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 border-2 border-consigliere-gold rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-consigliere-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="heading-2 mb-4">Completed</h2>
                  <p className="body-text text-consigliere-text-muted mb-6">
                    You've checked in for today. Return tomorrow to continue your journey.
                  </p>
                  {goalsMet && (
                    <div className="inline-block bg-consigliere-dark-gray border border-consigliere-gold px-6 py-3">
                      <p className="text-sm font-sans tracking-wider uppercase text-consigliere-gold">
                        ✦ Daily Goals Achieved ✦
                      </p>
                    </div>
                  )}
                </div>

                {dashboard?.today_check_in && (
                  <>
                    <div className="divider"></div>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="stat-card">
                        <div className="text-3xl font-serif font-light text-consigliere-gold mb-2">
                          {dashboard.today_check_in.pages_read}
                        </div>
                        <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                          Pages Read
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="text-3xl font-serif font-light text-consigliere-gold mb-2">
                          {dashboard.today_check_in.videos_watched}
                        </div>
                        <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                          Videos Watched
                        </div>
                      </div>
                    </div>

                    {dashboard.today_check_in.notes && (
                      <div>
                        <h3 className="text-sm font-sans tracking-wider uppercase text-consigliere-text-muted mb-3">
                          Today's Notes
                        </h3>
                        <div className="bg-consigliere-dark-gray border border-consigliere-border p-6 markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {dashboard.today_check_in.notes}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
