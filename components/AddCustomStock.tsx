'use client';

import { useState } from 'react';
import { Plus, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AddCustomStockProps {
  onStockAdded?: () => void;
}

export default function AddCustomStock({ onStockAdded }: AddCustomStockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    instrumentKey: '',
    name: '',
    shortName: '',
    sector: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/stocks/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze stock');
      }

      setSuccess(data.cached 
        ? 'Stock found in cache!' 
        : 'Stock analyzed successfully!'
      );

      // Reset form
      setFormData({
        instrumentKey: '',
        name: '',
        shortName: '',
        sector: ''
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        if (onStockAdded) {
          onStockAdded();
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to analyze stock');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 flex items-center gap-2 z-50"
      >
        <Plus className="w-6 h-6" />
        <span className="font-medium">Add Custom Stock</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md z-50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-6 h-6 text-primary-500" />
            Add Custom Stock
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Instrument Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Instrument Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="instrumentKey"
              value={formData.instrumentKey}
              onChange={handleChange}
              placeholder="e.g., NSE_EQ|INE002A01018"
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: NSE_EQ|ISIN_CODE
            </p>
          </div>

          {/* Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Name (Optional)
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Reliance Industries Limited"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Short Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Short Name (Optional)
            </label>
            <input
              type="text"
              name="shortName"
              value={formData.shortName}
              onChange={handleChange}
              placeholder="e.g., Reliance"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Sector (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sector (Optional)
            </label>
            <input
              type="text"
              name="sector"
              value={formData.sector}
              onChange={handleChange}
              placeholder="e.g., Oil & Gas"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.instrumentKey}
            className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Analyze Stock
              </>
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            <strong className="text-gray-400">How to find instrument keys:</strong>
            <br />
            1. Visit <a href="https://assets.upstox.com/market-quote/instruments/exchange/complete.csv.gz" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">Upstox Instruments List</a>
            <br />
            2. Search for your stock
            <br />
            3. Use the format: NSE_EQ|ISIN_CODE
          </p>
        </div>
      </div>
    </>
  );
}