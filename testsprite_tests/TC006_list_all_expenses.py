import requests
import time

BASE_URL = "http://localhost:3001"
EXPENSES_ENDPOINT = f"{BASE_URL}/api/v1/expenses"
TIMEOUT = 30


def test_list_all_expenses():
    # Define a valid expense payload per PRD
    expense_example = {
        "category": "Feed",
        "description": "Cost of cattle feed",
        "totalAmount": 150.75,
        "dueDate": "2025-09-20T12:00:00"
    }

    try:
        # Step 2: Create a new expense to guarantee at least one record
        headers = {"Content-Type": "application/json"}
        create_resp = requests.post(EXPENSES_ENDPOINT, json=expense_example, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Unexpected status code on expense creation: {create_resp.status_code}"
        created_expense = create_resp.json()
        created_expense_id = created_expense.get("id")
        assert created_expense_id is not None, "Created expense has no ID"

        # Step 3: List all expenses and validate response
        list_resp = requests.get(EXPENSES_ENDPOINT, timeout=TIMEOUT)
        assert list_resp.status_code == 200, f"Failed to list expenses, status code: {list_resp.status_code}"
        expenses_list = list_resp.json()
        assert isinstance(expenses_list, list), "Expenses response is not a list"

        matching_expense = next((item for item in expenses_list if item.get("id") == created_expense_id), None)
        assert matching_expense is not None, "Created expense not found in the list of expenses"

        # Validate data types of expense fields
        for expense in expenses_list:
            assert isinstance(expense.get("category"), (str, type(None))), "Expense category is not a string or None"
            assert isinstance(expense.get("description"), (str, type(None))), "Expense description is not a string or None"
            assert isinstance(expense.get("totalAmount"), (int, float, type(None))), "Expense totalAmount is not a number or None"
            due_date = expense.get("dueDate")
            assert isinstance(due_date, (str, type(None))), "Expense dueDate is not a string or None"
            if due_date is not None:
                try:
                    time.strptime(due_date[:19], "%Y-%m-%dT%H:%M:%S")
                except Exception:
                    assert False, f"Expense dueDate not in valid ISO8601 format: {due_date}"

    finally:
        if 'created_expense_id' in locals():
            try:
                del_resp = requests.delete(f"{EXPENSES_ENDPOINT}/{created_expense_id}", timeout=TIMEOUT)
                assert del_resp.status_code in (200, 204), f"Failed to delete expense with id {created_expense_id}"
            except Exception:
                pass


test_list_all_expenses()
