import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export interface DealFormData {
  acquirerTicker: string;
  targetTicker: string;
  dealValue: number;
  premium: number;
  paymentType: "cash" | "stock" | "mixed";
  crossBorder: boolean;
  sameIndustry: boolean;
}

interface DealInputFormProps {
  onSubmit: (data: DealFormData) => void;
  isLoading?: boolean;
}

// Popular tickers and company names to show as recommendations
const POPULAR_COMPANIES = [
  // Tech & Software
  { ticker: "MSFT", name: "Microsoft Corp." },
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "NVDA", name: "NVIDIA Corp." },
  { ticker: "AMZN", name: "Amazon.com Inc." },
  { ticker: "GOOG", name: "Alphabet Inc. (Google)" },
  { ticker: "META", name: "Meta Platforms (Facebook)" },
  { ticker: "TSLA", name: "Tesla Inc." },
  { ticker: "NFLX", name: "Netflix Inc." },
  { ticker: "CRM", name: "Salesforce Inc." },
  { ticker: "ADBE", name: "Adobe Inc." },
  { ticker: "AVGO", name: "Broadcom Inc." },
  { ticker: "AMD", name: "Advanced Micro Devices" },
  { ticker: "QCOM", name: "Qualcomm Inc." },
  { ticker: "INTC", name: "Intel Corp." },
  { ticker: "CSCO", name: "Cisco Systems" },
  { ticker: "ORCL", name: "Oracle Corp." },
  { ticker: "IBM", name: "IBM Corp." },
  { ticker: "VMW", name: "VMware Inc." },
  { ticker: "ATVI", name: "Activision Blizzard" },
  { ticker: "TWTR", name: "Twitter Inc." },
  { ticker: "FGM", name: "Figma" },
  { ticker: "SPLK", name: "Splunk Inc." },
  
  // Financials
  { ticker: "JPM", name: "JPMorgan Chase" },
  { ticker: "BAC", name: "Bank of America" },
  { ticker: "MS", name: "Morgan Stanley" },
  { ticker: "GS", name: "Goldman Sachs Group" },
  { ticker: "WFC", name: "Wells Fargo" },
  { ticker: "C", name: "Citigroup Inc." },
  { ticker: "V", name: "Visa Inc." },
  { ticker: "MA", name: "Mastercard Inc." },
  { ticker: "AXP", name: "American Express" },
  { ticker: "PYPL", name: "PayPal Holdings" },

  // Healthcare & Bio
  { ticker: "UNH", name: "UnitedHealth Group" },
  { ticker: "JNJ", name: "Johnson & Johnson" },
  { ticker: "LLY", name: "Eli Lilly & Co." },
  { ticker: "ABBV", name: "AbbVie Inc." },
  { ticker: "MRK", name: "Merck & Co." },
  { ticker: "PFE", name: "Pfizer Inc." },
  { ticker: "ABT", name: "Abbott Laboratories" },
  { ticker: "BMY", name: "Bristol Myers Squibb" },
  { ticker: "AMGN", name: "Amgen Inc." },
  { ticker: "GILD", name: "Gilead Sciences" },
  { ticker: "SGEN", name: "Seagen Inc." },
  { ticker: "HZNP", name: "Horizon Therapeutics" },

  // Energy & Industrials
  { ticker: "XOM", name: "Exxon Mobil Corp." },
  { ticker: "CVX", name: "Chevron Corp." },
  { ticker: "COP", name: "ConocoPhillips" },
  { ticker: "SLB", name: "Schlumberger" },
  { ticker: "OXY", name: "Occidental Petroleum" },
  { ticker: "HES", name: "Hess Corp." },
  { ticker: "PXD", name: "Pioneer Natural Resources" },
  { ticker: "BA", name: "Boeing Co." },
  { ticker: "GE", name: "General Electric" },
  { ticker: "CAT", name: "Caterpillar Inc." },
  { ticker: "HON", name: "Honeywell" },
  { ticker: "LMT", name: "Lockheed Martin" },
  { ticker: "AJRD", name: "Aerojet Rocketdyne" },

  // Retail & Consumer
  { ticker: "WMT", name: "Walmart Inc." },
  { ticker: "COST", name: "Costco Wholesale" },
  { ticker: "HD", name: "Home Depot" },
  { ticker: "NKE", name: "Nike Inc." },
  { ticker: "SBUX", name: "Starbucks" },
  { ticker: "KO", name: "Coca-Cola" },
  { ticker: "PEP", name: "PepsiCo" },
  { ticker: "MCD", name: "McDonald's" },
  { ticker: "DIS", name: "Walt Disney" },
  { ticker: "SAVE", name: "Spirit Airlines" },
  { ticker: "JBLU", name: "JetBlue Airways" }
];

export function DealInputForm({ onSubmit, isLoading = false }: DealInputFormProps) {
  const [formData, setFormData] = useState<DealFormData>({
    acquirerTicker: "AAPL",
    targetTicker: "NVDA",
    dealValue: 5000,
    premium: 30,
    paymentType: "mixed",
    crossBorder: false,
    sameIndustry: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Dropdown UI state
  const [showAcquirerDropdown, setShowAcquirerDropdown] = useState(false);
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);

  // Filter recommendations based on user typing
  const filteredAcquirers = useMemo(() => {
    const query = formData.acquirerTicker.trim().toUpperCase();
    if (!query) return [];
    return POPULAR_COMPANIES.filter(
      (c) => c.ticker.startsWith(query) || c.name.toUpperCase().includes(query)
    ).slice(0, 5); // Limit to top 5 suggestions
  }, [formData.acquirerTicker]);

  const filteredTargets = useMemo(() => {
    const query = formData.targetTicker.trim().toUpperCase();
    if (!query) return [];
    return POPULAR_COMPANIES.filter(
      (c) => c.ticker.startsWith(query) || c.name.toUpperCase().includes(query)
    ).slice(0, 5); // Limit to top 5 suggestions
  }, [formData.targetTicker]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.acquirerTicker.trim()) {
      newErrors.acquirerTicker = "Acquirer ticker is required";
    }
    if (!formData.targetTicker.trim()) {
      newErrors.targetTicker = "Target ticker is required";
    }
    if (formData.dealValue <= 0) {
      newErrors.dealValue = "Deal value must be greater than 0";
    }
    if (formData.premium < 0 || formData.premium > 200) {
      newErrors.premium = "Premium must be between 0 and 200%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    } else {
      toast.error("Please fix the errors in the form");
    }
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle>Score a Deal</CardTitle>
        <CardDescription>
          Enter the deal terms to receive a Deal Quality Score with SHAP-based explanations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tickers Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Acquirer Ticker */}
            <div className="space-y-2 relative">
              <Label htmlFor="acquirer">Acquirer Ticker</Label>
              <Input
                id="acquirer"
                placeholder="e.g., MSFT"
                value={formData.acquirerTicker}
                onChange={(e) => {
                  setFormData({ ...formData, acquirerTicker: e.target.value.toUpperCase() });
                  setShowAcquirerDropdown(true);
                }}
                onFocus={() => setShowAcquirerDropdown(true)}
                // Use a short delay on blur to allow option selection click to register first
                onBlur={() => setTimeout(() => setShowAcquirerDropdown(false), 200)}
                className={errors.acquirerTicker ? "border-destructive" : ""}
                autoComplete="off"
              />
              {errors.acquirerTicker && (
                <p className="text-sm text-destructive">{errors.acquirerTicker as string}</p>
              )}
              
              {/* Acquirer Autocomplete Dropdown */}
              {showAcquirerDropdown && filteredAcquirers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredAcquirers.map((company) => (
                    <div
                      key={company.ticker}
                      onClick={() => {
                        setFormData({ ...formData, acquirerTicker: company.ticker });
                        setShowAcquirerDropdown(false);
                      }}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors flex justify-between items-center"
                    >
                      <span className="font-semibold">{company.ticker}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[70%]">{company.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Target Ticker */}
            <div className="space-y-2 relative">
              <Label htmlFor="target">Target Ticker</Label>
              <Input
                id="target"
                placeholder="e.g., SAVE"
                value={formData.targetTicker}
                onChange={(e) => {
                  setFormData({ ...formData, targetTicker: e.target.value.toUpperCase() });
                  setShowTargetDropdown(true);
                }}
                onFocus={() => setShowTargetDropdown(true)}
                // Use a short delay on blur to allow option selection click to register first
                onBlur={() => setTimeout(() => setShowTargetDropdown(false), 200)}
                className={errors.targetTicker ? "border-destructive" : ""}
                autoComplete="off"
              />
              {errors.targetTicker && (
                <p className="text-sm text-destructive">{errors.targetTicker as string}</p>
              )}

              {/* Target Autocomplete Dropdown */}
              {showTargetDropdown && filteredTargets.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredTargets.map((company) => (
                    <div
                      key={company.ticker}
                      onClick={() => {
                        setFormData({ ...formData, targetTicker: company.ticker });
                        setShowTargetDropdown(false);
                      }}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors flex justify-between items-center"
                    >
                      <span className="font-semibold">{company.ticker}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[70%]">{company.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deal Value and Premium Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dealValue">Deal Value (USD Millions)</Label>
              <Input
                id="dealValue"
                type="number"
                placeholder="e.g., 5000"
                value={formData.dealValue === 0 ? "" : formData.dealValue}
                onChange={(e) =>
                  setFormData({ ...formData, dealValue: parseFloat(e.target.value) || 0 })
                }
                className={errors.dealValue ? "border-destructive" : ""}
              />
              {errors.dealValue && (
                <p className="text-sm text-destructive">{errors.dealValue as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="premium">Premium Offered (%)</Label>
              <Input
                id="premium"
                type="number"
                placeholder="e.g., 30"
                value={formData.premium === 0 ? "" : formData.premium}
                onChange={(e) =>
                  setFormData({ ...formData, premium: parseFloat(e.target.value) || 0 })
                }
                className={errors.premium ? "border-destructive" : ""}
              />
              {errors.premium && (
                <p className="text-sm text-destructive">{errors.premium as string}</p>
              )}
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-3">
            <Label>Payment Type</Label>
            <RadioGroup value={formData.paymentType} onValueChange={(value) =>
              setFormData({ ...formData, paymentType: value as "cash" | "stock" | "mixed" })
            }>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="font-normal cursor-pointer">Cash</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stock" id="stock" />
                <Label htmlFor="stock" className="font-normal cursor-pointer">Stock</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed" className="font-normal cursor-pointer">Mixed (Cash + Stock)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="crossBorder" className="font-normal">Cross-Border Deal</Label>
              <Switch
                id="crossBorder"
                checked={formData.crossBorder}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, crossBorder: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sameIndustry" className="font-normal">Same Industry</Label>
              <Switch
                id="sameIndustry"
                checked={formData.sameIndustry}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, sameIndustry: checked })
                }
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Scoring..." : "Get Deal Quality Score"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
