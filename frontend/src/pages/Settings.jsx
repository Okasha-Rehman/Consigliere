import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { userAPI } from '../utils/api';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [goals, setGoals] = useState({
    pages_goal: user?.pages_goal || 10,
    videos_goal: user?.videos_goal || 1,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSaveGoals = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);

    try {
      const response = await userAPI.updateGoals(goals);
      updateUser(response.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update goals');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await userAPI.uploadProfilePicture(file);
      const updatedUser = await userAPI.getProfile();
      updateUser(updatedUser.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload picture');
    } finally {
      setUploading(false);
    }
  };

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
          <h1 className="heading-3">Settings</h1>
          <div className="w-6"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h2 className="heading-2 mb-6">Profile</h2>
          <div className="card">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                {user?.profile_picture ? (
                  <img 
                    src={`/uploads/${user.profile_picture}`} 
                    alt={user.username}
                    className="profile-picture"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-consigliere-dark-gray border-3 border-consigliere-gold flex items-center justify-center">
                    <span className="text-3xl text-consigliere-gold">
                      {user?.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-consigliere-gold text-consigliere-black rounded-full p-2 cursor-pointer hover:bg-consigliere-gold-dark transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <div className="flex-1">
                <div className="mb-3">
                  <div className="text-sm font-sans tracking-wider uppercase text-consigliere-text-muted mb-1">
                    Username
                  </div>
                  <div className="text-consigliere-gold text-xl">@{user?.username}</div>
                </div>
                <div>
                  <div className="text-sm font-sans tracking-wider uppercase text-consigliere-text-muted mb-1">
                    Email
                  </div>
                  <div className="text-consigliere-gold">{user?.email}</div>
                </div>
              </div>
            </div>
            <div className="divider"></div>
            <div>
              <label className="block text-sm font-sans font-medium mb-2 tracking-wider uppercase text-consigliere-text-muted">
                Member Since
              </label>
              <div className="text-consigliere-gold">
                {user?.created_at && new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="heading-2 mb-6">Daily Goals</h2>
          <div className="card">
            {error && (
              <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 mb-6">
                {error}
              </div>
            )}

            {saved && (
              <div className="bg-green-900/20 border border-green-800 text-green-400 px-4 py-3 mb-6">
                Goals updated successfully
              </div>
            )}

            <form onSubmit={handleSaveGoals}>
              <div className="mb-6">
                <label className="block text-sm font-sans font-medium mb-2 tracking-wider uppercase">
                  Pages Per Day
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={goals.pages_goal}
                  onChange={(e) => setGoals({ ...goals, pages_goal: parseInt(e.target.value) })}
                  className="input-field"
                  required
                />
                <p className="text-xs text-consigliere-text-muted mt-1">
                  Your daily reading target
                </p>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-sans font-medium mb-2 tracking-wider uppercase">
                  Videos Per Day
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={goals.videos_goal}
                  onChange={(e) => setGoals({ ...goals, videos_goal: parseInt(e.target.value) })}
                  className="input-field"
                  required
                />
                <p className="text-xs text-consigliere-text-muted mt-1">
                  Your daily video learning target
                </p>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            <div className="divider"></div>

            <div className="text-sm text-consigliere-text-muted">
              <p className="mb-3">
                <strong className="text-consigliere-gold">About Goals:</strong>
              </p>
              <ul className="space-y-2 ml-4">
                <li>• Goals help track your daily progress</li>
                <li>• Missing goals does NOT reset your streak</li>
                <li>• Goals are personal targets for self-improvement</li>
                <li>• Adjust them as your learning pace changes</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
