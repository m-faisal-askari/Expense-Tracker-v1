from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from backend.app.engine.money import from_cents, to_cents, convert, _dec

# Precision constants
CENT = Decimal("0.01")
SUB_CENT = Decimal("0.0001")

def round_money(value: Decimal) -> Decimal:
    """Rounds a Decimal value to standard 2 decimal places using standard ROUND_HALF_UP."""
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)

def to_decimal(value: Any) -> Decimal:
    """Safely converts float, int, str or Decimal into precise Decimal."""
    if value is None:
        return Decimal("0.00")
    return Decimal(str(value))

class FinancialEngine:
    """
    Authoritative Financial Calculation Engine.
    All calculations operate on Python Decimals and conform to freelance accounting rules:
    - Invoices are receivables, not cash receipts until paid.
    - Internal account transfers net to 0.00 cash flow and are neither income nor expense.
    - Business profit excludes personal expenses.
    - Historical exchange rates are preserved and respected.
    """

    @staticmethod
    def calculate_invoice_totals(
        items: List[Dict[str, Any]], 
        discount_amount: Decimal = Decimal("0.00"), 
        tax_rate_percent: Decimal = Decimal("0.00")
    ) -> Dict[str, Decimal]:
        """
        Calculates subtotal, discount, tax, and final invoice total.
        """
        subtotal = Decimal("0.00")
        for item in items:
            qty = to_decimal(item.get("quantity", 1))
            unit_price = to_decimal(item.get("unit_price", 0))
            line_total = (qty * unit_price).quantize(CENT, rounding=ROUND_HALF_UP)
            subtotal += line_total
            
        discount = to_decimal(discount_amount).quantize(CENT, rounding=ROUND_HALF_UP)
        discounted_subtotal = max(Decimal("0.00"), subtotal - discount)
        
        tax_rate = to_decimal(tax_rate_percent)
        tax_amount = (discounted_subtotal * (tax_rate / Decimal("100.00"))).quantize(CENT, rounding=ROUND_HALF_UP)
        
        total_amount = discounted_subtotal + tax_amount
        return {
            "subtotal": subtotal,
            "discount_amount": discount,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
        }

    @staticmethod
    def calculate_dashboard_metrics(
        db: Session,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        tax_reserve_rate: Decimal = Decimal("25.00"),
        target_currency: str = "USD"
    ) -> Dict[str, Any]:
        """
        Calculates all dashboard metrics authoritatively on the backend in the target requested currency.
        """
        from backend.app.models.models import Transaction, TransactionType, Account, Invoice, InvoiceStatus

        # Base transaction query for user within date range
        tx_query = db.query(Transaction).filter(
            Transaction.user_id == user_id,
            Transaction.status == "CONFIRMED"
        )
        if start_date:
            tx_query = tx_query.filter(Transaction.date >= start_date)
        if end_date:
            tx_query = tx_query.filter(Transaction.date <= end_date)

        transactions = tx_query.all()

        gross_income = Decimal("0.00")
        net_received_income = Decimal("0.00")
        total_expenses = Decimal("0.00")
        business_income = Decimal("0.00")
        business_expenses = Decimal("0.00")
        deductible_business_expenses = Decimal("0.00")
        personal_expenses = Decimal("0.00")

        for tx in transactions:
            # tx.amount and tx.fee_amount are integer cents in tx.currency
            # convert() returns a display Decimal in the target currency
            base_amt = convert(tx.amount, tx.currency, target_currency)
            fee_amt = convert(tx.fee_amount, tx.currency, target_currency)

            if tx.type == TransactionType.INCOME:
                gross_income += base_amt
                net_received = max(Decimal("0.00"), base_amt - fee_amt)
                net_received_income += net_received
                if tx.is_business:
                    business_income += net_received

            elif tx.type == TransactionType.EXPENSE:
                total_expenses += base_amt
                if tx.is_business:
                    business_expenses += base_amt
                    if tx.is_tax_deductible:
                        deductible_business_expenses += base_amt
                else:
                    personal_expenses += base_amt

            # TransactionType.TRANSFER has zero impact on income/expense/cash flow totals

        net_cash_flow = net_received_income - total_expenses
        business_profit = business_income - business_expenses

        # Total consolidated balance across all active accounts converted to target currency
        accounts = db.query(Account).filter(
            Account.user_id == user_id,
            Account.is_archived == False
        ).all()
        total_account_balance = Decimal("0.00")
        for a in accounts:
            total_account_balance += convert(a.current_balance, a.currency, target_currency)

        # Outstanding invoices converted to target currency
        open_invoices = db.query(Invoice).filter(
            Invoice.user_id == user_id,
            Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE])
        ).all()
        outstanding_invoices = Decimal("0.00")
        for inv in open_invoices:
            outstanding_invoices += convert(inv.balance_due, inv.currency, target_currency)

        # Estimated Tax Reserve calculation
        taxable_profit = max(Decimal("0.00"), business_income - deductible_business_expenses)
        estimated_tax_reserve = (taxable_profit * (tax_reserve_rate / Decimal("100.00"))).quantize(CENT, rounding=ROUND_HALF_UP)

        return {
            "currency": target_currency,
            "gross_income": round_money(gross_income),
            "total_income": round_money(net_received_income),
            "net_received_income": round_money(net_received_income),
            "total_expenses": round_money(total_expenses),
            "net_cash_flow": round_money(net_cash_flow),
            "business_profit": round_money(business_profit),
            "personal_expenses": round_money(personal_expenses),
            "total_account_balance": round_money(total_account_balance),
            "outstanding_invoices": round_money(outstanding_invoices),
            "estimated_tax_reserve": estimated_tax_reserve,
            "period": {
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None
            }
        }

    @staticmethod
    def recalculate_account_balance(db: Session, account_id: str) -> Decimal:
        """
        Calculates and updates an account's balance from opening_balance and all confirmed transactions.
        """
        from backend.app.models.models import Account, Transaction, TransactionType

        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            return Decimal("0.00")

        # opening_balance is integer cents
        balance = account.opening_balance or 0

        # Inflows: Income deposited directly into account OR Transfer where this account is destination
        inflows = db.query(Transaction).filter(
            Transaction.status == "CONFIRMED",
            or_(
                and_(Transaction.type == TransactionType.INCOME, Transaction.destination_account_id == account_id),
                and_(Transaction.type == TransactionType.TRANSFER, Transaction.destination_account_id == account_id)
            )
        ).all()

        for tx in inflows:
            if tx.type == TransactionType.INCOME:
                # Net received amount enters account (amount and fee_amount are integer cents)
                balance += (tx.amount or 0) - (tx.fee_amount or 0)
            elif tx.type == TransactionType.TRANSFER:
                balance += (tx.amount or 0)

        # Outflows: Expense paid from account OR Transfer where this account is source
        outflows = db.query(Transaction).filter(
            Transaction.status == "CONFIRMED",
            or_(
                and_(Transaction.type == TransactionType.EXPENSE, Transaction.source_account_id == account_id),
                and_(Transaction.type == TransactionType.TRANSFER, Transaction.source_account_id == account_id)
            )
        ).all()

        for tx in outflows:
            balance -= (tx.amount or 0)

        account.current_balance = balance
        db.add(account)
        db.commit()
        db.refresh(account)
        return from_cents(balance)
