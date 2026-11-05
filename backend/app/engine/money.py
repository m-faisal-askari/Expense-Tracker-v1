"""
Centralised money representation and conversion.

STORAGE CONVENTION
==================
Every monetary column in the database is a ``BigInteger`` that holds the
amount expressed in the **minor unit** (cents) of the *original* currency.

    50 000.00 PKR  →  5_000_000  (50 000 × 100)
    1 999.99 USD   →    199_999  ( 1 999.99 × 100)

The ``currency`` column beside it records *which* currency those cents
belong to, so an exact round-trip is always possible:

    display_amount = cents / 100

Cross-currency conversions go through a USD mid-rate table:

    PKR → USD → EUR   (convert source → USD → target)

All helpers live in this module so the rest of the application never
touches raw exchange arithmetic.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Union

# ---------------------------------------------------------------------------
#  Exchange rates  —  1 unit of <currency> = X USD
# ---------------------------------------------------------------------------
RATES_TO_USD = {
    "USD": Decimal("1.000000"),
    "PKR": Decimal("0.003590"),     # 1 PKR ≈ 0.00359 USD  (1 USD ≈ 278.55 PKR)
    "EUR": Decimal("1.085000"),     # 1 EUR ≈ 1.085  USD
    "GBP": Decimal("1.295000"),     # 1 GBP ≈ 1.295  USD
    "CAD": Decimal("0.720000"),
    "AUD": Decimal("0.660000"),
    "INR": Decimal("0.011900"),
    "JPY": Decimal("0.006600"),
    "SGD": Decimal("0.755000"),
}

# Every currency uses a ×100 minor-unit factor (same as Stripe convention).
MINOR_UNIT = 100


# ---------------------------------------------------------------------------
#  Core helpers
# ---------------------------------------------------------------------------

def _dec(value: Union[int, float, str, Decimal, None]) -> Decimal:
    """Coerce any numeric-ish value to Decimal, treating None / empty as 0."""
    if value is None:
        return Decimal("0")
    if isinstance(value, Decimal):
        return value
    s = str(value).strip()
    if s == "" or s.lower() in ("none", "null"):
        return Decimal("0")
    return Decimal(s)


def to_cents(amount: Union[int, float, str, Decimal, None],
             currency: str = "USD") -> int:
    """
    Convert a human-readable amount into integer cents in the *same* currency.

    >>> to_cents(199.99)
    19999
    >>> to_cents("50000.00", "PKR")
    5000000
    """
    d = _dec(amount)
    return int((d * MINOR_UNIT).to_integral_value(rounding=ROUND_HALF_UP))


def from_cents(cents: Union[int, None],
               currency: str = "USD") -> Decimal:
    """
    Convert stored integer cents back to a human-readable Decimal.

    >>> from_cents(19999)
    Decimal('199.99')
    """
    if cents is None:
        return Decimal("0.00")
    return (Decimal(str(cents)) / Decimal(str(MINOR_UNIT))).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


def convert(cents: Union[int, None],
            from_currency: str,
            to_currency: str) -> Decimal:
    """
    Convert cents stored in *from_currency* to a display-ready Decimal in
    *to_currency*.

    >>> convert(5000000, "PKR", "USD")   # 50 000 PKR → ~179.50 USD
    Decimal('179.50')
    """
    if cents is None or cents == 0:
        return Decimal("0.00")

    src = from_currency.upper() if from_currency else "USD"
    tgt = to_currency.upper() if to_currency else "USD"

    if src == tgt:
        return from_cents(cents)

    original = from_cents(cents)               # e.g. 50 000.00
    rate_src = RATES_TO_USD.get(src, Decimal("1"))
    rate_tgt = RATES_TO_USD.get(tgt, Decimal("1"))

    usd = original * rate_src                  # → USD
    target = usd / rate_tgt                    # → target currency
    return target.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def convert_to_cents(amount: Union[int, float, str, Decimal, None],
                     from_currency: str,
                     to_currency: str) -> int:
    """
    Convert a display amount in *from_currency* directly to cents in
    *to_currency*.
    """
    d = _dec(amount)
    if from_currency.upper() == to_currency.upper():
        return to_cents(d)
    rate_src = RATES_TO_USD.get(from_currency.upper(), Decimal("1"))
    rate_tgt = RATES_TO_USD.get(to_currency.upper(), Decimal("1"))
    usd = d * rate_src
    target = usd / rate_tgt
    return to_cents(target)


def sum_cents(items, amount_attr: str, currency_attr: str,
              target_currency: str) -> Decimal:
    """
    Aggregate a list of ORM objects by converting each item's cents to
    *target_currency* and summing into a display-ready Decimal.
    """
    total = Decimal("0.00")
    for item in items:
        cents_val = getattr(item, amount_attr, 0) or 0
        curr = getattr(item, currency_attr, "USD") or "USD"
        total += convert(cents_val, curr, target_currency)
    return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def rate_for(currency: str) -> Decimal:
    """Return the USD exchange rate for *currency*."""
    return RATES_TO_USD.get(currency.upper(), Decimal("1"))


def fmt(cents: Union[int, None], currency: str = "USD") -> str:
    """Quick CLI-friendly format: ``$1,234.56`` / ``Rs. 50,000.00``."""
    d = from_cents(cents)
    if currency.upper() == "PKR":
        return f"Rs. {d:,.2f}"
    return f"${d:,.2f}"
