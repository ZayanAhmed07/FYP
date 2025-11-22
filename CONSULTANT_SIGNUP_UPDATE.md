# Consultant Signup Workflow Update

## Overview
Updated the consultant signup process to capture all profile details during CNIC verification instead of requiring separate profile management page visits. Consultants now submit complete profiles that go directly to admin portal for verification.

## Changes Made

### Frontend Changes

#### 1. VerifyIdentityPage.tsx - Complete Profile Collection
**Location:** `frontend/src/pages/VerifyIdentityPage.tsx`

**New Features:**
- Added professional profile fields:
  - Professional Title (text input)
  - Bio (textarea)
  - Specialization (tag input with add/remove)
  - Hourly Rate in PKR (number input)
  - Years of Experience (text input)
  - Skills (tag input with add/remove)
  
- Enhanced form state management:
  - Added `profileData` state for all profile fields
  - Added `newSpecialization` and `newSkill` for tag inputs
  - Added `loading` and `error` states for better UX

- Improved validation:
  - Validates CNIC uploads (front & back required)
  - Validates all required profile fields
  - Ensures at least one specialization
  - Ensures at least one skill

- File handling:
  - Converts uploaded files to base64 format
  - Bundles all data (profile + documents) in single API call
  - Navigates to verification pending page on success

**UI Enhancements:**
- Professional section with icon headers
- Tag-based inputs for specialization and skills
- Inline add/remove functionality
- Clear error messaging
- Loading states during submission

#### 2. VerifyIdentityPage.module.css - Enhanced Styling
**Location:** `frontend/src/pages/VerifyIdentityPage.module.css`

**New Styles Added:**
- `.profileSection` - Container for profile fields
- `.sectionTitle` with icon support
- `.formGroup` - Individual field containers
- `.label` with icon support
- `.input` and `.textarea` - Form controls
- `.tagInputContainer` - Tag input layout
- `.addButton` - Add specialization/skill button
- `.tagsList` - Tag display container
- `.tag` - Individual tag styling
- `.tagRemove` - Remove tag icon
- `.errorMessage` - Error display styling

**Design Features:**
- 24px border radius for modern look
- 2px borders for emphasis
- Hover effects on tags and buttons
- Focus states with box shadows
- Smooth transitions (0.3s ease)
- Color scheme: #014751 (dark teal), #2d5a5f (mid teal), #e6f2f3 (light teal)

#### 3. VerificationPendingPage.tsx - New Page
**Location:** `frontend/src/pages/VerificationPendingPage.tsx`

**Purpose:** Display waiting message after profile submission

**Features:**
- Animated clock icon (pulse animation)
- Clear messaging about verification process
- Information card with checklist:
  - CNIC and profile review process
  - 24-48 hour timeline
  - Email notification promise
  - Dashboard access post-approval
- Action buttons:
  - Return to Home
  - Go to Login

#### 4. VerificationPendingPage.module.css - Styling
**Location:** `frontend/src/pages/VerificationPendingPage.module.css`

**Features:**
- Centered layout with gradient background
- Large animated icon (pulse keyframes)
- Info card with checkmarks
- Responsive design (mobile breakpoints)
- Professional color scheme matching app theme

#### 5. App.tsx - Route Addition
**Location:** `frontend/src/App.tsx`

**Changes:**
- Imported `VerificationPendingPage`
- Added route: `/verification-pending`
- Positioned after `/verify-identity` route

#### 6. AdminDashboardPage.tsx - Document Viewing
**Location:** `frontend/src/pages/AdminDashboardPage.tsx`

**Enhancements:**
- Updated document modal to display actual images:
  - Shows base64 images for CNIC front/back
  - Displays supporting documents with thumbnails
  - Download links for all documents
  - Fallback to file icons if not base64

**Document Display Logic:**
- Checks if document is base64 (`startsWith('data:')`)
- Renders `<img>` tag for base64 images
- Provides download links with proper filenames
- Shows placeholder icon for non-base64 URLs

#### 7. AdminDashboardPage.module.css - Image Styling
**Location:** `frontend/src/pages/AdminDashboardPage.module.css`

**New Styles:**
- `.docImage` - Full CNIC image display (max 300px height)
- `.docImageWrapper` - Thumbnail container
- `.docThumbnail` - 80x80px supporting doc thumbnails
- Enhanced `.downloadButton` as anchor tag
- Box shadows and borders for images

### Backend Changes

#### 1. consultant.controller.ts - New Endpoint
**Location:** `backend/src/modules/consultant/consultant.controller.ts`

**New Function:** `createCompleteProfile`
- Extracts authenticated user ID from request
- Validates user authentication
- Bundles user ID with profile data
- Calls service to create consultant profile
- Returns success message with data

**Features:**
- Uses `catchAsync` wrapper for error handling
- Returns 201 status on success
- Includes informative success message

#### 2. consultant.service.ts - Profile Creation
**Location:** `backend/src/modules/consultant/consultant.service.ts`

**New Function:** `createCompleteProfile`

**Logic:**
1. Checks for existing consultant profile (prevents duplicates)
2. Parses array fields from FormData format:
   - `specialization[]` → `specialization` array
   - `skills[]` → `skills` array
3. Sets `isVerified: false` by default (admin approval required)
4. Creates consultant document in MongoDB
5. Populates user details (name, email, profileImage, isBanned)
6. Returns complete consultant object

**Error Handling:**
- Throws 400 error if profile already exists
- Validates data through Mongoose schema

#### 3. consultant.routes.ts - Route Registration
**Location:** `backend/src/modules/consultant/consultant.routes.ts`

**Changes:**
- Imported `authenticate` middleware
- Added route: `POST /consultant/verify-profile`
- Applied `authenticate` middleware (requires JWT token)
- Maps to `createCompleteProfile` controller

**Route Protection:**
- Uses JWT authentication
- Extracts user from token
- Prevents unauthorized profile creation

## Workflow Comparison

### Old Workflow (Multi-Step)
1. Consultant uploads CNIC (front & back)
2. Clicks "Verify" button
3. Navigates to consultant dashboard
4. Goes to Profile Management page
5. Fills in all profile details
6. Saves profile
7. Profile appears on admin portal
8. Admin reviews and approves

**Issues:**
- Multiple steps confuse users
- Risk of incomplete profiles
- Extra navigation required
- Poor user experience

### New Workflow (Single-Step)
1. Consultant uploads CNIC (front & back)
2. Fills in all profile details on same page:
   - Title, Bio, Specialization
   - Hourly Rate, Experience, Skills
   - Optional supporting documents
3. Clicks "Submit for Verification"
4. See verification pending page
5. Profile appears on admin portal immediately
6. Admin reviews documents and details
7. Admin approves/declines
8. User receives email notification

**Benefits:**
- Single-page form completion
- Guided input with validation
- Immediate admin visibility
- Better user experience
- Complete profiles from start

## API Integration

### Frontend to Backend Flow

1. **User Fills Form:**
   - Profile fields: title, bio, specialization[], hourlyRate, experience, skills[]
   - File uploads: frontIdImage, backIdImage, supportingDocs[]

2. **File Conversion:**
   - Files converted to base64 using FileReader API
   - All data bundled in JSON payload

3. **API Call:**
   ```typescript
   POST /consultant/verify-profile
   Headers: { Authorization: Bearer <token> }
   Body: {
     title, bio, hourlyRate, experience,
     specialization[], skills[],
     idCardFront (base64), idCardBack (base64),
     supportingDocuments[] (base64)
   }
   ```

4. **Backend Processing:**
   - Authenticates user from JWT
   - Validates no existing profile
   - Parses array fields
   - Sets isVerified = false
   - Creates consultant document
   - Returns populated consultant object

5. **Admin Portal:**
   - Fetches all consultants (GET /consultants)
   - Displays pending consultants (isVerified = false)
   - Shows documents as base64 images
   - Provides approve/decline actions

## Database Schema

### Consultant Model Fields Used
```typescript
{
  userId: ObjectId (ref: User)
  title: String (required)
  bio: String (required)
  specialization: [String] (required)
  hourlyRate: Number (required)
  experience: String (required)
  skills: [String] (required)
  idCardFront: String (base64)
  idCardBack: String (base64)
  supportingDocuments: [String] (base64)
  isVerified: Boolean (default: false)
  createdAt: Date
  updatedAt: Date
}
```

## Testing Checklist

### Frontend Testing
- [ ] All form fields accept input correctly
- [ ] Specialization tags add/remove properly
- [ ] Skills tags add/remove properly
- [ ] File uploads work for CNIC (front/back)
- [ ] File uploads work for supporting documents
- [ ] Validation errors display correctly
- [ ] Loading state shows during submission
- [ ] Navigation to pending page on success
- [ ] Error messages display on API failure

### Backend Testing
- [ ] Endpoint requires authentication
- [ ] Profile creation succeeds with valid data
- [ ] Duplicate profile prevention works
- [ ] Array fields parse correctly from FormData
- [ ] isVerified defaults to false
- [ ] User population works correctly
- [ ] Error handling for missing fields
- [ ] Error handling for invalid user

### Admin Portal Testing
- [ ] Pending consultants appear in list
- [ ] Document modal opens on "View Docs"
- [ ] CNIC front image displays correctly
- [ ] CNIC back image displays correctly
- [ ] Supporting docs display as thumbnails
- [ ] Download links work for all documents
- [ ] Approve action updates isVerified
- [ ] Profile details display correctly

## Security Considerations

1. **Authentication:**
   - JWT token required for profile creation
   - User ID extracted from token (not client input)
   - Prevents unauthorized profile creation

2. **File Handling:**
   - Base64 encoding for document storage
   - Client-side file size validation recommended
   - Server-side validation needed (future enhancement)

3. **Data Validation:**
   - Required fields enforced client + server side
   - Mongoose schema validation
   - Duplicate profile prevention

4. **Admin Access:**
   - Only admins can approve/decline profiles
   - isVerified field prevents consultant access until approved
   - Document viewing restricted to admin portal

## Future Enhancements

1. **File Storage:**
   - Install multer for proper file uploads
   - Store files in cloud storage (AWS S3, Cloudinary)
   - Store URLs instead of base64 in database
   - Implement file size limits (5MB recommended)

2. **Validation:**
   - Add CNIC format validation (Pakistan ID format)
   - Validate file types (JPEG, PNG, PDF only)
   - Add character limits for text fields
   - Validate hourly rate ranges

3. **User Experience:**
   - Add progress bar for multi-section form
   - Show real-time field validation
   - Add preview before submission
   - Implement auto-save drafts

4. **Admin Features:**
   - Add rejection reason field
   - Send email notifications on approval/rejection
   - Add bulk approval functionality
   - Implement document verification tools

5. **Analytics:**
   - Track verification times
   - Monitor rejection reasons
   - Analyze common issues
   - Generate reports

## Notes

- Base64 storage is temporary solution (not ideal for production)
- Multer + cloud storage should be implemented for scalability
- Email notifications need to be configured (not yet implemented)
- Profile edit functionality may need updates to match new structure
- Consider adding availability field to form (currently in model but not collected)

## Support

For issues or questions:
1. Check backend logs for API errors
2. Verify JWT token is valid
3. Ensure consultant model schema is up to date
4. Check network requests in browser DevTools
5. Verify file sizes aren't too large (browsers limit base64 size)
