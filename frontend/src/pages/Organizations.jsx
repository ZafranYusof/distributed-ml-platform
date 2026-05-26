import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { Users } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import HowToUse from '../components/ui/HowToUse';

export default function Organizations() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [orgs, setOrgs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteOrgId, setInviteOrgId] = useState(null);
  const [acceptToken, setAcceptToken] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchOrgs(); }, []);

  const fetchOrgs = async () => {
    try {
      const res = await authFetch('/api/organizations');
      const data = await res.json();
      setOrgs(data);
    } catch (err) {
      toast.error('Failed to load organizations');
    }
    setLoading(false);
  };

  const createOrg = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setFormErrors({ name: 'Organization name is required' }); return; }
    try {
      await authFetch('/api/organizations', { method: 'POST', body: JSON.stringify({ name, description }) });
      setName(''); setDescription(''); setShowCreate(false); setFormErrors({});
      fetchOrgs();
      toast.success('Organization created');
    } catch (err) {
      toast.error('Failed to create organization');
    }
  };

  const inviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) { setFormErrors({ inviteEmail: 'Email is required' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) { setFormErrors({ inviteEmail: 'Invalid email format' }); return; }
    try {
      const res = await authFetch(`/api/organizations/${inviteOrgId}/invite`, {
        method: 'POST', body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      toast.success(`Invite sent! Token: ${data.token?.slice(0, 8)}...`);
      setInviteEmail(''); setInviteOrgId(null); setFormErrors({});
    } catch (err) {
      toast.error('Failed to send invite');
    }
  };

  const acceptInvite = async (e) => {
    e.preventDefault();
    try {
      await authFetch('/api/organizations/invite/accept', {
        method: 'POST', body: JSON.stringify({ token: acceptToken })
      });
      setAcceptToken('');
      fetchOrgs();
      toast.success('Invite accepted! You joined the organization.');
    } catch (err) {
      toast.error('Failed to accept invite');
    }
  };

  const removeMember = async (orgId, userId) => {
    const confirmed = await confirm({
      title: 'Remove Member',
      message: 'Are you sure you want to remove this member from the organization?',
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await authFetch(`/api/organizations/${orgId}/members/${userId}`, { method: 'DELETE' });
      fetchOrgs();
      toast.success('Member removed');
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      <HowToUse pageId="organizations" steps={[
      'Create an organization.',
      'Invite team members by email.',
      'Assign roles (Admin/Member/Viewer).',
      'Share resources within the org.'
      ]} />
      {ConfirmDialog}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <p className="text-purple-300/50 mt-1">Multi-tenant team workspaces</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" aria-label="Create new organization">
          Create Organization
        </button>
      </div>

      {/* Accept Invite */}
      <div className="card p-4">
        <form onSubmit={acceptInvite} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-purple-300/50" htmlFor="invite-token">Have an invite token?</label>
            <input
              id="invite-token"
              value={acceptToken}
              onChange={e => setAcceptToken(e.target.value)}
              placeholder="Paste invite token..."
              className="w-full mt-1 input-field"
            />
          </div>
          <button type="submit" disabled={!acceptToken} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            Accept
          </button>
        </form>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="card border-primary-500/30 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">Create Organization</h2>
          <form onSubmit={createOrg} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="org-name">Organization Name</label>
              <input
                id="org-name"
                value={name}
                onChange={e => { setName(e.target.value); setFormErrors({}); }}
                placeholder="Organization name"
                required
                className={`w-full input-field ${formErrors.name ? 'input-error' : ''}`}
                aria-invalid={!!formErrors.name}
              />
              {formErrors.name && <p className="field-error">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="org-desc">Description</label>
              <textarea
                id="org-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full input-field"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Invite Modal */}
      {inviteOrgId && (
        <div className="card border-green-500/30 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">Invite Member</h2>
          <form onSubmit={inviteMember} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="invite-email">Email Address</label>
              <input
                id="invite-email"
                value={inviteEmail}
                onChange={e => { setInviteEmail(e.target.value); setFormErrors({}); }}
                placeholder="Email address"
                type="email"
                required
                className={`w-full input-field ${formErrors.inviteEmail ? 'input-error' : ''}`}
                aria-invalid={!!formErrors.inviteEmail}
              />
              {formErrors.inviteEmail && <p className="field-error">{formErrors.inviteEmail}</p>}
            </div>
            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="invite-role">Role</label>
              <select id="invite-role" value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full input-field">
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Send Invite</button>
              <button type="button" onClick={() => setInviteOrgId(null)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Org List */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : orgs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No organizations yet"
          description="Create an organization to collaborate with your team, or accept an invite to join one."
          actionLabel="Create Organization"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid gap-4">
          {orgs.map(org => (
            <div key={org._id} className="card card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{org.name}</h3>
                  {org.description && <p className="text-purple-300/50 text-sm mt-1">{org.description}</p>}
                  <p className="text-xs text-purple-300/40 mt-2">{org.members?.length || 0} members</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setInviteOrgId(org._id)}
                    className="px-3 py-1.5 text-xs bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
                    aria-label={`Invite member to ${org.name}`}
                  >
                    Invite
                  </button>
                  <button
                    onClick={() => setSelectedOrg(selectedOrg === org._id ? null : org._id)}
                    className="px-3 py-1.5 text-xs bg-purple-500/15 text-purple-200/70 rounded-lg hover:bg-purple-500/20 transition-colors"
                    aria-expanded={selectedOrg === org._id}
                  >
                    {selectedOrg === org._id ? 'Hide' : 'Members'}
                  </button>
                </div>
              </div>
              {selectedOrg === org._id && (
                <div className="mt-4 border-t border-purple-500/20 pt-4 animate-fade-in">
                  <div className="space-y-2">
                    {org.members?.map((m, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-dark-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                            <span className="text-purple-400 text-xs font-bold">
                              {m.userId?.username?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-white">{m.userId?.username || 'Unknown'}</p>
                            <p className="text-xs text-purple-300/40">{m.userId?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            m.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' :
                            m.role === 'member' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-dark-600 text-purple-200/70'
                          }`}>{m.role}</span>
                          {m.role !== 'admin' && (
                            <button
                              onClick={() => removeMember(org._id, m.userId?._id)}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors"
                              aria-label={`Remove ${m.userId?.username || 'member'}`}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
