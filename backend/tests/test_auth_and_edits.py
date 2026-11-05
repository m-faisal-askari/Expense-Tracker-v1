import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_guest_access_without_authentication():
    # Calling endpoints without any auth header should seamlessly return guest data
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == "guest-freelancer-user"
    assert data["is_guest"] is True

    # Guest can access dashboard summary without token
    res_dash = client.get("/api/v1/dashboard/summary")
    assert res_dash.status_code == 200

def test_email_password_and_google_auth():
    uid = uuid.uuid4().hex[:6]
    email = f"user_{uid}@example.com"
    password = "SecretPassword123!"

    # 1. Register new user
    res_reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "full_name": f"Tester {uid}"
    })
    assert res_reg.status_code == 200
    token = res_reg.json()["access_token"]
    assert token

    # 2. Login with registered user
    res_login = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert res_login.status_code == 200
    assert res_login.json()["email"] == email

    # 3. Google OAuth simulation
    res_google = client.post("/api/v1/auth/google", json={
        "email": f"google_{uid}@gmail.com",
        "full_name": "Google User",
        "google_id": f"g-{uid}"
    })
    assert res_google.status_code == 200
    assert "access_token" in res_google.json()

def test_pkr_currency_and_edit_endpoints():
    uid = uuid.uuid4().hex[:6]
    headers = {"Authorization": f"Bearer auth-tester-{uid}"}

    # Set PKR base currency
    res_prof = client.put("/api/v1/auth/profile", json={
        "base_currency": "PKR",
        "full_name": "Pakistani Freelancer"
    }, headers=headers)
    assert res_prof.status_code == 200
    assert res_prof.json()["base_currency"] == "PKR"

    # Create account in PKR
    res_acc = client.post("/api/v1/accounts", json={
        "name": "Meezan Bank PKR",
        "account_type": "BANK",
        "currency": "PKR",
        "opening_balance": "50000.00"
    }, headers=headers)
    assert res_acc.status_code == 201
    acc_id = res_acc.json()["id"]

    # Edit account
    res_acc_edit = client.put(f"/api/v1/accounts/{acc_id}", json={
        "name": "Meezan Bank Freelance Account",
        "opening_balance": "60000.00"
    }, headers=headers)
    assert res_acc_edit.status_code == 200
    assert res_acc_edit.json()["name"] == "Meezan Bank Freelance Account"

    # Create & Edit Client
    res_cli = client.post("/api/v1/clients", json={
        "name": "Initial Client",
        "default_currency": "PKR"
    }, headers=headers)
    assert res_cli.status_code == 201
    cli_id = res_cli.json()["id"]

    res_cli_edit = client.put(f"/api/v1/clients/{cli_id}", json={
        "name": "Updated Client Name"
    }, headers=headers)
    assert res_cli_edit.status_code == 200
    assert res_cli_edit.json()["name"] == "Updated Client Name"

    # Create & Edit Project
    res_proj = client.post("/api/v1/projects", json={
        "name": "Initial Project",
        "client_id": cli_id,
        "currency": "PKR",
        "agreed_amount": "100000.00"
    }, headers=headers)
    assert res_proj.status_code == 201
    proj_id = res_proj.json()["id"]

    res_proj_edit = client.put(f"/api/v1/projects/{proj_id}", json={
        "name": "Renamed Mobile App Project",
        "agreed_amount": "120000.00"
    }, headers=headers)
    assert res_proj_edit.status_code == 200
    assert res_proj_edit.json()["name"] == "Renamed Mobile App Project"

    # Create & Edit Invoice
    res_inv = client.post("/api/v1/invoices", json={
        "client_id": cli_id,
        "project_id": proj_id,
        "invoice_number": f"PKR-INV-{uid}",
        "currency": "PKR",
        "due_date": "2026-12-31",
        "items": [{"description": "Development", "quantity": "1", "unit_price": "50000.00"}]
    }, headers=headers)
    assert res_inv.status_code == 201
    inv_id = res_inv.json()["id"]

    res_inv_edit = client.put(f"/api/v1/invoices/{inv_id}", json={
        "notes": "Payment terms updated for bank wire"
    }, headers=headers)
    assert res_inv_edit.status_code == 200
    assert res_inv_edit.json()["notes"] == "Payment terms updated for bank wire"

    # Create & Edit Budget
    res_bud = client.post("/api/v1/budgets", json={
        "name": "Q4 Server Budget",
        "total_allocated": "30000.00",
        "period": "MONTHLY",
        "start_date": "2026-11-01",
        "end_date": "2026-11-30"
    }, headers=headers)
    assert res_bud.status_code == 201
    bud_id = res_bud.json()["id"]

    res_bud_edit = client.put(f"/api/v1/budgets/{bud_id}", json={
        "total_allocated": "35000.00"
    }, headers=headers)
    assert res_bud_edit.status_code == 200
    assert Decimal(str(res_bud_edit.json()["total_allocated"])) == Decimal("35000.00")

    # Create & Edit Subscription
    res_sub = client.post("/api/v1/subscriptions", json={
        "name": "GitHub Copilot",
        "amount": "2800.00",
        "currency": "PKR",
        "billing_frequency": "MONTHLY",
        "next_payment_date": "2026-12-01"
    }, headers=headers)
    assert res_sub.status_code == 201
    sub_id = res_sub.json()["id"]

    res_sub_edit = client.put(f"/api/v1/subscriptions/{sub_id}", json={
        "amount": "3000.00"
    }, headers=headers)
    assert res_sub_edit.status_code == 200
    assert Decimal(str(res_sub_edit.json()["amount"])) == Decimal("3000.00")

    # Create & Edit Savings Goal
    res_sav = client.post("/api/v1/savings", json={
        "name": "New Laptop",
        "target_amount": "300000.00",
        "currency": "PKR"
    }, headers=headers)
    assert res_sav.status_code == 201
    sav_id = res_sav.json()["id"]

    res_sav_edit = client.put(f"/api/v1/savings/{sav_id}", json={
        "target_amount": "350000.00"
    }, headers=headers)
    assert res_sav_edit.status_code == 200
    assert Decimal(str(res_sav_edit.json()["target_amount"])) == Decimal("350000.00")

    # Create & Edit Transaction
    res_tx = client.post("/api/v1/transactions", json={
        "type": "EXPENSE",
        "amount": "5000.00",
        "currency": "PKR",
        "description": "Office Supplies",
        "source_account_id": acc_id
    }, headers=headers)
    assert res_tx.status_code == 201
    tx_id = res_tx.json()["id"]

    res_tx_edit = client.put(f"/api/v1/transactions/{tx_id}", json={
        "description": "Office Supplies & Notebooks",
        "amount": "5500.00"
    }, headers=headers)
    assert res_tx_edit.status_code == 200
    assert res_tx_edit.json()["description"] == "Office Supplies & Notebooks"
    assert Decimal(str(res_tx_edit.json()["amount"])) == Decimal("5500.00")
