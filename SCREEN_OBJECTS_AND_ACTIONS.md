# Screen Objects and Actions Analysis - Expert Raah Platform

## 1. HOME PAGE (HomePage.tsx)
**Purpose:** Landing page for the platform

### Screen Objects:
- **Navigation Bar**
  - Logo/Brand: "EXPERT RAAH"
  - Navigation Links: Home, About, Services, Contact
  - Login Button
  - Signup Button
  
- **Hero Section**
  - Main Heading Text
  - Subheading/Description Text
  - Call-to-Action Button: "Get Started"
  - Background Image/Gradient
  
- **Features Section**
  - Feature Cards (Education, Business, Legal)
  - Feature Icons
  - Feature Descriptions
  
- **Footer**
  - Social Media Links
  - Contact Information
  - Copyright Text

### Actions:
- Click "Login" → Navigate to Login Page
- Click "Signup" → Navigate to Signup Page
- Click "Get Started" → Navigate to Account Type Selection
- Click Navigation Links → Scroll to sections or navigate to pages
- Click Feature Cards → View category details

---

## 2. ACCOUNT TYPE PAGE (AccountTypePage.tsx)
**Purpose:** User selects account type (Buyer or Consultant)

### Screen Objects:
- **Header**
  - Page Title: "Choose Your Account Type"
  - Description Text
  
- **Account Type Cards**
  - Buyer Card:
    - Icon (User icon)
    - Title: "I'm a Buyer"
    - Description text
    - Select Button
  - Consultant Card:
    - Icon (UserTie icon)
    - Title: "I'm a Consultant"
    - Description text
    - Select Button
    
- **Back Button**
  - Arrow icon
  - "Back" text

### Actions:
- Click "Buyer" Card → Redirect to Signup with accountType=buyer
- Click "Consultant" Card → Redirect to Signup with accountType=consultant
- Click "Back" Button → Navigate back to previous page

---

## 3. SIGNUP PAGE (SignupPage.tsx)
**Purpose:** User registration form

### Screen Objects:
- **Header**
  - Page Title: "Create Your Account"
  - Logo/Brand
  
- **Form Fields**
  - Name Input Field
    - Label: "Full Name"
    - Text input
  - Email Input Field
    - Label: "Email Address"
    - Email input
  - Password Input Field
    - Label: "Password"
    - Password input (with show/hide toggle)
  - Confirm Password Input Field
    - Label: "Confirm Password"
    - Password input
  - Account Type Badge (read-only)
    - Shows "Buyer" or "Consultant"
  
- **Submit Button**
  - "Sign Up" / "Create Account"
  
- **Additional Links**
  - "Already have an account? Login" link
  
- **Error/Success Messages**
  - Error Alert Box (red)
  - Success Alert Box (green)

### Actions:
- Enter Name → Update state
- Enter Email → Update state + Validation
- Enter Password → Update state + Show strength indicator
- Enter Confirm Password → Update state + Match validation
- Click Show/Hide Password Icon → Toggle password visibility
- Click "Sign Up" → Submit form → Create account → Redirect to Login
- Click "Login" link → Navigate to Login Page
- Form Validation → Display errors

---

## 4. LOGIN PAGE (LoginPage.tsx)
**Purpose:** User authentication

### Screen Objects:
- **Header**
  - Page Title: "Welcome Back"
  - Subtitle text
  
- **Form Fields**
  - Email Input Field
    - Label: "Email Address"
    - Email input
  - Password Input Field
    - Label: "Password"
    - Password input (with show/hide toggle)
  - Remember Me Checkbox
  
- **Submit Button**
  - "Login" / "Sign In"
  
- **Additional Links**
  - "Forgot Password?" link
  - "Don't have an account? Sign Up" link
  
- **Error Messages**
  - Error Alert Box (red)

### Actions:
- Enter Email → Update state
- Enter Password → Update state
- Check/Uncheck "Remember Me" → Toggle persistence
- Click Show/Hide Password Icon → Toggle password visibility
- Click "Login" → Authenticate → Redirect based on role:
  - Admin → Admin Dashboard
  - Buyer → Buyer Dashboard
  - Consultant → Consultant Dashboard
- Click "Forgot Password?" → Navigate to Reset Password Page
- Click "Sign Up" link → Navigate to Account Type Page

---

## 5. RESET PASSWORD PAGE (ResetPasswordPage.tsx)
**Purpose:** Password recovery

### Screen Objects:
- **Header**
  - Page Title: "Reset Password"
  
- **Form Fields**
  - Email Input Field (Step 1)
    - Label: "Email Address"
  - New Password Input Field (Step 2)
    - Label: "New Password"
  - Confirm Password Input Field (Step 2)
    - Label: "Confirm Password"
  - Token/Code Input (hidden)
  
- **Buttons**
  - "Send Reset Link" Button (Step 1)
  - "Reset Password" Button (Step 2)
  - Back Button
  
- **Status Messages**
  - Success/Error Alert

### Actions:
- Enter Email → Update state
- Click "Send Reset Link" → Request password reset → Send email
- Enter New Password → Update state
- Enter Confirm Password → Update state + Validation
- Click "Reset Password" → Update password → Redirect to Login
- Click "Back" → Navigate to Login Page

---

## 6. BUYER DASHBOARD (Based on role routing)
**Purpose:** Buyer's main interface

### Screen Objects:
- **Header/Navigation**
  - Logo
  - Dashboard Menu Items
  - User Avatar/Profile
  - Logout Button
  
- **Statistics Cards**
  - Active Jobs Card
  - Total Spent Card
  - Proposals Received Card
  - Completed Projects Card
  
- **Quick Action Buttons**
  - "Post New Job" Button
  - "View All Jobs" Button
  - "Messages" Button
  
- **Recent Jobs Table**
  - Job Title Column
  - Status Column
  - Proposals Count Column
  - Actions Column (View, Edit, Delete)
  
- **Notifications Panel**
  - Notification List Items
  - Mark as Read Buttons

### Actions:
- Click "Post New Job" → Navigate to Post Job Page
- Click "View All Jobs" → Navigate to Jobs List
- Click "Messages" → Navigate to Messaging Page
- Click Job Row → Navigate to Job Details
- Click "Edit" Icon → Navigate to Edit Job
- Click "Delete" Icon → Confirm → Delete job
- Click "View Proposals" → Navigate to Proposals List
- Click Notification → Mark as read + Navigate to related page
- Click "Logout" → Clear session → Navigate to Login

---

## 7. POST JOB PAGE (PostJobPage.tsx)
**Purpose:** Create new job posting

### Screen Objects:
- **Header**
  - Page Title: "Post a Job"
  - Back Button
  
- **Chatbot Widget (Sarah AI)**
  - Chat Interface
  - Message Bubbles (user and bot)
  - Input Field
  - Send Button
  - Progress Indicator
  - Quick Reply Chips
  
- **Job Preview Panel** (Right Side)
  - Job Title Display
  - Category Display
  - Location Display
  - Budget Display (Min-Max)
  - Description Display
  - Skills Display (Chips)
  - "Unlock Edit" Button (after chatbot completion)
  - "Post Job" Button
  
- **Edit Mode Form Fields** (When unlocked)
  - Title Input Field
  - Category Dropdown (Education, Business, Legal)
  - Location Dropdown (Rawalpindi, Islamabad, Lahore, Karachi, Remote)
  - Budget Min Input
  - Budget Max Input
  - Description Text Area (min 100 words)
  - Skills Input with Add Button
  - Skills Chips (deletable)
  - "Save Changes" Button
  - "Cancel" Button
  
- **Word Counter**
  - Character count display
  - Validation indicator

### Actions:
- Type in Chatbot → Send message → Get AI response
- Click Quick Reply Chip → Auto-send response
- AI Collects: Title, Category, Location, Budget, Description, Skills
- Click "Unlock Edit" → Enable form editing
- Edit Job Fields → Update state + Validation
- Click "Save Changes" → Validate → Update preview
- Click "Cancel" → Revert changes
- Click "Post Job" → Validate (100-word min) → Submit → Create job → Redirect to Dashboard
- Click "Back" → Confirm → Navigate back

---

## 8. CONSULTANT DASHBOARD
**Purpose:** Consultant's main interface

### Screen Objects:
- **Header/Navigation**
  - Logo
  - Dashboard Menu Items
  - Profile Avatar
  - Verification Status Badge
  - Logout Button
  
- **Statistics Cards**
  - Active Proposals Card
  - Total Earnings Card
  - Success Rate Card
  - Profile Views Card
  
- **Quick Action Buttons**
  - "Browse Jobs" Button
  - "My Proposals" Button
  - "Messages" Button
  
- **Available Jobs Feed**
  - Job Cards List
  - Job Title
  - Category Badge
  - Location Badge
  - Budget Display
  - "View Details" Button
  - "Submit Proposal" Button
  
- **Verification Status Alert** (if unverified)
  - Alert Message
  - "Complete Verification" Button

### Actions:
- Click "Browse Jobs" → Navigate to Jobs List
- Click "My Proposals" → Navigate to Consultant Proposals Page
- Click "Messages" → Navigate to Messaging Page
- Click Job Card → Navigate to Job Details
- Click "Submit Proposal" → Navigate to Submit Proposal Page
- Click "Complete Verification" → Navigate to Verify Identity Page
- Click Profile Avatar → Navigate to Profile Page
- Click "Logout" → Clear session → Navigate to Login

---

## 9. VERIFY IDENTITY PAGE (VerifyIdentityPage.tsx)
**Purpose:** Consultant identity verification and profile setup

### Screen Objects:
- **Left Panel (40% width)**
  - Hero Section:
    - Heading: "Step Into Expert Raah"
    - Description Text
    - Teal gradient background
  - Back Button (top-left)
  
- **Right Panel (60% width)**
  - **Header**
    - Title: "Verify Your Identity"
    - Description text
  
  - **Upload Section** (Grid 2 columns)
    - Front ID Card Upload:
      - Dashed border box
      - Upload icon (circle with ID icon)
      - File name display / "Upload" text
      - Label: "Front Side of your Identity Card"
      - File input (hidden)
    - Back ID Card Upload:
      - Same structure as front
      - Label: "Back Side of your Identity Card"
  
  - **Instructions Box**
    - Title: "Instructions"
    - Bullet list:
      - Upload clear front image
      - Upload back image
      - Ensure visibility
      - Accepted formats info
  
  - **Professional Profile Section**
    - Section Header with icon
    - **Professional Title Input**
      - Label with * (required)
      - Text input field
      - Placeholder example
    - **Bio Input**
      - Label with * (required)
      - Multi-line text area (4 rows)
      - Placeholder text
    - **Specialization**
      - Icon + Label
      - Dropdown (native select)
      - "Add" Button
      - Chips display (deletable)
    - **Hourly Rate Input**
      - Icon + Label
      - Number input (PKR)
      - Placeholder
    - **Experience Input**
      - Icon + Label
      - Text input
      - Placeholder: "e.g., 5+ years"
    - **City Dropdown**
      - Label with *
      - Select (Rawalpindi, Islamabad, Lahore, Karachi)
    - **Skills Input**
      - Label with *
      - Text input + "Add" Button
      - Chips display (deletable)
      - Enter key support
  
  - **Supporting Documents Section**
    - Title: "Additional Supporting Documents"
    - Description: "(optional)"
    - "Add Documents" Button (with upload icon)
    - File input (hidden, multiple)
    - Document List:
      - File name display
      - Delete icon button (X)
  
  - **Error Message Box** (conditional)
    - Red background alert
    - Error text
  
  - **Submit Button**
    - Full width
    - "Submit for Verification" / "Submitting..."
    - Teal gradient background
    - Disabled when loading

### Actions:
- Click "Back" → Navigate to previous page (slide left animation)
- Click Front ID Upload Box → Open file picker → Select file → Upload → Display filename
- Click Back ID Upload Box → Open file picker → Select file → Upload → Display filename
- Type in Title Field → Update state
- Type in Bio Field → Update state
- Select Specialization → Enable Add button
- Click "Add" (Specialization) → Add chip to list
- Click Delete Icon on Specialization Chip → Remove from list
- Type in Hourly Rate → Update state (number only)
- Type in Experience → Update state
- Select City → Update state
- Type in Skills Field → Update state
- Press Enter in Skills → Add skill (same as click Add)
- Click "Add" (Skills) → Add skill chip to list
- Click Delete Icon on Skills Chip → Remove from list
- Click "Add Documents" → Open file picker (multiple) → Select files → Add to list
- Click Delete Icon on Document → Remove from list
- Click "Submit for Verification" → Validate all fields → Convert files to base64 → POST to /consultants/verify-profile → Navigate to Verification Pending Page
- Hover Upload Boxes → Transform up, show shadow
- Hover Chips → Transform up, show shadow
- Focus Text Fields → Border color changes to teal (2px)

---

## 10. VERIFICATION PENDING PAGE (VerificationPendingPage.tsx)
**Purpose:** Notify consultant their verification is pending

### Screen Objects:
- **Full Screen Container**
  - Teal gradient background
  
- **Center Card**
  - Semi-transparent white background
  - Rounded corners
  - Shadow
  
  - **Icon**
    - Clock/Hourglass icon (large)
    - Teal colored circle
  
  - **Heading**
    - "Verification Pending"
  
  - **Description Text**
    - Explanation of pending status
    - Admin review message
  
  - **Status Box**
    - Light teal background
    - Icon + Text
    - Status indicators
  
  - **Action Buttons**
    - "Back to Dashboard" Button
    - "Contact Support" Button

### Actions:
- Page Loads → Display pending status
- Click "Back to Dashboard" → Navigate to Consultant Dashboard
- Click "Contact Support" → Navigate to Contact Page or Open email

---

## 11. SUBMIT PROPOSAL PAGE (SubmitProposalPage.tsx)
**Purpose:** Consultant submits bid for a job

### Screen Objects:
- **Header**
  - Back Button (with arrow icon)
  - Page Title: "Submit Proposal"
  
- **Job Summary Card**
  - Job Title Display
  - Category Badge (teal gradient)
  - Location Badge
  - Buyer Budget Display
  
- **Proposal Form Card**
  - **Error Alert** (conditional, red)
  - **Success Alert** (conditional, green)
  
  - **Bid Amount Input**
    - Label: "Your Bid Amount (PKR) *"
    - Helper Text: "Minimum: 1000 PKR"
    - Number input field
    - Min value: 1000
    - Placeholder: "e.g., 15000"
  
  - **Delivery Time Input**
    - Label: "Delivery Time *"
    - Helper Text: "Minimum: 3 characters"
    - Text input field
    - Placeholder: "e.g., 7 days, 2 weeks, or 1 month"
  
  - **Cover Letter Input**
    - Label: "Cover Letter *"
    - Helper Text: "Minimum: 100 characters (X/100)"
    - Multi-line text area (6 rows)
    - Character counter
    - Placeholder with 100-char requirement
  
  - **Action Buttons**
    - "Cancel" Button (outlined, teal)
    - "Submit Proposal" Button (filled, teal gradient)
    - Loading state: "Submitting..."

### Actions:
- Click "Back" → Navigate to previous page
- Type Bid Amount → Update state + Validation (≥1000)
- Type Delivery Time → Update state + Validation (≥3 chars)
- Type Cover Letter → Update state + Update counter + Validation (≥100 chars)
- Click "Cancel" → Navigate back
- Click "Submit Proposal" → Validate all fields:
  - Bid ≥ 1000 PKR
  - Delivery time ≥ 3 characters
  - Cover letter ≥ 100 characters
  - POST to /proposals with { jobId, proposedAmount, estimatedDelivery, coverLetter }
  - On Success → Show success message → Redirect to Consultant Dashboard (1.2s delay)
  - On Error → Show error message
- Hover Input Fields → Border changes to teal
- Focus Input Fields → Border 2px teal

---

## 12. CONSULTANT PROPOSALS PAGE (ConsultantProposalsPage.tsx)
**Purpose:** View consultant's submitted proposals

### Screen Objects:
- **Header**
  - Page Title: "My Proposals"
  - Back Button
  
- **Filter Tabs**
  - "All" Tab
  - "Pending" Tab
  - "Accepted" Tab
  - "Rejected" Tab
  - Badge with count on each
  
- **Proposals List**
  - Proposal Cards:
    - Job Title
    - Bid Amount
    - Delivery Time
    - Status Badge (color-coded)
    - Submitted Date
    - "View Details" Button
  
- **Empty State** (no proposals)
  - Icon
  - "No Proposals Found" message
  
- **Loading State**
  - Spinner
  - "Loading proposals..." text

### Actions:
- Click Filter Tab → Update filter → Display filtered proposals
- Click Proposal Card → Navigate to Proposal Details
- Click "View Details" → Navigate to Job Details
- Page Load → Fetch consultant profile → Fetch proposals by consultantId
- Hover Proposal Card → Shadow increase + Transform

---

## 13. JOB DETAIL WITH MATCHING PAGE (JobDetailWithMatchingPage.tsx)
**Purpose:** View job details with AI-matched consultants

### Screen Objects:
- **Header**
  - Back Button
  - Job Title (large)
  
- **Job Details Section**
  - Category Badge
  - Location Badge
  - Budget Display
  - Posted Date
  - Job Description (full text)
  - Required Skills (chips)
  - Status Badge
  
- **AI Matching Section**
  - Section Title: "Recommended Consultants"
  - Loading State
  - Consultant Cards Grid:
    - Profile Picture/Avatar
    - Name
    - Title
    - Rating (stars)
    - Hourly Rate
    - Specializations (chips)
    - Match Score Badge
    - "View Profile" Button
    - "Invite" Button
  
- **Action Buttons** (Buyer)
  - "Edit Job" Button
  - "Delete Job" Button
  - "Close Job" Button
  
- **Action Buttons** (Consultant)
  - "Submit Proposal" Button

### Actions:
- Click "Back" → Navigate to Dashboard
- Click Consultant Card → Navigate to Consultant Profile View
- Click "View Profile" → Navigate to Consultant Profile View
- Click "Invite" → Send invitation to consultant
- Click "Submit Proposal" → Navigate to Submit Proposal Page
- Click "Edit Job" → Navigate to Edit Job Page
- Click "Delete Job" → Confirm modal → Delete → Navigate to Dashboard
- Click "Close Job" → Update job status → Refresh
- Page Load → Fetch job details → Trigger AI matching → Display results

---

## 14. CONSULTANT PROFILE VIEW PAGE (ConsultantProfileViewPage.tsx)
**Purpose:** Public view of consultant profile

### Screen Objects:
- **Header**
  - Back Button
  - Consultant Name (large)
  
- **Profile Section**
  - Profile Picture/Avatar (large)
  - Name
  - Professional Title
  - Verification Badge (if verified)
  - Rating Display (stars + count)
  - Location
  - Member Since Date
  
- **Stats Row**
  - Total Jobs Completed
  - Success Rate
  - Response Time
  - Total Earnings
  
- **About Section**
  - Bio/Description text
  
- **Specializations Section**
  - Chips display
  
- **Skills Section**
  - Chips display
  
- **Experience & Rate Section**
  - Years of Experience
  - Hourly Rate Display
  
- **Reviews Section**
  - Review Cards:
    - Reviewer Name
    - Rating (stars)
    - Review Date
    - Review Text
  - "Load More Reviews" Button
  
- **Action Buttons** (for Buyers)
  - "Hire Now" Button
  - "Send Message" Button

### Actions:
- Click "Back" → Navigate to previous page
- Click "Hire Now" → Navigate to Post Job or Job Assignment flow
- Click "Send Message" → Navigate to Messaging Page (open chat with consultant)
- Click "Load More Reviews" → Fetch more reviews → Display
- Page Load → Fetch consultant by ID → Fetch reviews → Display data

---

## 15. MESSAGING PAGE (MessagingPage.tsx)
**Purpose:** Real-time chat between buyers and consultants

### Screen Objects:
- **Sidebar (Conversations List)**
  - Search Input
  - Conversation Cards:
    - Avatar
    - Name
    - Last Message Preview
    - Timestamp
    - Unread Badge (count)
    - Online Status Indicator
  
- **Chat Area**
  - **Chat Header**
    - Recipient Avatar
    - Recipient Name
    - Online Status
    - Options Menu (3 dots)
  
  - **Messages Area**
    - Message Bubbles:
      - Sender's messages (right, teal)
      - Receiver's messages (left, gray)
      - Timestamp
      - Read status (checkmarks)
    - Date Separators
    - "Typing..." Indicator
  
  - **Input Area**
    - Text Input Field
    - Emoji Picker Button
    - Attach File Button
    - Send Button (icon)
  
- **Empty State** (no conversation selected)
  - Icon
  - "Select a conversation" message

### Actions:
- Type in Search → Filter conversations
- Click Conversation Card → Load chat → Display messages
- Type in Message Input → Update state → Show "typing" to recipient (Socket.IO)
- Click Emoji Button → Open emoji picker → Select emoji → Insert
- Click Attach File → Open file picker → Select → Upload → Send
- Click Send Button / Press Enter → Send message → Socket.IO emit → Display in chat → Clear input
- Receive Message (Socket.IO) → Display in chat → Update conversation list → Play notification sound
- Scroll Up → Load more messages (pagination)
- Click Options Menu → Show/Hide menu (Archive, Block, Report)
- Page Load → Connect Socket.IO → Fetch conversations → Set up event listeners

---

## 16. ADMIN DASHBOARD PAGE (AdminDashboardPage.tsx)
**Purpose:** Admin panel for platform management

### Screen Objects:
- **Header**
  - Logo: "EXPERT RAAH"
  - "Admin Panel" Chip
  - "Logout" Button
  
- **Tabs Navigation**
  - Consultants Tab (with icon)
  - Buyers Tab (with icon)
  - Reviews & Ratings Tab (with icon)
  - Contact Forms Tab (with icon)
  
- **CONSULTANTS TAB:**
  - **Search & Filter Panel**
    - Search Input (with search icon)
    - Filter Buttons:
      - "All" (with count)
      - "✓ Verified" (with count, green)
      - "⏳ Unverified" (with count, orange)
      - "🚫 Banned" (with count, red)
    - Results Counter Text
  
  - **Pending Consultants Section** (if any)
    - Section Title with count
    - Pending Consultant Cards:
      - Avatar
      - Name
      - Title
      - Email
      - "Pending" Chip
      - Experience, Hourly Rate, Specialization display
      - "View Documents" Button
  
  - **All Consultants Table**
    - Dynamic Title (based on filter)
    - Table Headers:
      - Consultant
      - Email
      - Title
      - Rate
      - Status
      - Joined
      - Actions
    - Table Rows:
      - Avatar + Name
      - Email
      - Title
      - Hourly Rate
      - Status Chip (Verified/Pending/Banned)
      - Join Date
      - Action Buttons:
        - View (eye icon)
        - Verify/Unverify (check/X icon)
        - Ban/Unban (ban/check icon)
  
- **BUYERS TAB:**
  - Buyers Table:
    - Headers: Buyer, Email, Phone, Jobs Posted, Total Spent, Joined, Actions
    - Rows with buyer data
    - Ban/Unban action buttons
  
- **REVIEWS TAB:**
  - Review Cards:
    - Star Rating
    - Comment Text
    - Buyer Info
    - Consultant Info
    - Job Title
    - Date
    - Delete Button
  - Pagination Controls
  
- **CONTACTS TAB:**
  - Contact Management Component
  
- **Documents Modal** (overlay)
  - Title: "Consultant Details & Documents"
  - Close Button (X)
  - Profile Summary
  - ID Card Images (Front/Back)
  - Action Buttons (for pending):
    - "Decline" Button
    - "Approve Consultant" Button
  
- **Loading State**
  - Spinner
  - "Loading data..." text
  
- **Error State**
  - Error message
  - "Retry" Button
  
- **Empty States** (per tab)
  - Icon
  - Message
  - Description

### Actions:
- Click Tab → Switch active tab → Fetch relevant data
- Type in Search → Real-time filter consultants by name/email/title/specialization
- Click Filter Button → Update filter → Display filtered consultants
- Click "Clear Filters" → Reset search and filter
- Click "View Documents" → Open modal → Display consultant details
- Click "Verify" Icon → Confirm → PATCH /admin/consultants/:id/verify → Update status → Refresh
- Click "Unverify" Icon → Confirm → PATCH /admin/consultants/:id/decline → Update status → Refresh
- Click "Ban" Icon → Confirm → PATCH /admin/users/:id/ban → Update status → Refresh
- Click "Unban" Icon → PATCH /admin/users/:id/unban → Update status → Refresh
- Click "Approve Consultant" (in modal) → Approve → Close modal → Refresh
- Click "Decline" (in modal) → Decline → Close modal → Refresh
- Click "Delete Review" → Confirm → DELETE → Refresh reviews
- Click Pagination Buttons → Change page → Fetch reviews
- Click "Logout" → Clear session → Navigate to Home
- Hover Table Row → Background changes
- Hover Action Buttons → Background changes + Show tooltip

---

## 17. PROFILE PAGE (ProfilePage.tsx)
**Purpose:** User profile management

### Screen Objects:
- **Header**
  - Page Title: "My Profile"
  - Back Button
  
- **Profile Picture Section**
  - Avatar Display (large)
  - "Change Photo" Button
  - Upload Input (hidden)
  
- **Profile Form**
  - Name Input Field
  - Email Input Field (read-only)
  - Phone Input Field
  - Account Type Display (badge)
  - Bio Text Area (for consultants)
  
- **Consultant-Specific Fields** (if consultant)
  - Title Input
  - Specializations Display
  - Hourly Rate Input
  - Experience Input
  
- **Action Buttons**
  - "Save Changes" Button
  - "Cancel" Button
  
- **Success/Error Messages**
  - Alert box

### Actions:
- Click "Change Photo" → Open file picker → Select image → Upload → Update avatar
- Edit Name → Update state
- Edit Phone → Update state
- Edit Bio → Update state
- Edit Consultant Fields → Update state
- Click "Save Changes" → Validate → PATCH /users/me → Update profile → Show success
- Click "Cancel" → Revert changes → Reset form
- Page Load → Fetch user profile → Populate form

---

## 18. SETTINGS PAGE (SettingsPage.tsx)
**Purpose:** Account settings and preferences

### Screen Objects:
- **Header**
  - Page Title: "Settings"
  - Back Button
  
- **Settings Sections**
  - **Account Settings**
    - Email Notifications Toggle
    - SMS Notifications Toggle
  - **Privacy Settings**
    - Profile Visibility Toggle
    - Show Online Status Toggle
  - **Security Settings**
    - "Change Password" Button
    - "Two-Factor Authentication" Toggle
  - **Danger Zone**
    - "Delete Account" Button (red)

### Actions:
- Toggle Email Notifications → Update preference → Save to backend
- Toggle SMS Notifications → Update preference → Save to backend
- Toggle Profile Visibility → Update setting → Save
- Toggle Online Status → Update setting → Save
- Click "Change Password" → Open modal/navigate to change password form
- Toggle Two-Factor Auth → Enable/Disable 2FA → Setup process
- Click "Delete Account" → Confirm modal → Delete account → Logout → Navigate to home

---

## 19. PAYMENT PAGE (PaymentPage.tsx)
**Purpose:** Payment processing for job completion

### Screen Objects:
- **Header**
  - Page Title: "Payment"
  - Back Button
  
- **Order Summary Card**
  - Job Title
  - Consultant Name
  - Amount Due
  - Service Fee
  - Total Amount
  
- **Payment Method Selection**
  - Credit Card Option
  - Debit Card Option
  - PayPal Option
  - Bank Transfer Option
  - Radio buttons
  
- **Payment Form** (if card selected)
  - Card Number Input
  - Expiry Date Input
  - CVV Input
  - Cardholder Name Input
  
- **Terms Checkbox**
  - "I agree to terms" checkbox
  
- **Action Buttons**
  - "Cancel" Button
  - "Pay Now" Button

### Actions:
- Select Payment Method → Update selected method
- Enter Card Details → Update state + Validation
- Check Terms Checkbox → Enable Pay button
- Click "Pay Now" → Validate → Process payment → Create transaction → Update order → Redirect to success page
- Click "Cancel" → Navigate back

---

## 20. NOT FOUND PAGE (NotFoundPage.tsx)
**Purpose:** 404 error page

### Screen Objects:
- **Error Display**
  - 404 Text (large)
  - "Page Not Found" message
  - Description text
  
- **Action Button**
  - "Go to Home" Button

### Actions:
- Click "Go to Home" → Navigate to Home Page

---

## SUMMARY OF COMMON UI PATTERNS:

### Navigation Actions (All Pages):
- Back Button → Navigate to previous page
- Logo Click → Navigate to Home
- Logout → Clear authentication → Navigate to Login

### Form Actions (All Forms):
- Input Focus → Border color change (teal)
- Input Hover → Border color change
- Field Validation → Show error messages
- Submit Button Disabled → Until validation passes
- Submit Button Loading → Show "Loading..." or spinner

### Modal/Popup Actions:
- Click Outside → Close modal
- Click Close (X) → Close modal
- ESC Key → Close modal

### Data Table Actions:
- Row Hover → Background change
- Sort Header Click → Sort data
- Pagination → Navigate pages
- Search/Filter → Filter displayed data

### Card Hover Actions:
- Transform Y (lift up)
- Shadow increase
- Border color change

### Socket.IO Real-time (Messaging):
- Connect → Establish WebSocket connection
- Emit "message" → Send message
- On "message" → Receive message
- On "typing" → Show typing indicator
- Disconnect → Clean up connections

---

## KEY VALIDATION RULES:

### Form Validations:
- **Email:** Valid format + max 255 chars
- **Password:** Min 8 chars, uppercase, lowercase, number
- **Name:** 2-100 chars, letters and spaces only
- **Bid Amount:** Min 1000 PKR
- **Cover Letter:** Min 100 chars, max 5000
- **Delivery Time:** Min 3 chars, max 100
- **Job Description:** Min 100 words

### File Upload Validations:
- **ID Cards:** JPG, PNG, PDF, max 5MB
- **Profile Pictures:** JPG, PNG, max 2MB
- **Supporting Docs:** JPG, PNG, PDF, max 5MB each

### Status Logic:
- Banned users cannot be verified
- Unverified consultants can submit proposals
- Admins can verify/unverify only non-banned users
