import { DealFormData } from "@/components/DealInputForm";

// API Base URL - configurable in production via VITE_API_URL
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface ShapFeatureImpact {
  feature: string;
  display_name: string;
  actual_value: number;
  shap_value: number;
}

export interface ShapExplanation {
  base_value: number;
  features: ShapFeatureImpact[];
}

export interface AcquirerMetrics {
  name: string;
  sector: string;
  industry: string;
  revenue_billion: number;
  ebitda_billion: number;
  leverage: number;
  operating_margin: number;
}

export interface DealScoreResponse {
  score: number;
  raw_features: Record<string, number>;
  acquirer_metrics: AcquirerMetrics;
  explanation: ShapExplanation;
}

export interface HistoricalDealRaw {
  acquirer: string;
  target: string;
  target_ticker?: string;
  announcement_date?: string;
  deal_value_billion: number;
  premium?: number;
  payment_type: "cash" | "stock" | "mixed";
  cross_border: number;
  same_industry: number;
  success: number;
  acquirer_sector?: string;
  acquirer_industry?: string;
  acquirer_country?: string;
  acquirer_revenue?: number;
  acquirer_ebitda?: number;
  acquirer_operating_margin?: number;
  acquirer_leverage?: number;
  acquirer_car?: number;
  target_car?: number;
}

/**
 * Score a hypothetical M&A deal using the FastAPI backend.
 */
export async function scoreDeal(data: DealFormData): Promise<DealScoreResponse> {
  const payload = {
    acquirer: data.acquirerTicker,
    target: data.targetTicker,
    // Convert USD Millions from form to USD Billions expected by Python model
    deal_value_billion: data.dealValue / 1000,
    premium: data.premium,
    payment_type: data.paymentType,
    cross_border: data.crossBorder,
    same_industry: data.sameIndustry,
    acquirer_car: 0.0, // Default CAR
    target_car: 0.0,
  };

  const response = await fetch(`${API_BASE}/deals/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to score the deal");
  }

  return response.json();
}

/**
 * Fetch historical deals from the FastAPI backend.
 */
export async function getHistoricalDeals(): Promise<HistoricalDealRaw[]> {
  const response = await fetch(`${API_BASE}/deals/historical`);

  if (!response.ok) {
    throw new Error("Failed to fetch historical deals");
  }

  return response.json();
}
