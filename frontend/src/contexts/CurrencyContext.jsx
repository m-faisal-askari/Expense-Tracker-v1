import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import { convertAmount } from '../utils/formatters';

const CurrencyContext = createContext(null);

export const SUPPORTED_CURRENCIES = [
  { code: 'PKR', symbol: 'Rs.', label: 'PKR (Pakistani Rupee)' },
  { code: 'USD', symbol: '$', label: 'USD (US Dollar)' },
  { code: 'EUR', symbol: '€', label: 'EUR (Euro)' },
  { code: 'GBP', symbol: '£', label: 'GBP (British Pound)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (Canadian Dollar)' },
  { code: 'AUD', symbol: 'AU$', label: 'AUD (Australian Dollar)' },
];

export function CurrencyProvider({ children }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('ff_view_currency') || user?.base_currency || 'PKR';
  });

  useEffect(() => {
    if (user?.base_currency && !localStorage.getItem('ff_view_currency')) {
      setCurrencyState(user.base_currency);
    }
  }, [user?.base_currency]);

  const setCurrency = async (newCurr) => {
    const code = newCurr.toUpperCase();
    setCurrencyState(code);
    localStorage.setItem('ff_view_currency', code);
    
    // Invalidate dashboard and financial summaries so they re-calculate in this currency
    queryClient.invalidateQueries(['dashboardSummary']);
    queryClient.invalidateQueries(['dashboardCharts']);
    queryClient.invalidateQueries(['userProfile']);

    // Persist as user's profile base currency on backend asynchronously
    try {
      await api.put('/auth/profile', { base_currency: code });
    } catch (e) {
      // Quiet fail if guest / offline
    }
  };

  const convert = (amount, fromCurrency = 'USD') => {
    return convertAmount(amount, fromCurrency, currency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, supportedCurrencies: SUPPORTED_CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: 'PKR',
      setCurrency: () => {},
      convert: (amt) => parseFloat(amt || 0),
      supportedCurrencies: SUPPORTED_CURRENCIES
    };
  }
  return ctx;
}
