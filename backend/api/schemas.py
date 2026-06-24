from pydantic import BaseModel, Field

class DealScoreRequest(BaseModel):
    acquirer: str = Field(..., description="Ticker symbol of the acquirer", examples=["MSFT"])
    target: str = Field(..., description="Name or ticker of the target company", examples=["Activision Blizzard"])
    deal_value_billion: float = Field(..., description="Total value of the deal in billions USD", examples=[68.7])
    premium: float = Field(default=30.0, description="Premium offered in percent", examples=[30.0])
    payment_type: str = Field(..., description="Payment structure: cash, stock, or mixed", examples=["cash"])
    cross_border: bool = Field(..., description="Is this a cross-border transaction?", examples=[False])
    same_industry: bool = Field(..., description="Are acquirer and target in the same industry?", examples=[True])
    acquirer_car: float = Field(default=0.0, description="Acquirer Cumulative Abnormal Return (market reaction)", examples=[0.0])
    target_car: float = Field(default=0.0, description="Target Cumulative Abnormal Return", examples=[0.0])

class ShapFeatureImpact(BaseModel):
    feature: str
    display_name: str
    actual_value: float
    shap_value: float

class ShapExplanation(BaseModel):
    base_value: float
    features: list[ShapFeatureImpact]

class AcquirerMetrics(BaseModel):
    name: str
    sector: str
    industry: str
    revenue_billion: float
    ebitda_billion: float
    leverage: float
    operating_margin: float

class DealScoreResponse(BaseModel):
    score: float
    raw_features: dict[str, float]
    acquirer_metrics: AcquirerMetrics
    explanation: ShapExplanation
