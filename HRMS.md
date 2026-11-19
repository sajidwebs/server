# Pams-HRMS

Pams-HRMS is an independent HR workspace within the PAMS portal, at
`/#/hrms/dashboard`. The main sidebar opens it in a separate tab. It has its own
navigation, shares platform authentication and employee identities, and uses
server-enforced HR permissions. No demonstration business records are seeded.

## Delivered functionality

- Dashboard: scoped workforce totals, joining/resignation counts, vacancies,
  attendance, leave, training, performance rating and payroll status.
- Employee master: shared user identity, generated employee IDs for new staff,
  separate login credentials, designation-based SFA roles, HQ and reporting
  manager, HR profile, photo, department/grade, dates, status, emergency contact,
  encrypted Aadhaar/PAN and bank details.
- Recruitment: manpower requisitions, openings, resumes, interviews/feedback,
  offers, background verification and joining tracker.
- Onboarding: document verification, appointment attachment, policy acceptance,
  asset/induction checklist and training schedule.
- Attendance: office/field/GPS entry, check-in/out, location accuracy, configured
  schedule comparisons for late/early minutes and exportable registers.
- Leave: scoped requests, balances, approval, holidays, monthly calendar,
  compensatory off and encashment. Approvals check available balance.
- Payroll: salary structures, company-entered components/deductions, gross/net
  calculations, approved structure reuse, independent approval, settlement with
  payment reference, printable payslip and CSV salary register.
- Expenses: travel, DA, hotel, fuel and miscellaneous HR claims with receipts,
  approval and Finance settlement. Existing SFA expenses retain their ledger;
  the dashboard reads its totals and the workspace links to it.
- KPI/KRA: monthly/quarterly/annual goals, target/achievement, achievement %, manager
  review, final rating and promotion/increment recommendations.
- Training: materials, product/sales/other types, calendar, assessments,
  certificates and employee training history.
- Transfer/promotion: effective-dated approval, HQ/designation/reporting changes;
  completion updates the shared user. Salary revision amounts are recorded in
  the movement; Finance maintains the corresponding salary structure explicitly.
- Discipline: warning/show-cause/PIP/suspension/action cases and history.
- Separation: resignation, notice, exit review, clearance, settlement amount and
  experience/relieving attachments. Completion checks outstanding asset returns
  and deactivates the shared platform login.
- Documents: typed letters, certificates, agreements and uploaded PDF/PNG/JPEG;
  authorized downloads and workflow history.
- Assets: register, allocation, acknowledgement and explicit return tracking.
- Reports: employee directory export and scoped, date-filtered HR registers for
  attendance/leave/payroll/incentives/training/KPI/separation/vacancies. CSV values
  are escaped against spreadsheet formula execution. Register reads currently
  return the latest 2,000 entries; exports cover the loaded, filtered rows.
- Workflow: twelve linked lifecycle steps with actual record counts.

## Roles and enforcement

Platform Admin (and Super Admin if introduced by the identity provider) receives
HR Admin access. Other users keep their SFA designation; `hr_memberships` can
assign an independent HR Admin, HR Executive, Finance, Reporting Manager,
Area/Regional/Zonal Manager or Employee role. National Managers inherit reporting
manager behavior. Only the platform administrator can grant HR Admin. Self-role
changes and self-approval are prohibited.

HR Admin administers the workspace. HR Executive maintains HR operations but
cannot read payroll or settle financial records. Finance handles payroll and
settlements. Managers see their reporting hierarchy; employees see their own
records and shared training/holiday references. Payslips remain self-only for
non-HR/Finance users even when they manage a team. Private employee fields are
restricted to HR, Finance and the employee. Browser controls supplement API
checks; they do not replace them.

Draft/rejected records can be submitted, then independently approved or rejected.
Approved operational records can be completed by HR; financial settlement is
separate. Version checks prevent overwriting a concurrent edit. Audit history
preserves actor, time, action and review comments. Draft archive is reversible at
the database level; approved records are not deleted through the HR API.

## Deployment

1. Deploy the backend repository containing the HR models, route and catalogue.
   Existing startup initialization creates the three missing HR tables without
   dropping or rewriting existing data.
2. Configure **HR_DATA_ENCRYPTION_KEY** in Render as 32 cryptographically random
   bytes encoded as 64 hex characters (or base64). Keep it stable and backed up
   outside Git; changing/losing it makes saved private fields and attachments
   unreadable. The API rejects sensitive writes until the key is configured.
3. Deploy the admin portal build. No additional frontend environment value is
   needed; it uses the existing API URL and authentication token.
4. Sign in as platform administrator. Open Pams-HRMS → Roles & Permissions to
   assign HR/Finance access to actual company users. Create employees only from
   approved company data and configure salary structures, leave balances and
   holidays before processing requests.

Attachments are encrypted in PostgreSQL, limited to PDF/PNG/JPEG up to 4 MB and
downloaded through authenticated endpoints. Employee photos are limited to 500 KB
in the UI. HR responses use `Cache-Control: no-store`.

## Deliberate integration boundaries

Face recognition is optional and is not enabled. Browser GPS is a consent-based
location capture, not biometric verification or device attestation. Background
verification results and interview feedback are entered by HR; there is no
external verification provider. Letter/certificate files are uploaded by HR and
registers/payslips can be printed; no digital-signature service is configured.
Payroll deductions are company-entered values, not a statutory tax filing or a
bank payment integration. No assumed PF/ESI/PT/TDS rates, payroll amounts or
company policy entitlements are seeded. Training assessments store authorized
scores/results; an online exam engine and automatic certificate generation are
not included. SFA aggregates are read directly from existing records, not
converted into invented HR attendance or performance ratings.

## Validation

`test-hrms.js` refuses non-local/non-test databases. It checks authentication,
role escalation, hierarchy scope, encrypted private data/files, optimistic
locking, GPS attendance, duplicate periods, leave balance, salary arithmetic,
payroll visibility, document download permissions, asset return, designation
change, new employee IDs and exit login deactivation. The test removes its own
fixtures. The browser was verified against an isolated local API; no HR business
fixtures were written to the live company database.
