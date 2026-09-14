# Prionix Employee 360 &mdash; Enterprise Operations & Workforce Intelligence Platform

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Google Cloud Run Ready](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Cloud Firestore Zero-Trust](https://img.shields.io/badge/Database-Cloud%20Firestore-FFA000?logo=firebase&logoColor=white)](https://firebase.google.com/docs/firestore)

A zero-trust, full-featured Employee Management & Company Operations Platform built with React 19, TypeScript, Tailwind CSS, Google Cloud Firestore, and Recharts. Engineered with strict Role-Based Access Control (RBAC), owner-bound data isolation, and comprehensive audit trails.

---

## 1. Threat Modeling & Security Architecture

### The 5 Threat Zones Analysis

| Threat Zone | Identified Vector / Risk | Countermeasure Implemented | Code / Rule Location |
| :--- | :--- | :--- | :--- |
| **1. Input Surfaces** | Injection attacks, parameter manipulation in URL (e.g. spoofing `employeeId`), malformed payloads | Defensive validation, UUID/ID strict matching, client/server input sanitization, undefined-stripping | `src/services/`, `src/pages/SecurityAuditPage.tsx` |
| **2. Planning & Reasoning** | Privilege escalation via client manipulation or unauthorized route access | Two-tier enforcement: UI `AdminRoute` guard + database-level Firestore Security Rules | `src/App.tsx`, `firestore.rules` |
| **3. Tool Execution** | Unauthorized mutation of salary, medical records, or administrative state | Database write-rules restricted to verified `ADMIN` role; personal writes restricted to resource owner | `firestore.rules` (lines 40-70) |
| **4. Memory & State** | Cross-user data leakage (Employee A snooping on Employee B's salary or medical files) | Path-bound data isolation: `request.auth.uid == userId` or `resource.data.ownerUid == request.auth.uid` | `firestore.rules`, `src/services/salaryService.ts` |
| **5. Inter-System Comm.** | Hardcoded credentials or API key leakage in client bundles | Zero-hardcoded credentials; API secrets injected via Secret Manager / environment variables | `.env.example`, Secret Manager integration |

---

## 2. Security Test Matrix (9 Verification Criteria)

The application includes an automated live security test execution suite in `/security-audit`:

1. **Test 1 (Employee A accesses own profile)**: Expected: `ALLOWED` (Owner UID matches).
2. **Test 2 (Employee A accesses Employee B private info)**: Expected: `DENIED (403)` (Horizontal isolation).
3. **Test 3 (Employee A accesses Employee B salary)**: Expected: `DENIED (403)` (Compensation isolation).
4. **Test 4 (Employee A accesses Employee B medical info)**: Expected: `DENIED (403)` (Healthcare privacy rules).
5. **Test 5 (Admin accesses Employee A/B info)**: Expected: `ALLOWED` (Administrative authorization).
6. **Test 6 (Employee changes ID in URL/API)**: Expected: `DENIED (403)` (Session ownership mismatch).
7. **Test 7 (Unauthenticated user accesses protected page)**: Expected: `REDIRECT TO /login` (Protected route guard).
8. **Test 8 (Employee accesses admin route)**: Expected: `DENIED (403 Forbidden)` (Role gate).
9. **Test 9 (Admin modifies employee data)**: Expected: `DATABASE UPDATED + ACTIVITY LOG CREATED` (Audit log append).

---

## 3. Cloud Firestore Security Rules Configuration

Deploy the exact owner-bound security rules to ensure zero-trust data segregation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }

    match /users/{userId} {
      allow read, create, update: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }

    match /employees/{employeeId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    match /departments/{departmentId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /domains/{domainId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /attendance/{recordId} {
      allow read: if isAuthenticated() && (resource.data.ownerUid == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() && (request.resource.data.ownerUid == request.auth.uid || isAdmin());
      allow update, delete: if isAdmin();
    }

    match /leaves/{leaveId} {
      allow read: if isAuthenticated() && (resource.data.ownerUid == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() && (request.resource.data.ownerUid == request.auth.uid || isAdmin());
      allow update, delete: if isAdmin();
    }

    match /salaryHistory/{recordId} {
      allow read: if isAuthenticated() && (resource.data.ownerUid == request.auth.uid || isAdmin());
      allow write: if isAdmin();
    }

    match /medicalRecords/{docId} {
      allow read: if isAuthenticated() && (resource.data.ownerUid == request.auth.uid || isAdmin());
      allow create, update: if isAuthenticated() && (request.resource.data.ownerUid == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    match /projects/{projectId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /recognition/{recognitionId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /announcements/{announcementId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /notifications/{notificationId} {
      allow read, update, delete: if isAuthenticated() && (resource.data.recipientUid == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
    }

    match /activityLogs/{activityId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false;
    }
  }
}
```

---

## 4. Google Cloud Secret Manager Setup

Manage operational secrets through Google Cloud Secret Manager:

```bash
# 1. Enable required APIs
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com

# 2. Create and populate Gemini API Key secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant Cloud Run default runtime service account access to read secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Google Cloud Run Deployment & Campaign Verification

### Build & Deploy Command

Deploy the containerized full-stack application directly to Google Cloud Run:

```bash
# Set your target region
export REGION="us-central1"
export SERVICE_NAME="prionix-employee-360"

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars=NODE_ENV=production
```

### Mandatory Campaign Labeling

Apply the mandatory challenge resource label to register the service for automated campaign verification:

```bash
gcloud run services update $SERVICE_NAME \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

---

## 6. Functional Walkthrough & Testing Steps

To test every workflow end-to-end:

1. **Authentication & Persona Switching**:
   - Navigate to `/login`.
   - Click "Admin Experience (Siddharth Rao)" to log in with full administrative privileges.
   - Click "Switch to Emp" in the top bar to seamlessly test Employee mode (Devika Krishnan).

2. **360 Employee Profile**:
   - Open `/employees` and search for "Devika Krishnan". Click "View 360".
   - As an Admin or as Devika herself, observe the **Salary History** (interactive 3-year progression graph) and **Medical Record** tabs.
   - Switch role to another employee (e.g. PRX-003) and attempt to view PRX-002's salary: observe the immediate **403 Confidential Access Restriction** banner.

3. **Attendance & Telemetry**:
   - Navigate to `/attendance`.
   - View the calendar telemetry matrix (Present, Half Day, Leave, Absent).
   - Click "Check-in as Present" or "Check-in as Half Day" to record a live check-in and observe the percentage update.

4. **Time Off & Leave Management**:
   - Navigate to `/leave`.
   - Click "Apply for Leave", select leave type (e.g. Sick, Casual), dates, and reason, then submit.
   - Switch to Administrator role: the new request appears under Pending Action. Click "Approve" or "Reject".
   - Observe automatic balance deduction and notification generation.

5. **Projects Portfolio**:
   - Navigate to `/projects`.
   - Filter by status (Active, Completed) or domain.
   - As an Admin, click "Create New Project" or "Edit Project" to adjust team assignments and completion sliders.

6. **Recognition Leaderboard**:
   - Navigate to `/recognition`.
   - Switch between Monthly, Quarterly, and Yearly podium views.
   - As an Admin, click "Award Recognition" to confer honours with merit scores.

7. **Announcements & Notifications**:
   - Navigate to `/announcements`. Filter broadcasts by category (General, HR, Events, Policy).
   - As an Admin, broadcast a new announcement.
   - Check `/notifications` to observe real-time delivery with unread badges.

8. **Workforce & Domain Analytics**:
   - Navigate to `/analytics/workforce` to inspect headcount, department bars, and status ratios.
   - Navigate to `/analytics/domains` to click any domain card (e.g. SWE, AI, Cloud) and inspect the live staff drill-down table.
   - Navigate to `/analytics/projects` to review portfolio completion metrics.

9. **Zero-Trust Audit Log**:
   - Navigate to `/activity` to view the append-only stream of all administrative actions.

10. **Security Suite Execution**:
    - Navigate to `/security-audit`.
    - Click **"Run All 9 Security Tests"** to execute the complete verification matrix against live Firestore security rules and backend filters. Observe 9/9 tests passing green.
