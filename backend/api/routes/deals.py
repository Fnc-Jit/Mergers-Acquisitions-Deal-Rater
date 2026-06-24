import os
import pandas as pd
from fastapi import APIRouter, HTTPException
from api.schemas import DealScoreRequest, DealScoreResponse, ShapExplanation, ShapFeatureImpact
from model.score import score_deal
from model.explain import get_shap_explanation

router = APIRouter()

@router.post("/score", response_model=DealScoreResponse)
def api_score_deal(request: DealScoreRequest):
    try:
        # 1. Score the deal
        score_results = score_deal(
            acquirer=request.acquirer,
            target=request.target,
            deal_value_billion=request.deal_value_billion,
            premium=request.premium,
            payment_type=request.payment_type,
            cross_border=request.cross_border,
            same_industry=request.same_industry,
            acquirer_car=request.acquirer_car,
            target_car=request.target_car
        )
        
        # 2. Generate SHAP explanations
        explanation_results = get_shap_explanation(
            acquirer=request.acquirer,
            target=request.target,
            deal_value_billion=request.deal_value_billion,
            premium=request.premium,
            payment_type=request.payment_type,
            cross_border=request.cross_border,
            same_industry=request.same_industry,
            acquirer_car=request.acquirer_car,
            target_car=request.target_car
        )
        
        # Merge results into DealScoreResponse
        return DealScoreResponse(
            score=score_results["score"],
            raw_features=score_results["raw_features"],
            acquirer_metrics=score_results["acquirer_metrics"],
            explanation=ShapExplanation(
                base_value=explanation_results["base_value"],
                features=[ShapFeatureImpact(**f) for f in explanation_results["features"]]
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/historical")
def get_historical_deals():
    data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "processed", "deals_master.csv")
    if not os.path.exists(data_path):
        return []
    try:
        import numpy as np
        df = pd.read_csv(data_path)
        records = df.to_dict(orient="records")
        
        # Robustly replace any float 'nan' values with None for clean JSON serialization
        for r in records:
            for k, v in r.items():
                if isinstance(v, float) and (np.isnan(v) or v != v):
                    r[k] = None
                    
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading historical deals: {str(e)}")
