import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, DollarSign, CheckCircle, Clock, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTeams: 0,
    verifiedTeams: 0,
    pendingTeams: 0,
    totalRevenue: 0,
    totalMembers: 0
  });
  const [expenseStats, setExpenseStats] = useState({
    totalExpenses: 0,
    expenseCount: 0
  });
  const [incomeStats, setIncomeStats] = useState({
    totalIncome: 0,
    incomeCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [teamsResponse, expensesResponse, incomeResponse] = await Promise.all([
        api.get('/teams/stats/overview'),
        api.get('/expenses/stats').catch(() => ({ data: { totalExpenses: 0, expenseCount: 0 } })),
        api.get('/income/stats').catch(() => ({ data: { totalIncome: 0, incomeCount: 0 } }))
      ]);
      
      setStats(teamsResponse.data);
      setExpenseStats(expensesResponse.data);
      setIncomeStats(incomeResponse.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = stats.totalRevenue + incomeStats.totalIncome;
  const estimatedProfit = totalIncome - expenseStats.totalExpenses;

  const statCards = [
    {
      title: 'Total Teams',
      value: stats.totalTeams,
      icon: Users,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Verified Teams',
      value: stats.verifiedTeams,
      icon: CheckCircle,
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Pending Verification',
      value: stats.pendingTeams,
      icon: Clock,
      color: 'bg-yellow-500',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Registration Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Additional Income',
      value: `₹${incomeStats.totalIncome.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-cyan-500',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    {
      title: 'Total Income',
      value: `₹${totalIncome.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Expenses',
      value: `₹${expenseStats.totalExpenses.toLocaleString()}`,
      icon: TrendingDown,
      color: 'bg-red-500',
      gradient: 'from-red-500 to-red-600'
    },
    {
      title: 'Estimated Profit',
      value: `₹${estimatedProfit.toLocaleString()}`,
      icon: PiggyBank,
      color: estimatedProfit >= 0 ? 'bg-emerald-500' : 'bg-orange-500',
      gradient: estimatedProfit >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-orange-500 to-orange-600'
    }
  ];

  if (loading) {4
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-space-blue"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome to Singularity Hackathon Admin Suite</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-space-gray border border-gray-800 rounded-xl p-6 hover:border-space-blue transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-space-gray border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/teams"
              className="block p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-white font-medium mb-1">Manage Teams</h3>
              <p className="text-gray-400 text-sm">View and verify team registrations</p>
            </a>
            <a
              href="/income"
              className="block p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-white font-medium mb-1">Track Income</h3>
              <p className="text-gray-400 text-sm">Record sponsorships, merchandise & donations</p>
            </a>
            <a
              href="/expenses"
              className="block p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-white font-medium mb-1">Track Expenses</h3>
              <p className="text-gray-400 text-sm">Record and manage hackathon expenses</p>
            </a>
            <a
              href="/bulk-email"
              className="block p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-white font-medium mb-1">Send Bulk Emails</h3>
              <p className="text-gray-400 text-sm">Communicate with all teams at once</p>
            </a>
          </div>
        </div>

        <div className="bg-space-gray border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">System Info</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <span className="text-gray-400">Verification Rate</span>
              <span className="text-white font-medium">
                {stats.totalTeams > 0
                  ? Math.round((stats.verifiedTeams / stats.totalTeams) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <span className="text-gray-400">Average Team Size</span>
              <span className="text-white font-medium">
                {stats.totalTeams > 0
                  ? Math.round(stats.totalMembers / stats.totalTeams)
                  : 0} members
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <span className="text-gray-400">Average Revenue/Team</span>
              <span className="text-white font-medium">
                ₹{stats.verifiedTeams > 0
                  ? Math.round(stats.totalRevenue / stats.verifiedTeams)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <span className="text-gray-400">Average Expense/Team</span>
              <span className="text-white font-medium">
                ₹{stats.totalTeams > 0
                  ? Math.round(expenseStats.totalExpenses / stats.totalTeams)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <span className="text-gray-400">Profit Margin</span>
              <span className={`font-medium ${estimatedProfit >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                {totalIncome > 0
                  ? ((estimatedProfit / totalIncome) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
