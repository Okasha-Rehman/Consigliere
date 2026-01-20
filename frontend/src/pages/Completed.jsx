import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Completed() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.get();
      setDashboard(response.data);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center page-enter">
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
          <h1 className="heading-3">Check-In Complete</h1>
          <button
            onClick={logout}
            className="text-sm font-sans tracking-wider uppercase text-consigliere-text-muted hover:text-consigliere-gold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="card text-center">
          <div className="w-20 h-20 border-2 border-consigliere-gold rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-consigliere-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="heading-2 mb-4">Great job today!</h2>
          <p className="body-text text-consigliere-text-muted mb-6">
            You've successfully completed your daily check-in. Your streak continues!
          </p>

          {goalsMet && (
            <div className="inline-block bg-consigliere-dark-gray border border-consigliere-gold px-6 py-3 mb-6">
              <p className="text-sm font-sans tracking-wider uppercase text-consigliere-gold">
                ✦ Daily Goals Achieved ✦
              </p>
            </div>
          )}

          {dashboard?.streak && (
            <div className="mb-6">
              <div className="text-4xl font-serif font-light text-consigliere-gold mb-2">
                {dashboard.streak.current_streak}
              </div>
              <div className="text-sm font-sans tracking-widest uppercase text-consigliere-text-muted">
                Day Streak
              </div>
            </div>
          )}

          {dashboard?.today_check_in && (
            <>
              <div className="divider my-6"></div>

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
                  <div className="bg-consigliere-dark-gray border border-consigliere-border p-4 text-sm text-left">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {dashboard.today_check_in.notes}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-8">
            <p className="text-sm text-consigliere-text-muted">
              Come back tomorrow to continue your learning journey!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}