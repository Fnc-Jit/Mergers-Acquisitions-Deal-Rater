# Mathematical Foundations & Core Calculations

This document provides a rigorous, step-by-step mathematical breakdown of the scoring, explainability (SHAP), and continuous overlay engines of the **M&A Deal Rater**.

---

## 1. Machine Learning Base Prediction (Log-Odds)

The core predictive model is an **XGBoost Classifier** trained on historical M&A transactions. For any input feature vector $\mathbf{x}$, the model outputs a raw probability $P_{\text{raw}} \in (0, 1)$ representing the likelihood of deal success.

To perform explainability and expert adjustments mathematically, we map this probability to **log-odds (logit) space**:
$$Y_{\text{log\_odds}} = \ln\left(\frac{P_{\text{raw}}}{1 - P_{\text{raw}}}\right) \in (-\infty, +\infty)$$

---

## 2. Continuous Expert Overlays (Log-Odds Space)

To prevent discrete "step-function" outputs typical of decision trees and ensure smooth, satisfying score transitions in the UI, we apply continuous penalty overlays. These adjustments are applied **additively in log-odds space** rather than multiplicatively in probability space.

### A. Gaussian Premium Sweet Spot Penalty
M&A premiums have a non-linear relationship with success: too low (e.g., $<15\%$) and target shareholders reject; too high (e.g., $>50\%$) and the acquirer overpays, leading to value destruction. We model this as a smooth Gaussian penalty peaking at the optimal $30\%$ premium:
$$\text{premium\_adj} = -\lambda_1 \cdot \left( \frac{\text{premium} - 30.0}{\sigma_{\text{premium}}} \right)^2$$

Where:
* $\text{premium}$ is the user input in percent ($0\% - 200\%$).
* $\lambda_1 = 0.6$ represents the maximum log-odds penalty scale factor.
* $\sigma_{\text{premium}} = 15.0$ represents the spread of the premium acceptance window.

### B. Relative Size Complexity Penalty
Larger deal values relative to the acquirer's revenue increase integration and execution complexity. We model this as a linear penalty in log-odds space:
$$\text{size\_adj} = -\lambda_2 \cdot \left( \frac{\text{deal\_value\_billion}}{\text{acquirer\_revenue\_billion}} \right)$$

Where:
* $\lambda_2 = 0.3$ represents the size penalty scale factor.
* The ratio is the relative transaction scale ($0.0 - 5.0+$).

### C. Joint Adjusted Log-Odds
The final adjusted log-odds score $Y_{\text{adjusted}}$ is the sum of the model's raw log-odds and the expert overlays:
$$Y_{\text{adjusted}} = Y_{\text{log\_odds}} + \text{premium\_adj} + \text{size\_adj}$$

---

## 3. Probability Space Mapping (The Final Score)

The final adjusted log-odds score is mapped back to the $[0, 100]$ probability space using the standard **logistic sigmoid function**:
$$\text{Score} = \sigma(Y_{\text{adjusted}}) \times 100 = \frac{100}{1 + e^{-Y_{\text{adjusted}}}}$$

---

## 4. Additive SHAP Integration

The local explanation engine uses **SHAP (SHapley Additive exPlanations)**. Natively, SHAP values are additive in log-odds space. The raw log-odds score is decomposed as:
$$Y_{\text{log\_odds}} = V_{\text{base}} + \sum_{i=1}^{D} S_i$$

Where:
* $V_{\text{base}}$ is the log-odds base value (expected value of the model over the training set).
* $S_i$ is the raw SHAP value of feature $i$.

To ensure the explanations are **100% consistent** with our adjusted final score, we inject the expert overlays directly into the SHAP values of their respective features:
* **Adjusted Premium SHAP**:
  $$S_{\text{premium}}' = S_{\text{premium}} + \text{premium\_adj}$$
* **Adjusted Size SHAP**:
  $$S_{\text{relative\_size}}' = S_{\text{relative\_size}} + \text{size\_adj}$$
* **All Other Features**:
  $$S_j' = S_j \quad (\forall j \neq \text{premium}, \text{relative\_size})$$

### Mathematical Proof of Additive Consistency:
$$V_{\text{base}} + \sum_{i=1}^{D} S_i' = V_{\text{base}} + \sum_{j \neq \text{premium}, \text{size}} S_j + (S_{\text{premium}} + \text{premium\_adj}) + (S_{\text{relative\_size}} + \text{size\_adj})$$
$$= \left( V_{\text{base}} + \sum_{i=1}^{D} S_i \right) + \text{premium\_adj} + \text{size\_adj}$$
$$= Y_{\text{log\_odds}} + \text{premium\_adj} + \text{size\_adj} = Y_{\text{adjusted}}$$

This proves that the adjusted SHAP values are **natively and perfectly additive** with respect to the final adjusted score.

---

## 5. Client-Side Linear SHAP-to-Probability Rescaler

Because SHAP values are additive in log-odds space, rendering them directly in probability space ($0-100$) requires a linear transformation to preserve the exact relative proportions of the features' impacts.

Let:
* $B = \sigma(V_{\text{base}}) \times 100$ be the base probability.
* $\text{Score} = \sigma(Y_{\text{adjusted}}) \times 100$ be the final probability.
* $T = \sum S_i'$ be the sum of adjusted log-odds SHAP values.

We define a uniform scaling constant ($K$):
$$K = \frac{\text{Score} - B}{T}$$

We scale each individual contribution ($C_i$) linearly:
$$C_i = S_i' \times K$$

### Proof 1: Perfect Summation to Final Score
$$B + \sum_{i=1}^{D} C_i = B + \sum_{i=1}^{D} (S_i' \times K) = B + K \sum_{i=1}^{D} S_i'$$
$$= B + \left( \frac{\text{Score} - B}{T} \right) \times T = B + (\text{Score} - B) = \text{Score}$$

This proves that the rescaled contributions sum **exactly** to the final displayed score in the UI.

### Proof 2: Preservation of Proportions (Attribution Integrity)
For any two features $a$ and $b$, the ratio of their displayed contributions in the waterfall chart is:
$$\frac{C_a}{C_b} = \frac{S_a' \cdot K}{S_b' \cdot K} = \frac{S_a'}{S_b'}$$

This algebraic proof guarantees that **no distortion occurs during rescaling**. The relative size and impact of the bars in the SHAP waterfall chart represent their true, mathematically rigorous proportions.
