import pandas as pd
import numpy as np
import pytest
from model.feature_engineering import preprocess_data, FEATURE_COLS

def test_preprocess_data_training():
    # Create sample raw DataFrame
    raw_df = pd.DataFrame([{
        "acquirer": "MSFT",
        "target": "Activision",
        "deal_value_billion": 68.7,
        "premium": 45.0,
        "payment_type": "cash",
        "cross_border": 0,
        "same_industry": 1,
        "success": 1,
        "acquirer_revenue": 200000000000.0,
        "acquirer_ebitda": 80000000000.0,
        "acquirer_operating_margin": 0.40,
        "acquirer_leverage": 1.2,
        "acquirer_car": 0.02,
        "target_car": 0.25
    }, {
        "acquirer": "AAPL",
        "target": "Beats",
        "deal_value_billion": 3.0,
        "premium": 25.0,
        "payment_type": "stock",
        "cross_border": 0,
        "same_industry": 0,
        "success": 1,
        "acquirer_revenue": 380000000000.0,
        "acquirer_ebitda": 120000000000.0,
        "acquirer_operating_margin": 0.31,
        "acquirer_leverage": 0.8,
        "acquirer_car": -0.01,
        "target_car": 0.15
    }])
    
    X_scaled, y = preprocess_data(raw_df, is_training=True)
    
    assert X_scaled.shape == (2, len(FEATURE_COLS))
    assert len(y) == 2
    assert y[0] == 1
    assert y[1] == 1

def test_preprocess_data_inference():
    # Single row inference test
    deal_df = pd.DataFrame([{
        "deal_value_billion": 10.0,
        "premium": 30.0,
        "payment_type": "mixed",
        "cross_border": 1,
        "same_industry": 1,
        "acquirer_revenue": 50000000000.0,
        "acquirer_ebitda": 15000000000.0,
        "acquirer_operating_margin": 0.30,
        "acquirer_leverage": 1.5,
        "acquirer_car": 0.0,
        "target_car": 0.0
    }])
    
    X_scaled, _ = preprocess_data(deal_df, is_training=False)
    assert X_scaled.shape == (1, len(FEATURE_COLS))
