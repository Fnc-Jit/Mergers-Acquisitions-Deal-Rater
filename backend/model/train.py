import os
import pandas as pd
import numpy as np
import joblib
import xgboost as xgb
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from model.feature_engineering import preprocess_data

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "model", "artifacts")
os.makedirs(MODEL_DIR, exist_ok=True)

def train_model():
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "processed", "deals_master.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Master dataset not found at {data_path}. Please run deal compiler first.")
        
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} historical deals for training.")
    
    # 1. Feature Preprocessing
    scaler_path = os.path.join(MODEL_DIR, "scaler.joblib")
    X, y = preprocess_data(df, is_training=True, scaler_path=scaler_path)
    
    # 2. Stratified 5-Fold Cross Validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    acc_scores = []
    prec_scores = []
    rec_scores = []
    f1_scores = []
    auc_scores = []
    
    # Calculate scale_pos_weight for class imbalance
    neg_count = np.sum(y == 0)
    pos_count = np.sum(y == 1)
    scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1.0
    print(f"Class distribution: {pos_count} Successes, {neg_count} Failures. scale_pos_weight = {scale_pos_weight:.2f}")
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]
        
        model = xgb.XGBClassifier(
            max_depth=3,
            n_estimators=50,
            learning_rate=0.05,
            scale_pos_weight=scale_pos_weight,
            random_state=42,
            eval_metric="logloss"
        )
        
        model.fit(X_train, y_train)
        preds = model.predict(X_val)
        probs = model.predict_proba(X_val)[:, 1]
        
        acc_scores.append(accuracy_score(y_val, preds))
        prec_scores.append(precision_score(y_val, preds, zero_division=0))
        rec_scores.append(recall_score(y_val, preds, zero_division=0))
        f1_scores.append(f1_score(y_val, preds, zero_division=0))
        auc_scores.append(roc_auc_score(y_val, probs))
        
    print("\n--- 5-Fold Cross-Validation Metrics ---")
    print(f"Accuracy:  {np.mean(acc_scores):.4f} +/- {np.std(acc_scores):.4f}")
    print(f"Precision: {np.mean(prec_scores):.4f} +/- {np.std(prec_scores):.4f}")
    print(f"Recall:    {np.mean(rec_scores):.4f} +/- {np.std(rec_scores):.4f}")
    print(f"F1-Score:  {np.mean(f1_scores):.4f} +/- {np.std(f1_scores):.4f}")
    print(f"ROC-AUC:   {np.mean(auc_scores):.4f} +/- {np.std(auc_scores):.4f}")
    
    # 3. Train on full dataset and save
    print("\nTraining final model on full dataset...")
    final_model = xgb.XGBClassifier(
        max_depth=3,
        n_estimators=50,
        learning_rate=0.05,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric="logloss"
    )
    final_model.fit(X, y)
    
    model_path = os.path.join(MODEL_DIR, "model.joblib")
    joblib.dump(final_model, model_path)
    print(f"Model successfully saved to {model_path}")

if __name__ == "__main__":
    train_model()
