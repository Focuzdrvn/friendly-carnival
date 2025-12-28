import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download,
  Calendar,
  TrendingDown,
  PieChart,
  DollarSign
} from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    'Venue',
    'Food & Beverages',
    'Prizes',
    'Marketing',
    'Swag & Merchandise',
    'Technology',
    'Staff',
    'Transportation',
    'Equipment',
    'Miscellaneous'
  ];

  const paymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'];

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: '',
    vendor_name: '',
    receipt_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, [currentPage, filterCategory, dateRange]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20
      });

      if (filterCategory) params.append('category', filterCategory);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      const response = await api.get(`/expenses?${params}`);
      setExpenses(response.data.expenses);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      alert('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      const response = await api.get(`/expenses/stats?${params}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, formData);
        alert('Expense updated successfully');
      } else {
        await api.post('/expenses', formData);
        alert('Expense added successfully');
      }
      
      closeModal();
      fetchExpenses();
      fetchStats();
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert(error.response?.data?.error || 'Failed to save expense');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await api.delete(`/expenses/${id}`);
      alert('Expense deleted successfully');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense');
    }
  };

  const openModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        payment_method: expense.payment_method || '',
        vendor_name: expense.vendor_name || '',
        receipt_number: expense.receipt_number || '',
        notes: expense.notes || ''
      });
    } else {
      setEditingExpense(null);
      setFormData({
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: '',
        vendor_name: '',
        receipt_number: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredExpenses = expenses.filter(expense => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      expense.description.toLowerCase().includes(search) ||
      expense.category.toLowerCase().includes(search) ||
      expense.vendor_name?.toLowerCase().includes(search)
    );
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Vendor', 'Receipt #', 'Notes'];
    const rows = filteredExpenses.map(exp => [
      exp.date,
      exp.category,
      exp.description,
      exp.amount,
      exp.payment_method || '',
      exp.vendor_name || '',
      exp.receipt_number || '',
      exp.notes || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && !expenses.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-space-blue"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Expense Tracker</h1>
          <p className="text-gray-400">Manage and track all hackathon expenses</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-space-gradient text-white rounded-lg hover:opacity-90 transition"
        >
          <Plus size={20} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-space-gray border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                <TrendingDown className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Total Expenses</h3>
            <p className="text-2xl font-bold text-white">₹{stats.totalExpenses.toLocaleString()}</p>
          </div>

          <div className="bg-space-gray border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <DollarSign className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Expense Count</h3>
            <p className="text-2xl font-bold text-white">{stats.expenseCount}</p>
          </div>

          <div className="bg-space-gray border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <PieChart className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Top Category</h3>
            <p className="text-xl font-bold text-white">
              {stats.categoryBreakdown[0]?.category || 'N/A'}
            </p>
            {stats.categoryBreakdown[0] && (
              <p className="text-sm text-gray-400">₹{stats.categoryBreakdown[0].amount.toLocaleString()}</p>
            )}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {stats && stats.categoryBreakdown.length > 0 && (
        <div className="bg-space-gray border border-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Expense by Category</h3>
          <div className="space-y-3">
            {stats.categoryBreakdown.map((cat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm">{cat.category}</span>
                    <span className="text-gray-400 text-sm">{cat.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-space-blue h-2 rounded-full transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-white font-semibold ml-4 min-w-[100px] text-right">
                  ₹{cat.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-space-gray border border-gray-800 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search expenses..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-space-gray border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                    No expenses found. Add your first expense to get started.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-800 transition">
                    <td className="px-6 py-4 text-sm text-white">{expense.date}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-space-blue bg-opacity-20 text-space-blue rounded text-xs">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{expense.description}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">₹{parseFloat(expense.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{expense.payment_method || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{expense.vendor_name || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(expense)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-space-gray border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Amount (₹) *</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Date *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Payment Method</label>
                    <select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
                    >
                      <option value="">Select payment method</option>
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Vendor Name</label>
                    <input
                      type="text"
                      name="vendor_name"
                      value={formData.vendor_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Receipt Number</label>
                    <input
                      type="text"
                      name="receipt_number"
                      value={formData.receipt_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Description *</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-space-blue"
                  />
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-space-gradient text-white rounded-lg hover:opacity-90 transition"
                  >
                    {editingExpense ? 'Update' : 'Add'} Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
