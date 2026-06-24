import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta

def get_trading_window_prices(ticker: str, announcement_date_str: str, window_before: int = 5, window_after: int = 10) -> pd.DataFrame:
    """Fetch daily stock prices for a ticker around the announcement date."""
    ticker = ticker.upper().strip()
    try:
        ann_date = datetime.strptime(announcement_date_str, "%Y-%m-%d")
    except ValueError:
        # Try other format
        ann_date = pd.to_datetime(announcement_date_str)
        
    start_date = ann_date - timedelta(days=window_before + 10) # extra buffer for holidays/weekends
    end_date = ann_date + timedelta(days=window_after + 15)
    
    try:
        # Fetch ticker and SPY data
        data = yf.download([ticker, "SPY"], start=start_date.strftime("%Y-%m-%d"), end=end_date.strftime("%Y-%m-%d"), progress=False)
        if data.empty or "Adj Close" not in data:
            return pd.DataFrame()
            
        prices = data["Adj Close"]
        prices = prices.dropna()
        return prices
    except Exception as e:
        print(f"Error downloading yfinance prices for {ticker}: {e}")
        return pd.DataFrame()

def calculate_car(ticker: str, announcement_date_str: str, window_before: int = 1, window_after: int = 1) -> float:
    """Compute the Cumulative Abnormal Return (CAR) for a ticker relative to SPY."""
    # We want a broader window first to align dates and find trading days
    prices = get_trading_window_prices(ticker, announcement_date_str, window_before=window_before + 5, window_after=window_after + 5)
    if prices.empty or ticker not in prices.columns or "SPY" not in prices.columns:
        # Return a fallback default CAR (e.g., a small negative return or 0.0) if download failed
        print(f"Warning: Could not compute CAR for {ticker} around {announcement_date_str}. Using default 0.0.")
        return 0.0
        
    # Calculate daily returns
    returns = prices.pct_change().dropna()
    
    # Locate announcement date in trading days
    ann_date = pd.to_datetime(announcement_date_str)
    
    # Find the closest trading day on or after the announcement date
    future_dates = returns.index[returns.index >= ann_date]
    if len(future_dates) == 0:
        return 0.0
    ann_idx = returns.index.get_loc(future_dates[0])
    
    # Extract the event window around the announcement index
    start_idx = max(0, ann_idx - window_before)
    end_idx = min(len(returns) - 1, ann_idx + window_after)
    
    window_returns = returns.iloc[start_idx:end_idx + 1]
    
    # Abnormal returns = Ticker return - SPY return
    abnormal_returns = window_returns[ticker] - window_returns["SPY"]
    
    # Cumulative Abnormal Return (CAR) is the sum of abnormal returns
    car = float(abnormal_returns.sum())
    return car
