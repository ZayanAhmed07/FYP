# Quick Start Guide - Expert Raah Platform

## 🎯 What You Need
- Node.js 18+ installed
- MongoDB 7+ running
- A code editor (VS Code recommended)
- Terminal/Command Prompt

## ⚡ 5-Minute Setup

### Step 1: Start MongoDB
```bash
# If using MongoDB installed locally
mongod

# OR using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### Step 2: Backend Setup (Terminal 1)
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# The .env file is already created with:
# NODE_ENV=development
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017
# JWT_SECRET=your-secret-key-change-this-in-production
# JWT_EXPIRES_IN=1d
# LOG_LEVEL=info

# Start the backend server
npm run dev
```

You should see:
```
Connected to MongoDB
Server running on port 5000
```

### Step 3: Frontend Setup (Terminal 2)
```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not done)
npm install

# Start the frontend
npm run dev
```

You should see:
```
VITE ready in XXX ms
Local: http://localhost:3000
```

### Step 4: Open the App
Open your browser and go to: **http://localhost:3000**

## 🧪 Test the Application

### 1. Register as a Consultant
1. Click "Sign Up" or "Get Started"
2. Select "Consultant" as account type
3. Fill in:
   - Name: John Doe
   - Email: john@example.com
   - Password: Password123
4. Click Register

### 2. Complete Consultant Profile
1. After login, go to Profile/Settings
2. Fill in Professional Profile:
   - Title: "Senior Legal Consultant"
   - Bio: "Experienced lawyer with 10+ years..."
   - Specialization: Add "Legal", "Business Law"
   - Hourly Rate: 5000
   - Experience: "10 years"
   - Skills: Add "Contract Law", "Property Law"
3. Click "Save All Changes"

### 3. Register as a Client/Buyer (New Browser/Incognito)
1. Open new incognito window
2. Go to http://localhost:3000
3. Register with:
   - Name: Jane Smith
   - Email: jane@example.com  
   - Password: Password123
   - Account Type: Buyer

### 4. Post a Job (As Client)
1. Go to "Post Job" or Dashboard
2. Fill in job details:
   - Category: Legal
   - Title: "Legal Consultant Required for Property Issue"
   - Description: "Need help with property documentation"
   - Budget: Min 5000, Max 10000
   - Timeline: "2 weeks"
   - Location: "Karachi, Pakistan"
   - Skills: Add "Contract Law", "Property Law"
3. Click "Post Job"

### 5. Submit Proposal (As Consultant)
1. Switch back to consultant account (or logout and login)
2. Go to Consultant Dashboard → Projects tab
3. Find the job posted by Jane
4. Click on it and click "Submit Proposal"
5. Fill in:
   - Bid Amount: 8000
   - Delivery Time: "10 days"
   - Cover Letter: "I have extensive experience..."
6. Submit Proposal

### 6. Accept Proposal (As Client)
1. Switch to client account
2. Go to Buyer Dashboard
3. Find your posted job
4. View proposals received
5. Click "Accept" on consultant's proposal
6. An order will be automatically created

### 7. Test Messaging
1. From either account, click on the other user
2. Click "Message" button
3. Send a message
4. Switch accounts to see real-time message (refresh if needed)

## 📱 Feature Checklist

Try all these features:

### Authentication ✅
- [ ] Register as Consultant
- [ ] Register as Buyer
- [ ] Login
- [ ] Logout

### Profiles ✅
- [ ] Update user profile
- [ ] Upload profile image
- [ ] Create consultant professional profile
- [ ] Update consultant profile

### Jobs ✅
- [ ] Post a job (buyer)
- [ ] View all jobs
- [ ] Filter jobs by category/status
- [ ] View job details

### Proposals ✅
- [ ] Submit proposal (consultant)
- [ ] View submitted proposals
- [ ] View received proposals (buyer)
- [ ] Accept proposal
- [ ] Reject proposal

### Messaging ✅
- [ ] Start conversation
- [ ] Send messages
- [ ] View message history
- [ ] See unread count
- [ ] Mark as read

### Orders ✅
- [ ] View orders (auto-created on proposal acceptance)
- [ ] Update project progress
- [ ] Add milestones
- [ ] Complete milestones
- [ ] Process payments

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
# On Windows
tasklist | findstr mongod

# On Mac/Linux
ps aux | grep mongod

# Check if port 5000 is in use
# On Windows
netstat -ano | findstr :5000

# On Mac/Linux
lsof -i :5000
```

### Frontend won't start
```bash
# Check if port 3000 is in use
# Kill the process and try again

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection error
```bash
# Verify MongoDB is running
mongo --eval "db.adminCommand('ping')"

# Check .env file has correct MONGODB_URI
cat backend/.env
```

### Can't see messages in real-time
- The frontend polls every 2-5 seconds
- Refresh the page manually if needed
- Check browser console for errors

## 🔑 Default Test Accounts

After first setup, you can create these:

**Consultant:**
- Email: consultant@test.com
- Password: Test123456
- Account Type: Consultant

**Buyer:**
- Email: buyer@test.com
- Password: Test123456
- Account Type: Buyer

**Admin:**
- Email: admin@test.com
- Password: Admin123456
- Account Type: Buyer (then manually update roles in database)

## 📊 Database Inspection

### Using MongoDB Compass
1. Download MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `expertraah`
4. Browse collections:
   - users
   - consultants
   - jobs
   - proposals
   - orders
   - conversations
   - messages

### Using Mongo Shell
```bash
# Connect
mongo

# Select database
use expertraah

# View users
db.users.find().pretty()

# View jobs
db.jobs.find().pretty()

# View proposals
db.proposals.find().pretty()
```

## 🎨 UI Navigation

### Buyer Dashboard
- **Dashboard Tab:** Stats overview
- **Projects Tab:** Your posted jobs
- **Orders Tab:** Active projects
- **Messages:** Communication center

### Consultant Dashboard
- **Dashboard Tab:** Earnings & stats
- **Projects Tab:** Browse and bid on jobs
- **Orders Tab:** Your active projects
- **Messages:** Communication center

### Common Pages
- **Profile:** View and edit your profile
- **Settings:** Account settings
- **Messaging:** Real-time chat

## 🚀 Next Steps

1. **Explore the API:**
   - Test endpoints using Postman/Insomnia
   - Check `IMPLEMENTATION_SUMMARY.md` for API docs

2. **Run Tests:**
   ```bash
   cd backend
   npm test
   ```

3. **Check Logs:**
   - Backend logs in terminal
   - Frontend logs in browser console

4. **Read Documentation:**
   - `README.md` - Main documentation
   - `IMPLEMENTATION_SUMMARY.md` - Feature details
   - `DATA_DESIGN_DOCUMENT.txt` - Database design

## 💡 Tips

- Use Chrome DevTools to inspect network requests
- Check browser console for frontend errors
- Check terminal for backend logs
- MongoDB Compass is great for viewing data
- Use different browsers/incognito for testing multiple accounts
- The messaging system polls - wait 2-5 seconds for updates

## 📞 Need Help?

1. Check the error message carefully
2. Look at terminal/console logs
3. Verify MongoDB is running
4. Check if ports 3000 and 5000 are available
5. Review the README.md and documentation files

---

**Ready to go! 🎉** Start building and testing the platform!
