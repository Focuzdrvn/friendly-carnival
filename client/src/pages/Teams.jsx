import { useState, useEffect } from 'react';
import api from '../utils/api';
import Papa from 'papaparse';
import {
  Search,
  Upload,
  Filter,
  CheckCircle,
  XCircle,
  Users,
  Mail,
  Phone,
  FileText,
  Download,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null); // Track which team is being verified
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    team_name: '',
    leader_name: '',
    leader_email: '',
    ticket_type: 'Early Bird',
    amount: '',
    members: [
      { name: '', year_of_study: '', department: '', prn: '', email: '', phone: '' }
    ]
  });

  useEffect(() => {
    fetchTeams();
  }, [page, search, filter]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const params = { page, search };
      if (filter !== 'all') {
        params.verified = filter === 'verified';
      }
      const response = await api.get('/teams', { params });
      setTeams(response.data.teams);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (teamId) => {
    if (!confirm('Verify this team and send invoice?')) return;

    setVerifying(teamId);
      // Log token for debugging
      console.log('🔐 Token used for verification:', localStorage.getItem('token'));
    try {
      // Call backend verification endpoint (now returns a simple success message)
      await api.post(`/teams/${teamId}/verify`);
      alert('✅ Payment verified and invoice sent successfully!');
      // Optimistically update UI: mark the team as verified locally
      setTeams(prevTeams =>
        prevTeams.map(team =>
          team.id === teamId ? { ...team, is_verified: true } : team
        )
      );
    } catch (error) {
      console.error('❌ Verification error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Verification failed';
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setVerifying(null);
    }
  };

  const viewTeamDetails = async (team) => {
    try {
      const response = await api.get(`/teams/${team.id}`);
      setSelectedTeam(response.data.team);
      setMembers(response.data.members);
    } catch (error) {
      console.error('Failed to fetch team details:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/teams/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadMessage(
        `✅ Success: ${response.data.successful} teams added${
          response.data.failed > 0 ? `, ${response.data.failed} failed` : ''
        }`
      );
      fetchTeams();
    } catch (error) {
      setUploadMessage('❌ Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        team_name: 'Team Alpha',
        leader_name: 'John Doe',
        leader_email: 'john@example.com',
        ticket_type: 'Early Bird',
        amount: '500',
        member1_name: 'Jane Smith',
        member1_year: '3rd Year',
        member1_department: 'Computer Science',
        member1_roll: 'CS101',
        member1_email: 'jane@example.com',
        member1_phone: '1234567890'
      }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_teams.csv';
    a.click();
  };

  const handleAddMember = () => {
    setFormData({
      ...formData,
      members: [...formData.members, { name: '', year_of_study: '', department: '', prn: '', email: '', phone: '' }]
    });
  };

  const handleRemoveMember = (index) => {
    if (formData.members.length > 1) {
      const newMembers = formData.members.filter((_, i) => i !== index);
      setFormData({ ...formData, members: newMembers });
    }
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...formData.members];
    newMembers[index][field] = value;
    setFormData({ ...formData, members: newMembers });
  };

  const handleSubmitTeam = async (e) => {
    e.preventDefault();
    
    if (!formData.team_name || !formData.leader_name || !formData.leader_email || !formData.amount) {
      alert('Please fill all required team fields');
      return;
    }

    // Validate at least one member with all required fields
    const validMembers = formData.members.filter(m => m.name && m.email && m.phone && m.prn);
    if (validMembers.length === 0) {
      alert('Please add at least one team member with all required fields (name, email, phone, PRN)');
      return;
    }
    
    // Check if any member has more than 4 members
    if (validMembers.length > 4) {
      alert('A team cannot have more than 4 members');
      return;
    }

    try {
      setUploading(true);
      await api.post('/teams/add-manual', {
        team: {
          team_name: formData.team_name,
          leader_name: formData.leader_name,
          leader_email: formData.leader_email,
          ticket_type: formData.ticket_type,
          amount: parseFloat(formData.amount)
        },
        members: validMembers
      });

      setUploadMessage('✅ Team added successfully!');
      setShowAddForm(false);
      setFormData({
        team_name: '',
        leader_name: '',
        leader_email: '',
        ticket_type: 'Early Bird',
        amount: '',
        members: [{ name: '', year_of_study: '', department: '', prn: '', email: '', phone: '' }]
      });
      fetchTeams();
    } catch (error) {
      setUploadMessage('❌ Failed to add team: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Teams Management</h1>
          <p className="text-gray-400">View and verify team registrations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={downloadSampleCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download size={20} />
            <span>Sample CSV</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-space-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={20} />
            <span>Add Team</span>
          </button>
          <label className="flex items-center space-x-2 px-4 py-2 bg-space-gradient text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
            <Upload size={20} />
            <span>{uploading ? 'Uploading...' : 'Upload CSV'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {uploadMessage && (
        <div className={`mb-4 p-3 rounded-lg border ${
          uploadMessage.startsWith('✅')
            ? 'bg-green-500/10 border-green-500/50 text-green-400'
            : 'bg-red-500/10 border-red-500/50 text-red-400'
        }`}>
          {uploadMessage}
        </div>
      )}

      {/* Filters */}
      <div className="bg-space-gray border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams, leaders, emails..."
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400" size={20} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors"
            >
              <option value="all">All Teams</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teams Table */}
      <div className="bg-space-gray border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-space-blue"></div>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400">No teams found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Team Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Leader</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Ticket Type</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {teams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{team.team_name}</td>
                      <td className="px-6 py-4 text-gray-300">{team.leader_name}</td>
                      <td className="px-6 py-4 text-gray-300">{team.leader_email}</td>
                      <td className="px-6 py-4 text-gray-300">{team.ticket_type}</td>
                      <td className="px-6 py-4 text-gray-300">₹{team.amount}</td>
                      <td className="px-6 py-4">
                        {team.is_verified ? (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">
                            <CheckCircle size={16} />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-sm">
                            <XCircle size={16} />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => viewTeamDetails(team)}
                            className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                          >
                            View
                          </button>
                          {!team.is_verified && (
                            <button
                              onClick={() => handleVerify(team.id)}
                              disabled={verifying === team.id}
                              className={`px-3 py-1 text-sm rounded transition-colors ${
                                verifying === team.id
                                  ? 'bg-gray-500 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-500'
                              } text-white`}
                            >
                              {verifying === team.id ? 'Verifying...' : 'Verify'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 p-4 border-t border-gray-800">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Team Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-space-gray border border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Add New Team</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitTeam} className="p-6 space-y-6">
              {/* Team Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Team Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Team Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.team_name}
                      onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                      className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Leader Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.leader_name}
                      onChange={(e) => setFormData({ ...formData, leader_name: e.target.value })}
                      className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Leader Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.leader_email}
                      onChange={(e) => setFormData({ ...formData, leader_email: e.target.value })}
                      className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ticket Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.ticket_type}
                      onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value })}
                      className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors"
                      required
                    >
                      <option value="Early Bird">Early Bird</option>
                      <option value="Proper Price">Proper Price</option>
                      <option value="Late Lateef">Late Lateef</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-space-blue transition-colors"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Team Members</h3>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-space-gradient text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                  >
                    <Plus size={16} />
                    <span>Add Member</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.members.map((member, index) => (
                    <div key={index} className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">Member {index + 1}</span>
                        {formData.members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-space-blue transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Year of Study</label>
                          <select
                            value={member.year_of_study}
                            onChange={(e) => handleMemberChange(index, 'year_of_study', e.target.value)}
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-space-blue transition-colors"
                          >
                            <option value="">Select Year</option>
                            <option value="FE">FE</option>
                            <option value="SE">SE</option>
                            <option value="TE">TE</option>
                            <option value="BE">BE</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Department</label>
                          <select
                            value={member.department}
                            onChange={(e) => handleMemberChange(index, 'department', e.target.value)}
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-space-blue transition-colors"
                          >
                            <option value="">Select Department</option>
                            <option value="Computer Engineering">Computer Engineering</option>
                            <option value="IT">IT</option>
                            <option value="EXTC">EXTC</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            PRN <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={member.prn}
                            onChange={(e) => handleMemberChange(index, 'prn', e.target.value)}
                            placeholder="Permanent Registration Number"
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-space-blue transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-space-blue transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={member.phone}
                            onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                            className="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-space-blue transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 bg-space-gradient text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Adding Team...' : 'Add Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-space-gray border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{selectedTeam.team_name}</h2>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Team Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Team Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Users size={18} className="text-gray-500" />
                    <span>Leader: {selectedTeam.leader_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Mail size={18} className="text-gray-500" />
                    <span>{selectedTeam.leader_email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <FileText size={18} className="text-gray-500" />
                    <span>Ticket: {selectedTeam.ticket_type} - ₹{selectedTeam.amount}</span>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Team Members ({members.length})</h3>
                {members.length === 0 ? (
                  <p className="text-gray-400">No members added yet</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="p-4 bg-gray-900 rounded-lg">
                        <p className="text-white font-medium mb-1">{member.name}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                          <span>{member.department}</span>
                          <span>{member.year_of_study}</span>
                          <span>PRN: {member.prn}</span>
                          <span className="flex items-center space-x-1">
                            <Phone size={14} />
                            <span>{member.phone}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
