import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit2, Trash2, FileText, Eye, Code } from 'lucide-react';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlBody: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate._id}`, formData);
        alert('Template updated successfully!');
      } else {
        await api.post('/templates', formData);
        alert('Template created successfully!');
      }

      fetchTemplates();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return;

    try {
      await api.delete(`/templates/${id}`);
      alert('Template deleted successfully!');
      fetchTemplates();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete template');
    }
  };

  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        htmlBody: template.htmlBody
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        subject: '',
        htmlBody: defaultTemplate
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', htmlBody: '' });
  };

  const defaultTemplate = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 10px;">
  <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="color: #667eea; margin-bottom: 20px;">🚀 Singularity Hackathon</h2>
    <p style="color: #333; line-height: 1.6;">Dear {{leader_name}},</p>
    <p style="color: #333; line-height: 1.6;">Your message content here...</p>
    <div style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 5px 0; color: #333;"><strong>Team:</strong> {{team_name}}</p>
      <p style="margin: 5px 0; color: #333;"><strong>Ticket:</strong> {{ticket_type}}</p>
    </div>
    <p style="color: #333; line-height: 1.6;">Best regards,<br>Singularity Team</p>
  </div>
</div>`;

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Email Templates</h1>
          <p className="text-gray-400">Create and manage email templates</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-space-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-space-blue"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-space-gray border border-gray-800 rounded-xl p-12 text-center">
          <FileText className="mx-auto text-gray-600 mb-4" size={48} />
          <p className="text-gray-400 mb-4">No templates yet</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-space-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template._id}
              className="bg-space-gray border border-gray-800 rounded-xl p-6 hover:border-space-blue transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-400">{template.subject}</p>
                </div>
                <FileText className="text-space-blue" size={24} />
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <button
                  onClick={() => setPreviewTemplate(template)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <Eye size={16} />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => openModal(template)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
                >
                  <Edit2 size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(template._id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-space-gray border border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors"
                  placeholder="Welcome Email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors"
                  placeholder="Welcome to Singularity - {{team_name}}"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  HTML Body
                  <span className="text-xs ml-2 text-gray-500">
                    (Use placeholders: {'{{team_name}}'}, {'{{leader_name}}'}, {'{{ticket_type}}'}, {'{{amount}}'}...)
                  </span>
                </label>
                <textarea
                  value={formData.htmlBody}
                  onChange={(e) => setFormData({ ...formData, htmlBody: e.target.value })}
                  className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors font-mono text-sm"
                  rows={12}
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-space-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingTemplate ? 'Update' : 'Create'} Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-space-gray border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{previewTemplate.name}</h2>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-1">Subject: {previewTemplate.subject}</p>
            </div>
            <div 
              className="p-6"
              dangerouslySetInnerHTML={{ 
                __html: previewTemplate.htmlBody
                  .replace(/{{team_name}}/g, 'Sample Team')
                  .replace(/{{leader_name}}/g, 'John Doe')
                  .replace(/{{ticket_type}}/g, 'Standard')
                  .replace(/{{amount}}/g, '500')
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;
