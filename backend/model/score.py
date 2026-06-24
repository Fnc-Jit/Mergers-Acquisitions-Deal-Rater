import os
import pandas as pd
import numpy as np
import joblib
from data_pipeline.fundamentals_loader import get_company_profile, get_key_metrics
from model.feature_engineering import preprocess_data, FEATURE_COLS

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "model", "artifacts")

def score_deal(
    acquirer: str,
    target: str,
    deal_value_billion: float,
    premium: float,
    payment_type: str,
    cross_border: bool,
    same_industry: bool,
    acquirer_car: float = 0.0,
    target_car: float = 0.0
) -> dict:
    """Score a hypothetical deal and return the Deal Quality Score (0-100)."""
    model_path = os.path.join(MODEL_DIR, "model.joblib")
    scaler_path = os.path.join(MODEL_DIR, "scaler.joblib")
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        raise FileNotFoundError("Trained model or scaler artifacts not found. Please train the model first.")
        
    model = joblib.load(model_path)
    
    # 1. Fetch acquirer fundamentals
    acquirer_profile = get_company_profile(acquirer)
    acquirer_metrics = get_key_metrics(acquirer)
    
    # 2. Create a single-row DataFrame for preprocessing
    deal_df = pd.DataFrame([{
        "acquirer": acquirer,
        "target": target,
        "deal_value_billion": deal_value_billion,
        "premium": premium,
        "payment_type": payment_type.lower(),
        "cross_border": int(cross_border),
        "same_industry": int(same_industry),
        
        # Acquirer metrics
        "acquirer_revenue": acquirer_metrics.get("revenue"),
        "acquirer_ebitda": acquirer_metrics.get("ebitda"),
        "acquirer_operating_margin": acquirer_metrics.get("operating_margin"),
        "acquirer_leverage": acquirer_metrics.get("debt_to_ebitda"),
        
        # Market response
        "acquirer_car": acquirer_car,
        "target_car": target_car
    }])
    
    # 3. Preprocess and scale
    X_scaled, X_engineered = preprocess_data(deal_df, is_training=False, scaler_path=scaler_path)
    
    # 4. Predict probability from XGBoost model and convert to log-odds (logit space)
    prob = float(model.predict_proba(X_scaled)[0, 1])
    prob_clipped = max(0.001, min(0.999, prob))
    y_log_odds = float(np.log(prob_clipped / (1.0 - prob_clipped)))
    
    # 5. Apply smooth continuous Gaussian premium adjustment in log-odds space (sweet spot at 30%)
    premium_adj = -0.6 * ((premium - 30.0) / 15.0) ** 2
    
    # 6. Apply smooth continuous relative size penalty in log-odds space
    rel_size = float(X_engineered["relative_size"].iloc[0])
    size_adj = -0.3 * rel_size
    
    # Calculate final adjusted log-odds and map back to probability space
    y_adjusted = y_log_odds + premium_adj + size_adj
    final_prob = 1.0 / (1.0 + np.exp(-y_adjusted))
    score = round(final_prob * 100, 1)
    
    # Extract feature values for frontend display
    raw_features = {}
    for col in FEATURE_COLS:
        raw_features[col] = float(X_engineered[col].iloc[0])
        
    return {
        "score": score,
        "raw_features": raw_features,
        "acquirer_metrics": {
            "name": acquirer_profile.get("company_name", acquirer),
            "sector": acquirer_profile.get("sector", "Technology"),
            "industry": acquirer_profile.get("industry", "Software"),
            "revenue_billion": round(acquirer_metrics.get("revenue", 0) / 1e9, 2),
            "ebitda_billion": round(acquirer_metrics.get("ebitda", 0) / 1e9, 2),
            "leverage": round(acquirer_metrics.get("debt_to_ebitda", 0), 2),
            "operating_margin": round(acquirer_metrics.get("operating_margin", 0) * 100, 2)
        }
    }
