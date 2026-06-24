import pytest
from data_pipeline.car_calculator import calculate_car

def test_calculate_car_fallback():
    # Test fallback behavior with a invalid/delisted ticker
    car = calculate_car("INVALID_TICKER_XYZ", "2023-01-01")
    assert car == 0.0

def test_calculate_car_valid():
    # Test with a known active ticker like AAPL or MSFT
    # We choose a date that was a trading day
    car = calculate_car("AAPL", "2023-05-15")
    assert isinstance(car, float)
