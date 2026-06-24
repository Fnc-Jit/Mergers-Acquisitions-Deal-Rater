import os
import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler

FEATURE_COLS = [
    "deal_value_billion",
    "relative_size",
    "premium",
    "payment_cash",
    "payment_stock",
    "payment_mixed",
    "cross_border",
    "same_industry",
    "acquirer_operating_margin",
    "acquirer_leverage",
    "acquirer_car",
    "target_car"
]

def preprocess_data(df: pd.DataFrame, is_training: bool = True, scaler_path: str = None) -> tuple[np.ndarray, np.ndarray] | np.ndarray:
    """Engineer features from raw deal dataframe and return scaled features."""
    df = df.copy()
    
    # 1. Engineer relative size
    # Calculate proxy relative size: deal value relative to acquirer revenue (in billions)
    acq_rev_billion = df["acquirer_revenue"] / 1e9
    # Prevent division by zero
    acq_rev_billion = acq_rev_billion.replace(0, 1.0)
    df["relative_size"] = df["deal_value_billion"] / acq_rev_billion
    
    # 2. One-hot encode payment structure
    df["payment_cash"] = (df["payment_type"] == "cash").astype(int)
    df["payment_stock"] = (df["payment_type"] == "stock").astype(int)
    df["payment_mixed"] = (df["payment_type"] == "mixed").astype(int)
    
    # 3. Handle missing values
    df["premium"] = df["premium"].fillna(30.0)
    df["acquirer_operating_margin"] = df["acquirer_operating_margin"].fillna(0.20)
    # Clip leverage to reasonable values and fillna
    df["acquirer_leverage"] = df["acquirer_leverage"].fillna(2.0).clip(-10, 20)
    df["acquirer_car"] = df["acquirer_car"].fillna(0.0)
    df["target_car"] = df["target_car"].fillna(0.0)
    
    # Extract features
    X = df[FEATURE_COLS].copy()
    
    # 4. Scale features
    if is_training:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        if scaler_path:
            os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
            joblib.dump(scaler, scaler_path)
        y = df["success"].values
        return X_scaled, y
    else:
        if scaler_path and os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            X_scaled = scaler.transform(X)
        else:
            # Fallback if scaler doesn't exist
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
        return X_scaled, X
