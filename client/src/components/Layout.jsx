import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Mail, FileText, LogOut, Sparkles } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();

  const navLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/teams', icon: Users, label: 'Teams' },
    { to: '/templates', icon: FileText, label: 'Templates' },
    { to: '/bulk-email', icon: Mail, label: 'Bulk Email' },
  ];

  return (
    <div className="min-h-screen bg-space-dark">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-space-gray border-r border-gray-800 z-10">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <Sparkles className="text-space-blue" size={32} />
            <h1 className="text-2xl font-bold text-white">Singularity</h1>
          </div>

          <nav className="space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-space-gradient text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <link.icon size={20} />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-400">
              <p className="font-medium text-white">{user?.email}</p>
              <p className="text-xs">Admin</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
