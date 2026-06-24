import os
import pytest
from model.score import score_deal

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "model", "artifacts", "model.joblib")

@pytest.mark.skipif(not os.path.exists(MODEL_PATH), reason="Model not trained yet")
def test_score_deal():
    result = score_deal(
        acquirer="MSFT",
        target="Activision",
        deal_value_billion=68.7,
        premium=45.0,
        payment_type="cash",
        cross_border=False,
        same_industry=True,
        acquirer_car=0.01,
        target_car=0.20
    )
    
    assert "score" in result
    assert 0.0 <= result["score"] <= 100.0
    assert "raw_features" in result
    assert "acquirer_metrics" in result
    assert result["acquirer_metrics"]["name"] in ["Microsoft Corporation", "MSFT Inc."]
