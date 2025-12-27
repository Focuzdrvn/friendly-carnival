import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Mail, Send, FileText, Users, CheckCircle, AlertCircle } from 'lucide-react';

const BulkEmail = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [formData, setFormData] = useState({
    subject: '',
    body: ''
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find(t => t._id === templateId);
      if (template) {
        setFormData({
          subject: template.subject,
          body: template.htmlBody
        });
      }
    }
  };

  const handleSend = async () => {
    if (!customMode && !selectedTemplate) {
      alert('Please select a template');
      return;
    }

    if (customMode && (!formData.subject || !formData.body)) {
      alert('Please fill in subject and body');
      return;
    }

    if (!confirm(`Send email to all ${verifiedOnly ? 'verified' : ''} teams?`)) {
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const payload = {
        verifiedOnly,
        ...(customMode
          ? { customSubject: formData.subject, customBody: formData.body }
          : { templateId: selectedTemplate })
      };

      const response = await api.post('/email/bulk-send', payload);
      setResult(response.data);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const defaultCustomBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 10px;">
  <div style="background: white; padding: 30px; border-radius: 8px;">
    <h2 style="color: #667eea;">🚀 Singularity Hackathon</h2>
    <p style="color: #333; line-height: 1.6;">Dear {{leader_name}},</p>
    <p style="color: #333; line-height: 1.6;">Your message here...</p>
  </div>
</div>`;

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Bulk Email</h1>
        <p className="text-gray-400">Send emails to all teams at once</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Configuration */}
        <div className="lg:col-span-2">
          <div className="bg-space-gray border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Email Configuration</h2>

            {/* Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Composition Mode
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCustomMode(false)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    !customMode
                      ? 'border-space-blue bg-space-blue/10 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <FileText size={20} />
                  <span>Use Template</span>
                </button>
                <button
                  onClick={() => setCustomMode(true)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    customMode
                      ? 'border-space-blue bg-space-blue/10 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Mail size={20} />
                  <span>Custom Email</span>
                </button>
              </div>
            </div>

            {/* Template Selection */}
            {!customMode && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Select Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors"
                >
                  <option value="">-- Choose a template --</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom/Preview */}
            {(customMode || selectedTemplate) && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors"
                    placeholder="Email subject..."
                    disabled={!customMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Body (HTML)
                    {customMode && (
                      <span className="text-xs ml-2 text-gray-500">
                        Use placeholders: team_name, leader_name, etc.
                      </span>
                    )}
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors font-mono text-sm"
                    rows={12}
                    disabled={!customMode}
                  />
                </div>

                {customMode && !formData.body && (
                  <button
                    onClick={() => setFormData({ ...formData, body: defaultCustomBody })}
                    className="text-sm text-space-blue hover:text-space-purple transition-colors"
                  >
                    Load default template
                  </button>
                )}
              </div>
            )}

            {/* Recipient Filter */}
            <div className="mt-6 p-4 bg-gray-900 rounded-lg">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-5 h-5 text-space-blue bg-gray-800 border-gray-700 rounded focus:ring-space-blue"
                />
                <div>
                  <span className="text-white font-medium">Send to verified teams only</span>
                  <p className="text-sm text-gray-400">
                    Uncheck to include all teams regardless of verification status
                  </p>
                </div>
              </label>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || (!customMode && !selectedTemplate)}
              className="w-full mt-6 flex items-center justify-center space-x-2 px-6 py-3 bg-space-gradient text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
              <span>{sending ? 'Sending...' : 'Send Bulk Email'}</span>
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="mt-6 bg-space-gray border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Send Results</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle size={20} />
                    <span>Successful</span>
                  </div>
                  <span className="text-green-400 font-bold">{result.successful}</span>
                </div>

                {result.failed > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-400">
                      <AlertCircle size={20} />
                      <span>Failed</span>
                    </div>
                    <span className="text-red-400 font-bold">{result.failed}</span>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Error Details:</p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {result.errors.map((err, idx) => (
                        <div key={idx} className="p-2 bg-gray-900 rounded text-xs">
                          <p className="text-red-400">{err.team}: {err.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-space-gray border border-gray-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="text-space-blue" size={24} />
              <h3 className="text-lg font-semibold text-white">How It Works</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-400">
              <p>1. Choose between a template or custom email</p>
              <p>2. Customize subject and body if needed</p>
              <p>3. Select recipient filter (verified only or all)</p>
              <p>4. Send to all teams at once</p>
            </div>
          </div>

          <div className="bg-space-gray border border-gray-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="text-space-purple" size={24} />
              <h3 className="text-lg font-semibold text-white">Available Placeholders</h3>
            </div>
            <div className="space-y-2 text-sm">
              <code className="block p-2 bg-gray-900 rounded text-green-400">
                {'{{team_name}}'}
              </code>
              <code className="block p-2 bg-gray-900 rounded text-green-400">
                {'{{leader_name}}'}
              </code>
              <code className="block p-2 bg-gray-900 rounded text-green-400">
                {'{{leader_email}}'}
              </code>
              <code className="block p-2 bg-gray-900 rounded text-green-400">
                {'{{ticket_type}}'}
              </code>
              <code className="block p-2 bg-gray-900 rounded text-green-400">
                {'{{amount}}'}
              </code>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-yellow-400">
                <p className="font-medium mb-1">Important</p>
                <p>Bulk emails are sent with rate limiting (100ms delay between emails) to avoid spam filters.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEmail;
