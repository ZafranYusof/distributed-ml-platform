import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useConfirmDialog } from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { Webhook } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function Webhooks() {
  const { authFetch } = useAuth();
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [webhooks, setWebhooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', type: 'custom', events: [] });
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const EVENT_OPTIONS = ['training_complete', 'drift_alert', 'deploy', 'error'];

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const res = await authFetch('/api/integrations/webhooks');
      if (res.ok) setWebhooks(await res.json());
    } catch {
      toast.error('Failed to load webhooks');
    }
    setLoading(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.url.trim()) errors.url = 'URL is required';
    else if (!/^https?:\/\/.+/.test(form.url)) errors.url = 'Must be a valid URL (http:// or https://)';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const res = await authFetch('/api/integrations/webhooks', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const webhook = await res.json();
        setWebhooks(prev => [webhook, ...prev]);
        setForm({ name: '', url: '', type: 'custom', events: [] });
        setFormErrors({});
        setShowForm(false);
        toast.success('Webhook created');
      }
    } catch {
      toast.error('Failed to create webhook');
    }
  };

  const handleTest = async (id) => {
    setTesting(id);
    try {
      await authFetch(`/api/integrations/webhooks/${id}/test`, { method: 'POST' });
      toast.success('Test payload sent');
    } catch {
      toast.error('Test failed');
    }
    setTimeout(() => setTesting(null), 2000);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Webhook',
      message: 'Are you sure you want to delete this webhook? You will stop receiving notifications.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await authFetch(`/api/integrations/webhooks/${id}`, { method: 'DELETE' });
      setWebhooks(prev => prev.filter(w => w._id !== id));
      toast.success('Webhook deleted');
    } catch {
      toast.error('Failed to delete webhook');
    }
  };

  const toggleEvent = (event) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhooks</h1>
          <p className="text-purple-300/50 text-sm mt-1">Configure Slack, Discord, or custom webhook notifications</p>
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">🔔</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Webhooks</h1>
            <p className="text-purple-300/50 text-sm">Configure Slack, Discord, or custom webhook notifications</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
          aria-label="Add new webhook"
        >
          + Add Webhook
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-dark-800/40 border border-purple-500/20 rounded-xl p-5 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">New Webhook</h2>
          <form onSubmit={handleCreate} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-purple-200/70 mb-1" htmlFor="wh-name">Name</label>
                <input
                  id="wh-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm(prev => ({ ...prev, name: e.target.value })); setFormErrors(prev => ({ ...prev, name: '' })); }}
                  placeholder="My Slack Webhook"
                  className={`input-field w-full ${formErrors.name ? 'input-error' : ''}`}
                  aria-invalid={!!formErrors.name}
                />
                {formErrors.name && <p className="field-error">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm text-purple-200/70 mb-1" htmlFor="wh-type">Type</label>
                <select
                  id="wh-type"
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                  className="input-field w-full"
                >
                  <option value="slack">Slack</option>
                  <option value="discord">Discord</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-purple-200/70 mb-1" htmlFor="wh-url">Webhook URL</label>
              <input
                id="wh-url"
                type="url"
                value={form.url}
                onChange={(e) => { setForm(prev => ({ ...prev, url: e.target.value })); setFormErrors(prev => ({ ...prev, url: '' })); }}
                placeholder="https://hooks.slack.com/services/..."
                className={`input-field w-full ${formErrors.url ? 'input-error' : ''}`}
                aria-invalid={!!formErrors.url}
              />
              {formErrors.url && <p className="field-error">{formErrors.url}</p>}
            </div>
            <div>
              <label className="block text-sm text-purple-200/70 mb-2">Events to notify</label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Event selection">
                {EVENT_OPTIONS.map(event => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(event)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      form.events.includes(event)
                        ? 'bg-primary-500/10 border-primary-500/30 text-purple-400'
                        : 'bg-purple-500/15 border-purple-500/30 text-purple-200/70 hover:border-dark-500'
                    }`}
                    aria-pressed={form.events.includes(event)}
                  >
                    {event.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Create Webhook
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title="No webhooks configured"
          description="Add a webhook to get notified about platform events like training completion, drift alerts, and deployments."
          actionLabel="Add Webhook"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-3">
          {webhooks.map(webhook => (
            <div key={webhook._id} className="card card-hover p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg" aria-hidden="true">
                    {webhook.type === 'slack' ? '💬' : webhook.type === 'discord' ? '🎮' : '🔗'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{webhook.name}</p>
                    <p className="text-xs text-purple-300/50 truncate max-w-xs">{webhook.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${webhook.active ? 'bg-green-400' : 'bg-dark-500'}`} aria-label={webhook.active ? 'Active' : 'Inactive'}></span>
                  <button
                    onClick={() => handleTest(webhook._id)}
                    className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                      testing === webhook._id
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'border-purple-500/30 text-purple-200/70 hover:border-dark-500'
                    }`}
                    aria-label={`Test ${webhook.name}`}
                  >
                    {testing === webhook._id ? '✓ Sent!' : 'Test'}
                  </button>
                  <button
                    onClick={() => handleDelete(webhook._id)}
                    className="px-3 py-1 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                    aria-label={`Delete ${webhook.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {webhook.events?.length > 0 && (
                <div className="flex gap-1.5 mt-2 ml-9">
                  {webhook.events.map(event => (
                    <span key={event} className="text-xs bg-purple-500/15 text-purple-200/70 px-2 py-0.5 rounded">
                      {event.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
