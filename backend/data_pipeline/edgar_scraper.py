import os
import re
import time
import requests
from bs4 import BeautifulSoup

# SEC EDGAR requires a User-Agent header identifying the user
EDGAR_HEADERS = {
    "User-Agent": "Jitraj Esh jitrajesh5@gmail.com"
}

def get_cik_from_ticker(ticker: str) -> str:
    """Resolve a ticker symbol to a 10-digit SEC CIK."""
    ticker = ticker.upper().strip()
    # Simple lookup or SEC ticker-CIK api
    url = "https://www.sec.gov/files/company_tickers.json"
    try:
        response = requests.get(url, headers=EDGAR_HEADERS)
        response.raise_for_status()
        data = response.json()
        for item in data.values():
            if item["ticker"] == ticker:
                return str(item["cik_str"]).zfill(10)
    except Exception as e:
        print(f"Error resolving CIK for ticker {ticker}: {e}")
    return None

def get_recent_filings(cik: str, form_type: str = "8-K") -> list:
    """Retrieve list of recent filings for a CIK."""
    if not cik:
        return []
    url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    try:
        response = requests.get(url, headers=EDGAR_HEADERS)
        response.raise_for_status()
        data = response.json()
        filings = data.get("filings", {}).get("recent", {})
        
        results = []
        for i in range(len(filings.get("accessionNumber", []))):
            if filings["form"][i] == form_type:
                acc_num = filings["accessionNumber"][i].replace("-", "")
                doc_name = filings["primaryDocument"][i]
                filing_date = filings["filingDate"][i]
                filing_url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc_num}/{doc_name}"
                results.append({
                    "accession_number": filings["accessionNumber"][i],
                    "filing_date": filing_date,
                    "report_date": filings["reportDate"][i],
                    "url": filing_url,
                    "description": filings["primaryDocDescription"][i]
                })
        return results
    except Exception as e:
        print(f"Error fetching filings for CIK {cik}: {e}")
    return []

def extract_merger_terms(filing_url: str) -> dict:
    """Fetch and parse an 8-K filing to extract deal terms."""
    try:
        response = requests.get(filing_url, headers=EDGAR_HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "lxml")
        text = soup.get_text(" ")
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Basic regex search for deal size / value
        # e.g., "purchase price of $X billion" or "aggregate consideration of approximately $X million"
        deal_value = None
        payment_type = "mixed" # default
        
        # Search patterns for deal value
        value_patterns = [
            r'(?:purchase\s+price|consideration|value|transaction\s+value|valued\s+at)\s+(?:of\s+)?(?:\(?approximate(?:ly)?\)?\s+)?\$([\d,.]+)\s*(billion|million|trillion)?',
            r'\$([\d,.]+)\s*(billion|million)\s*(?:in\s+cash|in\s+stock|merger|acquisition)?'
        ]
        
        for pattern in value_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                val_str = match.group(1).replace(",", "")
                try:
                    val = float(val_str)
                    scale = match.group(2).lower() if len(match.groups()) > 1 and match.group(2) else ""
                    if "billion" in scale:
                        val *= 1000  # Convert to millions
                    elif "trillion" in scale:
                        val *= 1000000
                    deal_value = val
                    break
                except ValueError:
                    continue
            if deal_value:
                break
                
        # Search patterns for payment type (cash vs stock vs mixed)
        text_lower = text.lower()
        has_cash = "cash" in text_lower or "all-cash" in text_lower
        has_stock = "stock" in text_lower or "share exchange" in text_lower or "common shares" in text_lower
        
        if has_cash and not has_stock:
            payment_type = "cash"
        elif has_stock and not has_cash:
            payment_type = "stock"
        elif has_cash and has_stock:
            payment_type = "mixed"
            
        return {
            "deal_value_million": deal_value,
            "payment_type": payment_type,
            "extracted_successfully": deal_value is not None
        }
    except Exception as e:
        print(f"Error parsing filing {filing_url}: {e}")
        return {
            "deal_value_million": None,
            "payment_type": "mixed",
            "extracted_successfully": False
        }
