import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = '₹'): string {
  return `${currency}${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(2)}Cr`;
  } else if (value >= 100000) {
    return `${(value / 100000).toFixed(2)}L`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'LOW':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'MEDIUM':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'HIGH':
      return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'EXTREME':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  }
}

export function getSignalColor(type: string): string {
  switch (type) {
    case 'BUY':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'SELL':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'HOLD':
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    default:
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  }
}
