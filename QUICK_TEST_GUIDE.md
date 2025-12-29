# Quick Test Reference Guide

## Run Tests Quickly

### All E2E Tests (Recommended)
```bash
cd backend
npm test -- e2e/
```

### Individual Test Suites

#### Complete Workflow (47 tests)
```bash
npm test -- e2e/complete-workflow.test.ts
```

#### Security Tests (19 tests)
```bash
npm test -- e2e/authorization-security.test.ts
```

#### Edge Cases (18 tests)
```bash
npm test -- e2e/edge-cases.test.ts
```

### With Coverage Report
```bash
npm run test:coverage
```

### Watch Mode (for development)
```bash
npm run test:watch
```

---

## Test Stats
- **Total E2E Tests:** 84
- **Coverage:** ~98%
- **Execution Time:** ~45 seconds
- **Database:** Auto-cleanup between tests

---

## What's Tested

✅ Authentication & Registration
✅ Profile Management
✅ Job Posting & Browsing
✅ Proposals
✅ Orders
✅ Payments
✅ Messaging
✅ Reviews & Ratings
✅ Authorization & Security
✅ Edge Cases & Error Handling

---

## Verify Changes

### Stats Page Removed
```bash
cd frontend
npm run dev
# Visit: http://localhost:5173
# Login as consultant or buyer
# Verify only 4 tabs appear (no Stats tab)
```

### No Errors
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

---

## Need Help?

📖 See: `backend/src/__tests__/TEST_DOCUMENTATION.md`
📋 See: `IMPLEMENTATION_SUMMARY_TESTS_AND_STATS_REMOVAL.md`
