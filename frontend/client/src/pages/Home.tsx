import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Github } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 sm:py-32">
        <div className="max-w-2xl text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 tracking-tight">
            M&A Deal Rater
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Score any acquisition like a risk desk would. Explainable ML-powered deal quality assessment backed by SEC filings and stratified validation.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/score")}
            className="px-8 py-6 text-lg font-semibold"
          >
            Score a Deal
          </Button>
        </div>
      </section>

      {/* Methodology Trust Strip */}
      <section className="bg-muted/30 px-4 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            Built on Rigorous Methodology
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: SEC Filings */}
            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">SEC filings</h3>
                <p className="text-muted-foreground">
                  Trained on real M&A deal data extracted from SEC EDGAR filings, ensuring accuracy grounded in regulatory documentation.
                </p>
              </CardContent>
            </Card>

            {/* Card 2: SHAP Explainability */}
            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <span className="text-2xl">🔍</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">SHAP explainability</h3>
                <p className="text-muted-foreground">
                  Every score comes with SHAP waterfall explanations showing exactly which deal features drove the assessment up or down.
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Stratified Cross-Validation */}
            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Stratified cross-validation</h3>
                <p className="text-muted-foreground">
                  Validated using stratified k-fold cross-validation to ensure robust performance across deal success/failure classes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <p className="text-muted-foreground">
                Built by Jitraj Esh
              </p>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github size={20} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
