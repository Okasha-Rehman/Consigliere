import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, checkInAPI } from '../utils/api';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [weeklyRes, monthlyRes, historyRes] = await Promise.all([
        analyticsAPI.getWeekly(),
        analyticsAPI.getMonthly(),
        checkInAPI.getHistory(30),
      ]);
      setWeekly(weeklyRes.data);
      setMonthly(monthlyRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter">
      <header className="border-b border-consigliere-border bg-consigliere-charcoal/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-consigliere-gold hover:text-consigliere-gold-dark transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="heading-3">Analytics</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {weekly && (
          <div className="mb-12">
            <h2 className="heading-2 mb-6">This Week</h2>
            <div className="card">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-serif font-light text-consigliere-gold mb-2">
                    {weekly.days_checked_in}
                  </div>
                  <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                    Days Active
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-serif font-light text-consigliere-gold mb-2">
                    {weekly.total_pages}
                  </div>
                  <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                    Total Pages
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-serif font-light text-consigliere-gold mb-2">
                    {weekly.total_videos}
                  </div>
                  <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                    Total Videos
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-serif font-light text-consigliere-gold mb-2">
                    {weekly.goal_success_rate}%
                  </div>
                  <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                    Goals Met
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {monthly && (
          <div className="mb-12">
            <h2 className="heading-2 mb-6">This Month</h2>
            <div className="card">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-serif font-light text-consigliere-gold mb-2">
                    {monthly.total_learning_days}
                  </div>
                  <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                    Learning Days
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-serif font-light text-consigliere-gold mb-2">
                    {monthly.average_pages_per_day}
                  </div>
                  <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                    Avg Pages/Day
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-serif font-light text-consigliere-gold mb-2">
                    {monthly.average_videos_per_day}
                  </div>
                  <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                    Avg Videos/Day
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-serif font-light text-consigliere-gold mb-2">
                    {monthly.best_streak}
                  </div>
                  <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                    Best Streak
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="mb-12">
            <h2 className="heading-2 mb-6">Progress Charts</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card">
                <h3 className="heading-3 mb-6">Pages Read Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                    <XAxis 
                      dataKey="check_in_date" 
                      stroke="#8a8a8a"
                      tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                    />
                    <YAxis stroke="#8a8a8a" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '8px' }}
                      labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pages_read" 
                      stroke="#d4c5a9" 
                      strokeWidth={2}
                      dot={{ fill: '#d4c5a9', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 className="heading-3 mb-6">Videos Watched Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={history.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                    <XAxis 
                      dataKey="check_in_date" 
                      stroke="#8a8a8a"
                      tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                    />
                    <YAxis stroke="#8a8a8a" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '8px' }}
                      labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                    />
                    <Bar dataKey="videos_watched" fill="#d4c5a9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="heading-2 mb-6">Recent Check-Ins</h2>
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="card text-center py-12">
                <p className="body-text text-consigliere-text-muted">
                  No check-ins yet. Start your journey today.
                </p>
              </div>
            ) : (
              history.map((checkIn) => (
                <div key={checkIn.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="heading-3 mb-1">
                        {format(new Date(checkIn.check_in_date), 'MMMM d, yyyy')}
                      </div>
                      <div className="text-xs font-sans tracking-wider uppercase text-consigliere-text-muted">
                        {format(new Date(checkIn.check_in_date), 'EEEE')}
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-serif font-light text-consigliere-gold">
                          {checkIn.pages_read}
                        </div>
                        <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                          Pages
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-serif font-light text-consigliere-gold">
                          {checkIn.videos_watched}
                        </div>
                        <div className="text-xs font-sans tracking-widest uppercase text-consigliere-text-muted">
                          Videos
                        </div>
                      </div>
                    </div>
                  </div>
                  {checkIn.notes && (
                    <div className="bg-consigliere-dark-gray border border-consigliere-border p-4 text-sm">
                      <p className="text-consigliere-text-muted line-clamp-3">
                        {checkIn.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
