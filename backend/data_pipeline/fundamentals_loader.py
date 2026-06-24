import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

# We'll use a placeholder key or load from env
FMP_API_KEY = os.getenv("FMP_API_KEY", "demo")
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

def get_cached_fmp_data(endpoint: str, symbol: str) -> dict:
    """Helper to load/save JSON data from FMP API to avoid rate limiting."""
    symbol = symbol.upper().strip()
    cache_file = os.path.join(CACHE_DIR, f"{symbol}_{endpoint}.json")
    if os.path.exists(cache_file):
        with open(cache_file, "r") as f:
            return json.load(f)
            
    if not FMP_API_KEY or FMP_API_KEY == "demo":
        print(f"Warning: FMP_API_KEY not set or is demo. Returning empty/mock data for {symbol}.")
        return {}
        
    # 1. Try calling the native Financial Modeling Prep API
    url = f"https://financialmodelingprep.com/api/v3/{endpoint}/{symbol}"
    params = {"apikey": FMP_API_KEY}
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Cache the response
        with open(cache_file, "w") as f:
            json.dump(data, f)
        return data
    except Exception as e:
        # If native FMP returns 401/403, it might be an APILayer marketplace key!
        print(f"Native FMP fetch failed for {symbol} ({e}). Trying APILayer proxy...")
        
        # 2. Try calling the APILayer marketplace proxy URL
        # APILayer uses the header "apikey" for authorization
        apilayer_url = f"https://api.apilayer.com/fmp/{endpoint}/{symbol}"
        headers = {"apikey": FMP_API_KEY}
        try:
            apilayer_response = requests.get(apilayer_url, headers=headers)
            apilayer_response.raise_for_status()
            data = apilayer_response.json()
            
            # Cache the response
            with open(cache_file, "w") as f:
                json.dump(data, f)
            print(f"Successfully fetched {endpoint} for {symbol} via APILayer!")
            return data
        except Exception as ae:
            print(f"APILayer fetch also failed for {symbol}: {ae}")
            
    return {}

def get_yfinance_fallback_profile(symbol: str) -> dict:
    """Fetch company profile from yfinance as a fallback."""
    symbol = symbol.upper().strip()
    cache_file = os.path.join(CACHE_DIR, f"{symbol}_yf_profile.json")
    if os.path.exists(cache_file):
        with open(cache_file, "r") as f:
            return json.load(f)

    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        info = ticker.info
        if info and "longName" in info:
            profile = {
                "symbol": symbol,
                "company_name": info.get("longName"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "country": info.get("country"),
                "sic": "7372" # Default SIC for software/tech
            }
            with open(cache_file, "w") as f:
                json.dump(profile, f)
            return profile
    except Exception as e:
        print(f"yfinance profile fallback error for {symbol}: {e}")
    return {}

def get_yfinance_fallback_metrics(symbol: str) -> dict:
    """Fetch key financials from yfinance as a fallback."""
    symbol = symbol.upper().strip()
    cache_file = os.path.join(CACHE_DIR, f"{symbol}_yf_metrics.json")
    if os.path.exists(cache_file):
        with open(cache_file, "r") as f:
            return json.load(f)

    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        info = ticker.info
        if info and info.get("totalRevenue") is not None:
            revenue = info.get("totalRevenue")
            ebitda = info.get("ebitda")
            total_debt = info.get("totalDebt", 0)
            total_cash = info.get("totalCash", 0)
            operating_margin = info.get("operatingMargins")
            
            # Fallback calculations if some fields are missing in yfinance info
            if ebitda is None and revenue is not None:
                # Approximate EBITDA as 25% of revenue if missing
                ebitda = revenue * 0.25
                
            net_debt = (total_debt or 0) - (total_cash or 0)
            
            debt_to_ebitda = 2.0 # default
            if net_debt is not None and ebitda:
                debt_to_ebitda = net_debt / ebitda if ebitda != 0 else 0
                
            metrics = {
                "revenue": revenue,
                "ebitda": ebitda,
                "total_debt": total_debt,
                "cash_and_equivalents": total_cash,
                "net_debt": net_debt,
                "operating_margin": operating_margin,
                "debt_to_ebitda": debt_to_ebitda
            }
            with open(cache_file, "w") as f:
                json.dump(metrics, f)
            return metrics
    except Exception as e:
        print(f"yfinance financials fallback error for {symbol}: {e}")
    return {}

def get_company_profile(symbol: str) -> dict:
    """Fetch company profile (sector, industry, country)."""
    symbol = symbol.upper().strip()
    # Check yfinance cache first to avoid FMP API gateway network latency/errors
    yf_cache_file = os.path.join(CACHE_DIR, f"{symbol}_yf_profile.json")
    if os.path.exists(yf_cache_file):
        with open(yf_cache_file, "r") as f:
            return json.load(f)

    data = get_cached_fmp_data("profile", symbol)
    if isinstance(data, list) and len(data) > 0:
        profile = data[0]
        return {
            "symbol": symbol,
            "company_name": profile.get("companyName"),
            "sector": profile.get("sector"),
            "industry": profile.get("industry"),
            "country": profile.get("country"),
            "sic": profile.get("sicCode") or profile.get("sic")
        }
        
    # Fallback to yfinance
    yf_profile = get_yfinance_fallback_profile(symbol)
    if yf_profile:
        return yf_profile
        
    # Fallback mock data if profile not available
    return {
        "symbol": symbol,
        "company_name": f"{symbol} Inc.",
        "sector": "Technology",
        "industry": "Software",
        "country": "US",
        "sic": "7372"
    }

def get_key_metrics(symbol: str) -> dict:
    """Fetch key financial metrics (revenue, EBITDA, leverage ratio)."""
    symbol = symbol.upper().strip()
    # Check yfinance cache first to avoid FMP API gateway network latency/errors
    yf_cache_file = os.path.join(CACHE_DIR, f"{symbol}_yf_metrics.json")
    if os.path.exists(yf_cache_file):
        with open(yf_cache_file, "r") as f:
            return json.load(f)

    income_data = get_cached_fmp_data("income-statement", symbol)
    balance_data = get_cached_fmp_data("balance-sheet-statement", symbol)
    
    # Check if we have valid FMP data, if not try yfinance
    has_fmp_data = (isinstance(income_data, list) and len(income_data) > 0) or \
                   (isinstance(balance_data, list) and len(balance_data) > 0)
                   
    if not has_fmp_data:
        yf_metrics = get_yfinance_fallback_metrics(symbol)
        if yf_metrics and yf_metrics.get("revenue") is not None:
            # yfinance returned valid financials, provide defaults if any specific field is missing
            if yf_metrics["operating_margin"] is None:
                yf_metrics["operating_margin"] = 0.25
            if yf_metrics["debt_to_ebitda"] is None:
                yf_metrics["debt_to_ebitda"] = 2.0
            return yf_metrics

    result = {
        "revenue": None,
        "ebitda": None,
        "total_debt": None,
        "cash_and_equivalents": None,
        "net_debt": None,
        "operating_margin": None,
        "debt_to_ebitda": None
    }
    
    # Extract from income statement
    if isinstance(income_data, list) and len(income_data) > 0:
        result["revenue"] = income_data[0].get("revenue")
        result["ebitda"] = income_data[0].get("ebitda")
        
    # Extract from balance sheet
    if isinstance(balance_data, list) and len(balance_data) > 0:
        result["total_debt"] = balance_data[0].get("totalDebt")
        result["cash_and_equivalents"] = balance_data[0].get("cashAndCashEquivalents")
        
    # Calculate derived metrics
    if result["revenue"] and result["ebitda"]:
        result["operating_margin"] = result["ebitda"] / result["revenue"]
        
    if result["total_debt"] is not None and result["cash_and_equivalents"] is not None:
        result["net_debt"] = result["total_debt"] - result["cash_and_equivalents"]
        
    if result["net_debt"] is not None and result["ebitda"]:
        result["debt_to_ebitda"] = result["net_debt"] / result["ebitda"] if result["ebitda"] != 0 else 0
        
    # Provide fallback defaults if FMP API key wasn't active
    if result["revenue"] is None:
        result["revenue"] = 10000000000  # $10B mock
    if result["ebitda"] is None:
        result["ebitda"] = 2500000000    # $2.5B mock
    if result["operating_margin"] is None:
        result["operating_margin"] = 0.25
    if result["debt_to_ebitda"] is None:
        result["debt_to_ebitda"] = 2.0
        
    return result
