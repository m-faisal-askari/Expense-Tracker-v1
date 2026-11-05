"""
DEPRECATED — Use ``backend.app.engine.money`` instead.

This module is kept only as a thin compatibility shim so that any stale
imports do not crash at startup.  All new code should import from
``backend.app.engine.money``.
"""

from decimal import Decimal, ROUND_HALF_UP
from backend.app.engine.money import RATES_TO_USD as DEFAULT_EXCHANGE_RATES, convert, from_cents, to_cents

def convert_to_base_currency(
    amount: Decimal, 
    from_currency: str, 
    base_currency: str = "USD", 
    custom_rate: Decimal = None
) -> Decimal:
    """
    DEPRECATED — Use ``money.convert()`` for cents-based conversion.

    This shim converts a display Decimal (not cents) for backward compatibility.
    """
    if amount is None:
        return Decimal("0.00")
        
    from_curr = (from_currency or "USD").strip().upper()
    to_curr = (base_currency or "USD").strip().upper()

    amt = Decimal(str(amount))

    if from_curr == to_curr:
        return amt

    rate_from = DEFAULT_EXCHANGE_RATES.get(from_curr, Decimal("1.000000"))
    rate_to = DEFAULT_EXCHANGE_RATES.get(to_curr, Decimal("1.000000"))

    usd_val = amt * rate_from
    converted = usd_val / rate_to

    return converted.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
