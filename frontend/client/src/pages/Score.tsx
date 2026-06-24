import { useState } from "react";
import { DealInputForm, DealFormData } from "@/components/DealInputForm";
import { ScoreGauge } from "@/components/ScoreGauge";
import { ShapWaterfall, ShapValue } from "@/components/ShapWaterfall";
import { HistoricalDealsTable } from "@/components/HistoricalDealsTable";
import { toast } from "sonner";
import { scoreDeal } from "@/lib/api";

export default function Score() {
  const [isLoading, setIsLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    score: number;
    shapValues: ShapValue[];
    baseValue: number;
    dealData: DealFormData;
  } | null>(null);

  const calculateScore = async (data: DealFormData) => {
    setIsLoading(true);
    setScoreResult(null); // Clear previous results to trigger a fresh unmount/remount transition
    try {
      const res = await scoreDeal(data);
      
      // Convert SHAP log-odds to probability scale and scale linearly so they sum to the final score
      const baseProb = (1 / (1 + Math.exp(-res.explanation.base_value))) * 100;
      const finalScore = res.score;
      const rawFeatures = res.explanation.features;
      const totalShap = rawFeatures.reduce((acc, f) => acc + f.shap_value, 0);
      
      const shapValues = rawFeatures.map(f => {
        let contribution = 0;
        if (totalShap !== 0) {
          // Proportionally distribute the score difference based on the log-odds SHAP values
          contribution = f.shap_value * ((finalScore - baseProb) / totalShap);
        }
        return {
          feature: f.display_name,
          contribution: contribution
        };
      });

      setScoreResult({
        score: finalScore,
        shapValues,
        baseValue: Math.round(baseProb),
        dealData: data,
      });
      toast.success("Deal scored successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to score deal");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Score a Deal</h1>
          <p className="text-muted-foreground">
            Enter M&A deal terms to receive a Deal Quality Score with explainable SHAP analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-1">
            <DealInputForm onSubmit={calculateScore} isLoading={isLoading} />
          </div>

          {/* Results Column */}
          {scoreResult && (
            <div className="lg:col-span-2 space-y-6">
              <ScoreGauge
                score={scoreResult.score}
                title="Deal Quality Score"
                description="Explainable ML assessment based on deal structure"
              />
              <ShapWaterfall
                baseValue={scoreResult.baseValue}
                shapValues={scoreResult.shapValues}
                finalScore={scoreResult.score}
              />
              <HistoricalDealsTable dealFormData={scoreResult.dealData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
