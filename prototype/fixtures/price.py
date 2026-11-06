"""Intentionally broken fixture used to produce a REAL failing unittest result."""
def compute_total(price, discount):
    return price + discount  # BUG: discount is fractional, not an amount
