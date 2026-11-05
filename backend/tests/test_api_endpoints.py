import uuid
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def d(val):
    return Decimal(str(val))

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_api_workflow_end_to_end():
    test_run_id = uuid.uuid4().hex[:6]
    headers = {"Authorization": f"Bearer dev-user-e2e-{test_run_id}"}

    # 1. Profile initialization
    res_prof = client.get("/api/v1/auth/profile", headers=headers)
    assert res_prof.status_code == 200
    assert res_prof.json()["base_currency"] in ("USD", "PKR")

    # 2. Create Account
    res_acc = client.post("/api/v1/accounts", json={
        "name": "Business Checking",
        "account_type": "BANK",
        "currency": "USD",
        "opening_balance": "1000.00"
    }, headers=headers)
    assert res_acc.status_code == 201
    account_id = res_acc.json()["id"]

    # 3. Create Client
    res_client = client.post("/api/v1/clients", json={
        "name": "Acme Corp",
        "company_name": "Acme Technologies LLC",
        "email": "finance@acme.corp",
        "default_currency": "USD"
    }, headers=headers)
    assert res_client.status_code == 201
    client_id = res_client.json()["id"]

    # 4. Create Project
    res_proj = client.post("/api/v1/projects", json={
        "name": "Website Redesign",
        "client_id": client_id,
        "agreed_amount": "5000.00",
        "currency": "USD",
        "budget": "500.00"
    }, headers=headers)
    assert res_proj.status_code == 201
    project_id = res_proj.json()["id"]

    # 5. Create Invoice with Line Items
    inv_num = f"INV-{test_run_id}"
    res_inv = client.post("/api/v1/invoices", json={
        "client_id": client_id,
        "project_id": project_id,
        "invoice_number": inv_num,
        "due_date": "2026-12-01",
        "currency": "USD",
        "items": [
            {"description": "Design phase", "quantity": "1", "unit_price": "2000.00"},
            {"description": "Frontend implementation", "quantity": "1", "unit_price": "1000.00"}
        ],
        "discount_amount": "100.00",
        "tax_rate": "5.00"
    }, headers=headers)
    assert res_inv.status_code == 201
    inv_data = res_inv.json()
    assert d(inv_data["subtotal"]) == Decimal("3000.00")
    assert d(inv_data["discount_amount"]) == Decimal("100.00")
    assert d(inv_data["tax_amount"]) == Decimal("145.00")
    assert d(inv_data["total_amount"]) == Decimal("3045.00")
    assert d(inv_data["balance_due"]) == Decimal("3045.00")
    invoice_id = inv_data["id"]

    # Verify issuing an invoice DID NOT increment received cash
    dash_pre = client.get("/api/v1/dashboard/summary?period=this_year&currency=USD", headers=headers).json()
    assert d(dash_pre["total_income"]) == Decimal("0.00")
    assert d(dash_pre["outstanding_invoices"]) == Decimal("3045.00")

    # 6. Record Partial Payment: $1,500
    res_pay = client.post(f"/api/v1/invoices/{invoice_id}/payments", json={
        "amount": "1500.00",
        "fee_amount": "45.00",
        "account_id": account_id
    }, headers=headers)
    assert res_pay.status_code == 200
    pay_data = res_pay.json()
    assert d(pay_data["amount_paid"]) == Decimal("1500.00")
    assert d(pay_data["balance_due"]) == Decimal("1545.00")
    assert pay_data["status"] == "PARTIALLY_PAID"

    # Check that Income is recorded as net ($1500 - $45 = $1455)
    dash_post = client.get("/api/v1/dashboard/summary?period=this_year&currency=USD", headers=headers).json()
    assert d(dash_post["net_received_income"]) == Decimal("1455.00")
    assert d(dash_post["outstanding_invoices"]) == Decimal("1545.00")

    # 7. Record Business Expense: $200
    res_exp = client.post("/api/v1/transactions", json={
        "type": "EXPENSE",
        "amount": "200.00",
        "currency": "USD",
        "description": "Figma Professional Plan",
        "source_account_id": account_id,
        "is_business": True,
        "is_tax_deductible": True
    }, headers=headers)
    assert res_exp.status_code == 201

    # 8. Check Profit & Loss Report
    res_pnl = client.get("/api/v1/reports/profit-loss?start_date=2026-01-01&end_date=2026-12-31&currency=USD", headers=headers)
    assert res_pnl.status_code == 200
    pnl = res_pnl.json()
    assert d(pnl["net_revenue"]) == Decimal("1455.00")
    assert d(pnl["total_operating_expenses"]) == Decimal("200.00")
    assert d(pnl["operating_profit"]) == Decimal("1255.00")

    # 9. Verify PDF invoice download returns valid binary
    res_pdf = client.get(f"/api/v1/invoices/{invoice_id}/pdf", headers=headers)
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert len(res_pdf.content) > 500

    # 10. Verify CSV export returns valid CSV
    res_csv = client.get("/api/v1/transactions/export/csv", headers=headers)
    assert res_csv.status_code == 200
    assert "Transaction ID,Date,Type" in res_csv.text
