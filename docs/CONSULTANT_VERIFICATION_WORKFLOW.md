# Consultant Verification Workflow - Implementation Guide

## Overview
Complete implementation of the consultant verification and rejection workflow in the Expert Raah admin panel with email notifications.

## ✅ Implementation Status: COMPLETE

### Backend Implementation

#### 1. Email Service (`backend/src/services/email.service.ts`)
**Added Email Templates:**

- ✅ `sendConsultantVerificationApproved(consultantEmail, consultantName)`
  - Professional approval email with congratulations message
  - Includes "What's Next?" section with actionable items
  - Call-to-action button linking to consultant dashboard
  - Styled with gradient header and branded colors

- ✅ `sendConsultantVerificationRejected(consultantEmail, consultantName, reason?)`
  - Professional rejection email with constructive feedback
  - Optional rejection reason displayed in highlighted section
  - "What You Can Do" guidance for reapplication
  - Call-to-action button for profile update and reapplication
  - Support contact information included

**Email Features:**
- Responsive HTML design with inline CSS
- Brand colors (#0db4bc primary, #ef4444 for rejection)
- Gradient headers for visual appeal
- Clear call-to-action buttons
- Professional tone and helpful guidance
- Mobile-friendly layout

#### 2. Admin Service (`backend/src/modules/admin/admin.service.ts`)
**Updated Functions:**

- ✅ `verifyConsultantAdmin(consultantId)`
  - Sets `isVerified: true` on Consultant model
  - Updates User model's `isVerified: true`
  - **NEW**: Sends approval email notification
  - Error handling for failed email sends (logs but doesn't break workflow)

- ✅ `declineConsultant(consultantId, reason?)`
  - Sets `isVerified: false` on Consultant model
  - Adds `declinedAt: new Date()` timestamp
  - **NEW**: Accepts optional rejection reason parameter
  - **NEW**: Sends rejection email notification with reason
  - Error handling for failed email sends (logs but doesn't break workflow)

- ✅ `getPendingConsultants()`
  - Lists all consultants awaiting admin approval
  - Populates user details (name, email)
  - Includes wallet and withdrawal method information
  - Sorts by creation date (newest first)

**Import Added:**
```typescript
import { emailService } from '../../services/email.service';
```

#### 3. Admin Controller (`backend/src/modules/admin/admin.controller.ts`)
**Updated Functions:**

- ✅ `declineConsultant` - Now accepts `req.body.reason` parameter
  - Passes rejection reason to service layer
  - Returns updated consultant data

**Existing Functions (Already Implemented):**
- ✅ `verifyConsultantAdmin` - Approves consultant
- ✅ `getPendingConsultants` - Lists pending consultants
- ✅ `getConsultantDetailForAdmin` - Views consultant details

#### 4. Admin Routes (`backend/src/modules/admin/admin.routes.ts`)
**Existing Routes (Already Implemented):**
- ✅ `GET /admin/consultants/pending` - List pending consultants
- ✅ `GET /admin/consultants/verified` - List verified consultants
- ✅ `GET /admin/consultants/:consultantId/detail` - View consultant details
- ✅ `PATCH /admin/consultants/:consultantId/verify` - Approve consultant
- ✅ `PATCH /admin/consultants/:consultantId/decline` - Reject consultant

All routes protected with:
- `authenticate` middleware (JWT verification)
- `verifyAdmin` function (admin role check)
- MongoDB ID validation

### Frontend Implementation

#### 5. Admin Dashboard (`frontend/src/pages/AdminDashboardPage.tsx`)
**New State Variables:**
```typescript
const [rejectionReason, setRejectionReason] = useState('');
const [showRejectionDialog, setShowRejectionDialog] = useState(false);
const [pendingRejectionId, setPendingRejectionId] = useState<string | null>(null);
```

**Updated Functions:**

- ✅ `handleDeclineConsultant(id)` - Now sends rejection reason in request body
  ```typescript
  await httpClient.patch(`/admin/consultants/${id}/decline`, {
    reason: rejectionReason || undefined
  });
  ```

**New Functions:**

- ✅ `openRejectionDialog(id)` - Opens rejection reason dialog
- ✅ `closeRejectionDialog()` - Closes dialog and resets state
- ✅ `confirmRejection()` - Confirms and executes rejection with reason

**Updated UI Components:**

1. **Consultant Table Actions:**
   - Changed decline button to open dialog instead of direct rejection
   - Icons: `FaTimesCircle` for unverify/decline
   - Hover effects and tooltips

2. **Document Modal Actions:**
   - Decline button now opens rejection reason dialog
   - Styled with red gradient theme
   - Maintains existing approve button functionality

3. **New Rejection Dialog Modal:**
   - Clean, professional design with Material-UI
   - Optional multiline text field for rejection reason
   - Helpful placeholder text with examples
   - Two-button layout: Cancel / Confirm Decline
   - Red gradient "Confirm Decline" button
   - Close button (X) in header

**Modal Features:**
- Centered on screen
- White background with rounded corners
- Shadow for depth
- Responsive width (90% max 500px)
- Informative description text
- Accessible close options (button + cancel)

## API Endpoints Summary

### Consultant Verification Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/admin/consultants/pending` | List pending consultant applications | - | `{ success: true, data: Consultant[] }` |
| GET | `/admin/consultants/verified` | List verified consultants | - | `{ success: true, data: Consultant[] }` |
| GET | `/admin/consultants/:consultantId/detail` | Get consultant details with documents | - | `{ success: true, data: ConsultantDetail }` |
| PATCH | `/admin/consultants/:consultantId/verify` | Approve consultant verification | - | `{ success: true, data: Consultant }` |
| PATCH | `/admin/consultants/:consultantId/decline` | Reject consultant verification | `{ reason?: string }` | `{ success: true, data: Consultant }` |

## Email Notification Flow

### Approval Flow:
1. Admin clicks "Approve" button on consultant
2. Backend updates `isVerified: true` on Consultant and User models
3. Email service sends approval email to consultant
4. Email includes:
   - Congratulations message
   - Next steps guidance
   - Dashboard link
   - Expert Raah branding

### Rejection Flow:
1. Admin clicks "Decline" button on consultant
2. Rejection reason dialog opens
3. Admin enters reason (optional) and confirms
4. Backend updates `isVerified: false` and adds `declinedAt` timestamp
5. Email service sends rejection email with reason
6. Email includes:
   - Professional rejection message
   - Reason for rejection (if provided)
   - Guidance for improvement
   - Reapplication instructions
   - Support contact

## Testing the Workflow

### Manual Testing Steps:

1. **View Pending Consultants:**
   ```
   - Login as admin
   - Navigate to Admin Dashboard
   - Click "Consultants" tab
   - Filter by "Unverified" to see pending applications
   ```

2. **Approve Consultant:**
   ```
   - Click "View" icon on pending consultant
   - Review verification documents (ID cards, etc.)
   - Click "Approve" button
   - Consultant receives approval email
   - Consultant status changes to verified
   ```

3. **Reject Consultant:**
   ```
   - Click "Decline" button on pending consultant
   - Rejection dialog appears
   - Enter reason (e.g., "ID document is unclear")
   - Click "Confirm Decline"
   - Consultant receives rejection email with reason
   - Consultant status remains unverified with declinedAt timestamp
   ```

4. **Verify Email Notifications:**
   ```
   - Check consultant's email inbox
   - Verify approval email has correct formatting and links
   - Verify rejection email includes the reason provided
   ```

### API Testing with Postman/curl:

**Approve Consultant:**
```bash
curl -X PATCH http://localhost:8000/api/admin/consultants/{consultantId}/verify \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

**Reject Consultant with Reason:**
```bash
curl -X PATCH http://localhost:8000/api/admin/consultants/{consultantId}/decline \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "ID card image is too blurry to verify"}'
```

## Database Schema

### Consultant Model Fields (Relevant):
```typescript
{
  userId: ObjectId,           // Reference to User model
  isVerified: Boolean,        // Verification status (default: false)
  declinedAt: Date,          // Timestamp when rejected (optional)
  idCardFront: String,       // ID card front image URL
  idCardBack: String,        // ID card back image URL
  supportingDocuments: [String], // Additional document URLs
  // ... other fields
}
```

### User Model Fields (Relevant):
```typescript
{
  _id: ObjectId,
  name: String,
  email: String,
  accountType: 'buyer' | 'consultant',
  isVerified: Boolean,       // Synced with Consultant.isVerified
  roles: [String],           // e.g., ['user', 'consultant']
  // ... other fields
}
```

## Environment Variables Required

```env
# SMTP Configuration (required for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@expertraah.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

## Features Implemented

✅ Backend service functions for approve/reject
✅ Email notification system with professional templates
✅ Admin controller endpoints with reason parameter
✅ Frontend rejection reason dialog
✅ Optional rejection reason field
✅ Email delivery error handling (non-blocking)
✅ User model verification status sync
✅ Timestamp tracking for rejections
✅ Existing consultant list/detail/filter functionality
✅ Document viewing modal
✅ Admin role verification middleware

## User Experience Flow

### Admin Perspective:
1. Views list of pending consultant applications
2. Clicks to view consultant details and documents
3. Reviews verification documents (ID cards, etc.)
4. Makes decision:
   - **Approve**: One-click approval, consultant notified via email
   - **Decline**: Opens dialog, enters reason, confirms, consultant notified via email
5. Consultant removed from pending list
6. Can view verified consultants list

### Consultant Perspective:
1. Submits verification documents
2. Waits for admin review
3. Receives email notification:
   - **Approved**: Can access all consultant features, dashboard link provided
   - **Rejected**: Understands rejection reason, knows how to improve and reapply
4. If rejected: Updates profile/documents and resubmits

## Code Quality

- ✅ TypeScript type safety maintained
- ✅ Error handling for email failures (non-blocking)
- ✅ Consistent code style with existing codebase
- ✅ No compilation errors
- ✅ Professional email templates with branding
- ✅ Optional parameters for flexibility
- ✅ Clean separation of concerns (service/controller/routes)
- ✅ Reusable email service methods

## Future Enhancements (Optional)

- [ ] Add rejection reason templates (dropdown)
- [ ] Track rejection history on consultant profile
- [ ] Admin dashboard analytics for approval/rejection rates
- [ ] Bulk approve/reject functionality
- [ ] Document quality validation (image blur detection)
- [ ] Automatic re-review after rejection improvements
- [ ] In-app notification system (in addition to email)
- [ ] Rejection appeal workflow

## Conclusion

The consultant rejection workflow is now **fully implemented** with:
- Complete backend service layer
- Email notifications for both approval and rejection
- Professional email templates with branding
- Frontend dialog for entering rejection reasons
- Existing UI integration (no breaking changes)
- Error handling and logging
- Type-safe TypeScript implementation

All components work together seamlessly to provide a professional verification workflow for the Expert Raah platform.
