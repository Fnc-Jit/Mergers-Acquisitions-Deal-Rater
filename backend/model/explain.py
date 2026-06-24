import os
import numpy as np
import pandas as pd
import joblib
import shap
from model.feature_engineering import preprocess_data, FEATURE_COLS

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "model", "artifacts")

def get_shap_explanation(
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
    """Compute SHAP values to explain a single deal scoring result."""
    model_path = os.path.join(MODEL_DIR, "model.joblib")
    scaler_path = os.path.join(MODEL_DIR, "scaler.joblib")
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        raise FileNotFoundError("Model or scaler not trained.")
        
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    
    # 1. Fetch acquirer fundamentals to rebuild the row
    from data_pipeline.fundamentals_loader import get_company_profile, get_key_metrics
    acquirer_metrics = get_key_metrics(acquirer)
    
    deal_df = pd.DataFrame([{
        "acquirer": acquirer,
        "target": target,
        "deal_value_billion": deal_value_billion,
        "premium": premium,
        "payment_type": payment_type.lower(),
        "cross_border": int(cross_border),
        "same_industry": int(same_industry),
        "acquirer_revenue": acquirer_metrics.get("revenue"),
        "acquirer_ebitda": acquirer_metrics.get("ebitda"),
        "acquirer_operating_margin": acquirer_metrics.get("operating_margin"),
        "acquirer_leverage": acquirer_metrics.get("debt_to_ebitda"),
        "acquirer_car": acquirer_car,
        "target_car": target_car
    }])
    
    # Preprocess
    X_scaled, X_engineered = preprocess_data(deal_df, is_training=False, scaler_path=scaler_path)
    
    # 2. Compute SHAP values
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_scaled)
    
    # TreeExplainer might return a single array or a list (for multi-class/binary depending on version)
    if isinstance(shap_values, list):
        # Binary classification list, use class 1
        shap_vals = shap_values[1][0]
    elif len(shap_values.shape) == 2:
        shap_vals = shap_values[0]
    else:
        shap_vals = shap_values
        
    base_value = float(explainer.expected_value)
    
    # If the output is in log-odds space (standard for TreeExplainer on binary XGBoost),
    # we want to map it to probability space for the frontend.
    # To keep it simple and intuitive, we can show the log-odds contributions,
    # or scale them to probability contributions.
    # Let's return the log-odds contributions and their probability-scaled approximations.
    explanation = []
    
    # Feature labels for human-friendly display
    friendly_names = {
        "deal_value_billion": "Deal Size ($B)",
        "relative_size": "Relative Deal Size",
        "premium": "Premium Offered",
        "payment_cash": "All-Cash Structure",
        "payment_stock": "All-Stock Structure",
        "payment_mixed": "Mixed Payment Structure",
        "cross_border": "Cross-Border Deal",
        "same_industry": "Same-Industry Merger",
        "acquirer_operating_margin": "Acquirer Margin",
        "acquirer_leverage": "Acquirer Leverage",
        "acquirer_car": "Acquirer CAR (Market Reaction)",
        "target_car": "Target CAR"
    }
    
    # Calculate identical continuous adjustments in log-odds space
    premium_adj = -0.6 * ((premium - 30.0) / 15.0) ** 2
    
    rel_size = float(X_engineered["relative_size"].iloc[0])
    size_adj = -0.3 * rel_size
    
    explanation = []
    
    for i, col in enumerate(FEATURE_COLS):
        val = float(X_engineered[col].iloc[0])
        impact = float(shap_vals[i])
        
        # Add the adjustments directly to the respective feature SHAP values
        # to ensure perfect additive consistency in log-odds space!
        if col == "premium":
            impact += premium_adj
        elif col == "relative_size":
            impact += size_adj
            
        explanation.append({
            "feature": col,
            "display_name": friendly_names.get(col, col),
            "actual_value": val,
            "shap_value": impact
        })
        
    # Sort by absolute impact
    explanation = sorted(explanation, key=lambda x: abs(x["shap_value"]), reverse=True)
    
    return {
        "base_value": base_value,
        "features": explanation
    }
