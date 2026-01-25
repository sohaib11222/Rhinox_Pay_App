# Rhinox Pay P2P Frontend Implementation Documentation

## 1. Role Resolution Logic
... (existing content) ...

## 6. Known Bugs & Fixes (Jan 24, 2026)

### 6.1. Incorrect Auto-Completion (FIXED)
*   **Issue:** After clicking "Mark Payment Made", the UI was using a `setTimeout` to automatically move the user to Step 4 ("Order Completed").
*   **Impact:** Users saw "Order Completed" before the vendor actually released the coins.
*   **Fix:** Removed all `setTimeout` logic that auto-advanced steps. The UI now relies strictly on the `status` field from the `GET /p2p/orders/:id` polling. Step 4 is only shown when `status === 'completed'`.

### 6.2. Navigation Role Confusion (FIXED)
*   **Issue:** "Pay Now" was taking users to Step 1 (Accept Order) instead of Step 2 (Payment).
*   **Fix:** Updated `BuyOrder.tsx` to respect the `currentStep` parameter passed via navigation.

### 6.3. Dummy Data in RhinoxPay ID (FIXED)
*   **Issue:** RhinoxPay ID field was showing "NGN1234".
*   **Fix:** Mapped the field to `order.paymentMethod.rhinoxpayId`.

## 7. Critical Backend Requirements for Lifecycle
The frontend polls the order status every 5 seconds. For the UI to transition correctly:
1.  **Awaiting Payment:** Status must be `awaiting_payment`.
2.  **Awaiting Release:** Status must be `payment_made`.
3.  **Completed:** Status must be `completed`.
4.  **Cancelled:** Status must be `cancelled`.
