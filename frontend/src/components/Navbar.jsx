import React, { useState } from 'react';
import { Menu, Plus, User, LogIn, LogOut, Globe, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { AuthModal } from './AuthModal';

export function Navbar({ onOpenSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currency, setCurrency, supportedCurrencies } = useCurrency();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleCurrencyChange = (e) => {
    const val = e.target.value;
    setCurrency(val);
  };

  const isGuest = !user || user.is_guest;

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Quick Currency Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700">
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={currency}
              onChange={handleCurrencyChange}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              title="Change Active Currency Across All Views"
            >
              {supportedCurrencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Actions */}
          <button
            onClick={() => navigate('/invoices?new=1')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </button>

          <button
            onClick={() => navigate('/transactions?new=1')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* User / Authentication Status */}
          {isGuest ? (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600" />
              Sign In / Register
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition"
                title="Account Settings"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user.full_name}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email}</p>
                </div>
              </button>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
