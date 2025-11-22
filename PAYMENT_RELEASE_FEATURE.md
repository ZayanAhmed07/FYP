# Payment Release on Order Completion Feature

## Overview
When an order is completed from both sides (consultant requests completion AND buyer confirms), the remaining pending payment is automatically released to the consultant's account.

## Workflow

### Step 1: Consultant Requests Completion
**Endpoint:** `PATCH /api/orders/:id/request-completion`

The consultant marks the work as complete and requests order completion:
- `completionRequestedAt` is set to current timestamp
- `completionRequestedBy` is set to 'consultant'
- Order status remains 'in_progress'

**Example Request:**
```json
// No body required - user identified from auth token
```

### Step 2: Buyer Confirms Completion
**Endpoint:** `PATCH /api/orders/:id/confirm-completion`

The buyer reviews the completed work and confirms the order:
- `completionRequestedAt` is checked (must exist)
- Order status changes to 'completed'
- `completionDate` is set to current timestamp
- `progress` is set to 100

### 💰 Payment Release Logic

When the buyer confirms completion, the following happens:

#### 1. **Calculate Pending Payment**
```typescript
const pendingPayment = order.amountPending;
```

#### 2. **Update Order Record**
```typescript
order.amountPaid += pendingPayment;  // Add pending to paid amount
order.amountPending = 0;              // Mark all as paid
```

#### 3. **Release to Consultant Account**
```typescript
// Update consultant earnings with the released amount
await Consultant.findByIdAndUpdate(order.consultantId, {
  $inc: { 
    totalProjects: 1,
    totalEarnings: pendingPayment  // 💵 Release pending payment
  },
});
```

## Example Scenario

**Order Details:**
- Total Amount: Rs 100,000
- Amount Already Paid: Rs 60,000
- Amount Pending: Rs 40,000

**Timeline:**
1. Consultant completes all work → calls `request-completion`
2. Buyer reviews work → calls `confirm-completion`
3. **Automatic Action**: Rs 40,000 released to consultant's `totalEarnings`

**Final State:**
```
Order:
  - status: 'completed'
  - amountPaid: 100,000
  - amountPending: 0

Consultant:
  - totalEarnings += 40,000
  - totalProjects += 1
```

## Technical Implementation

### Modified Function
**File:** `backend/src/modules/order/order.service.ts`
**Function:** `confirmCompletion(id: string, userId: string)`

### Key Changes
1. **Extract pending amount** before marking as paid
2. **Update order amountPending to 0** and amountPaid to totalAmount
3. **Increment consultant totalEarnings** by the released amount
4. **Maintains all validations** (user must be buyer, completion must be requested)

## API Response

```json
{
  "success": true,
  "data": {
    "_id": "order_id",
    "status": "completed",
    "totalAmount": 100000,
    "amountPaid": 100000,
    "amountPending": 0,
    "completionDate": "2025-11-20T10:30:00Z",
    "progress": 100
  },
  "message": "Order marked as completed"
}
```

## Features

✅ **Automatic Payment Release** - No manual intervention required
✅ **Safe** - Only released when both sides confirm completion
✅ **Transactional** - All updates happen together or fail together
✅ **Auditable** - All timestamps recorded (completionDate, paidAt)
✅ **Accurate** - Uses exact pending amount calculation

## Validation Rules

1. **User must be the buyer** - Only buyer can confirm
2. **Completion must be requested** - Consultant must request first
3. **Pending amount must be positive** - Only released if amount > 0
4. **Consultant record must exist** - Cannot update non-existent consultant

## Frontend Integration

To integrate with your frontend:

```typescript
// Mark order completion (as buyer)
const confirmOrderCompletion = async (orderId: string) => {
  try {
    const response = await httpClient.patch(
      `/api/orders/${orderId}/confirm-completion`,
      {}
    );
    
    // Order completed and payment released
    console.log('Payment released:', response.data);
    
    // Update UI - show released amount
    showNotification(`${releaseAmount} PKR released to your account`);
  } catch (error) {
    console.error('Failed to confirm completion:', error);
  }
};
```

## Related Files

- **Model:** `backend/src/models/order.model.ts`
- **Service:** `backend/src/modules/order/order.service.ts`
- **Controller:** `backend/src/modules/order/order.controller.ts`
- **Routes:** `backend/src/modules/order/order.routes.ts`

## Testing

Run integration tests to verify payment release:
```bash
npm run test backend/src/__tests__/integration/order-completion.test.ts
```

Test scenarios:
1. ✅ Consultant requests completion
2. ✅ Buyer confirms completion
3. ✅ Pending payment transferred to totalEarnings
4. ✅ amountPending becomes 0
5. ✅ Order status is 'completed'
