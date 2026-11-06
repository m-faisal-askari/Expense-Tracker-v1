import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Users,
  Briefcase,
  FileText,
  Repeat,
  ShieldAlert,
  Target,
  BarChart3,
  Settings,
  DollarSign,
  ShieldCheck
} from 'lucide-react';

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Financial Management',
    items: [
      { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
      { name: 'Income', path: '/income', icon: TrendingUp },
      { name: 'Expenses', path: '/expenses', icon: TrendingDown },
      { name: 'Accounts', path: '/accounts', icon: Wallet },
      { name: 'Budgets', path: '/budgets', icon: PieChart },
    ]
  },
  {
    title: 'Freelance Operations',
    items: [
      { name: 'Clients', path: '/clients', icon: Users },
      { name: 'Projects', path: '/projects', icon: Briefcase },
      { name: 'Invoices', path: '/invoices', icon: FileText },
      { name: 'Subscriptions', path: '/subscriptions', icon: Repeat },
    ]
  },
  {
    title: 'Financial Planning',
    items: [
      { name: 'Tax Reserve', path: '/taxes', icon: ShieldAlert },
      { name: 'Savings Goals', path: '/savings', icon: Target },
      { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    ]
  },
  {
    title: 'Account',
    items: [
      { name: 'Settings & Profile', path: '/settings', icon: Settings },
      { name: 'Privacy & Terms', path: '/privacy', icon: ShieldCheck },
    ]
  }
];

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* App Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <DollarSign className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">FreelanceFinance</h1>
            <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">Financial Ops</span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <h4 className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                {group.title}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-indigo-600/90 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                      `}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User indicator footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-xs text-slate-200">
              FL
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">Independent Freelancer</p>
              <p className="text-[10px] text-emerald-400 font-mono">● Production Engine</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
