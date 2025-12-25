import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../utils/api';
import { formatPassUpForCopy } from '../utils/formatters';
import StockTicker from '../components/StockTicker';

const DISPOSITIONS = [
  { value: 'WSMSNT', label: 'WSMSNT', color: 'bg-wsmsnt hover:bg-gray-600' },
  { value: 'TIHU', label: 'TIHU', color: 'bg-tihu hover:bg-yellow-600' },
  { value: 'INT', label: 'INT', color: 'bg-int hover:bg-blue-700' },
  { value: 'WARM', label: 'WARM', color: 'bg-warm hover:bg-orange-600' },
  { value: 'HOT', label: 'HOT', color: 'bg-hot hover:bg-red-600' },
];

const REBUTTALS = [
  { key: 'whereCallingFrom', label: 'Where are you calling from?' },
  { key: 'whatCompany', label: 'What company are you calling from?' },
  { key: 'phoneNumber', label: 'Where did you get my phone number?' },
  { key: 'firmLocation', label: 'Where is your firm located?' },
  { key: 'whyProviding', label: 'Why are you providing this info?' },
  { key: 'howMakeMoney', label: 'How do you guys make money?' },
];

function PassUpForm() {
  const navigate = useNavigate();
  const agentId = localStorage.getItem('agentId');

  const [stockPrice, setStockPrice] = useState(null);
  const [formData, setFormData] = useState({
    ticker: 'QTZM',
    leadName: '',
    interestedIn: '',
    agreedToSMS: false,
    disposition: '',
    notes: ''
  });
  const [rebuttals, setRebuttals] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch current stock price
    api.getStockQuote('QTZM').then(quote => {
      setStockPrice(quote.price.toFixed(2));
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.leadName.trim()) {
      toast.error('Please enter lead name');
      return;
    }

    if (!formData.disposition) {
      toast.error('Please select a disposition');
      return;
    }

    setSubmitting(true);

    try {
      const passUp = await api.createPassUp({
        agentId,
        ...formData,
        tickerPrice: stockPrice,
        rebuttals
      });

      toast.success('Pass-up submitted successfully!');
      
      // Reset form
      setFormData({
        ticker: 'QTZM',
        leadName: '',
        interestedIn: '',
        agreedToSMS: false,
        disposition: '',
        notes: ''
      });
      setRebuttals({});

      // Navigate to dashboard after short delay
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      toast.error('Failed to submit pass-up: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPreview = async () => {
    const previewData = {
      ...formData,
      date: new Date().toISOString(),
      tickerPrice: stockPrice,
      rebuttals
    };
    const text = formatPassUpForCopy(previewData);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied preview to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-xl sm:text-2xl font-bold mb-3">New Pass-Up</h1>
          <StockTicker />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Ticker */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Ticker Symbol
            </label>
            <input
              type="text"
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
              className="input"
              maxLength={10}
            />
          </div>

          {/* Lead Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Lead Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.leadName}
              onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
              className="input"
              placeholder="John Doe"
              required
            />
          </div>

          {/* Interested In */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Interested In
            </label>
            <input
              type="text"
              value={formData.interestedIn}
              onChange={(e) => setFormData({ ...formData, interestedIn: e.target.value })}
              className="input"
              placeholder="e.g., AI Technology, Biotech, Energy..."
            />
          </div>

          {/* Agreed to SMS */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="agreedToSMS"
              checked={formData.agreedToSMS}
              onChange={(e) => setFormData({ ...formData, agreedToSMS: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="agreedToSMS" className="text-sm font-medium cursor-pointer">
              Agreed to SMS
            </label>
          </div>

          {/* Disposition */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Disposition <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              {DISPOSITIONS.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, disposition: value })}
                  className={`py-3 px-2 sm:px-4 rounded-lg font-semibold text-white text-sm sm:text-base min-h-12 transition-all ${
                    formData.disposition === value
                      ? `${color} ring-4 ring-offset-2 ring-blue-500 dark:ring-offset-dark-bg scale-105`
                      : `${color} opacity-60 hover:opacity-100`
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rebuttals */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Rebuttals Handled
            </label>
            <div className="space-y-2">
              {REBUTTALS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={rebuttals[key] || false}
                    onChange={(e) => setRebuttals({ ...rebuttals, [key]: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input resize-none text-base"
              rows={4}
              placeholder="Additional notes about the call..."
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting || !formData.leadName || !formData.disposition}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1 text-base py-3"
            >
              {submitting ? 'Submitting...' : 'Submit Pass-Up'}
            </button>
            <button
              type="button"
              onClick={handleCopyPreview}
              className="btn-secondary flex items-center justify-center gap-2 order-1 sm:order-2 text-base py-3 px-3 sm:px-4"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="sm:hidden">Copy</span>
              <span className="hidden sm:inline">Copy Preview</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PassUpForm;