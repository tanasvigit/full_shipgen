import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save } from 'lucide-react';
import Header from '../../components/layout/Header';
import { StatusBadge } from '../../components/ui';
import { listPricing, updatePricing } from '../../api/pricing';
import type { PricingRule } from '../../types';

export default function PricingPage() {
  const { onToggleSidebar } = useOutletContext<{ onToggleSidebar: () => void }>();
  const [pricing, setPricing] = useState<PricingRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listPricing()
      .then(setPricing)
      .catch(() => setPricing([]));
  }, []);

  const updateField = (id: string, field: keyof PricingRule, value: number) => {
    setPricing((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  return (
    <>
      <Header title="Pricing" subtitle="Configure parking rates by vehicle category" onToggleSidebar={onToggleSidebar} />
      <main className="p-6 lg:p-8 space-y-6 flex-1" data-testid="pricing-page">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pricing.map((rule) => (
            <div key={rule.id} className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-lg hover:shadow-slate-100/50 transition-all" data-testid="pricing-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-slate-800 text-lg">{rule.category}</h3>
                <StatusBadge
                  label={rule.isActive ? 'Active' : 'Inactive'}
                  variant={rule.isActive ? 'success' : 'danger'}
                  dot
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    value={rule.basePrice}
                    onChange={(e) => updateField(rule.id, 'basePrice', +e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="pricing-base-price-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Per Hour (₹)</label>
                    <input
                      type="number"
                      value={rule.perHour}
                      onChange={(e) => updateField(rule.id, 'perHour', +e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="pricing-per-hour-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Max Daily (₹)</label>
                    <input
                      type="number"
                      value={rule.maxDaily}
                      onChange={(e) => updateField(rule.id, 'maxDaily', +e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="pricing-max-daily-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              setIsSaving(true);
              Promise.all(
                pricing.map((rule) =>
                  updatePricing(rule.id, {
                    basePrice: rule.basePrice,
                    perHour: rule.perHour,
                    maxDaily: rule.maxDaily,
                    isActive: rule.isActive,
                  }),
                ),
              )
                .then(setPricing)
                .finally(() => setIsSaving(false));
            }}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-all"
            data-testid="pricing-save-button"
          >
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </main>
    </>
  );
}
