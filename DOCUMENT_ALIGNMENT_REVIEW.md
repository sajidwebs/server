# Department document and application reconciliation

Reviewed 15 November 2026. Scope: the supplied sales/marketing source documents,
the product catalogue, related database masters, and the corresponding API/portal
behavior. This is a reconciliation review, not a claim that every proposed feature
in the design documents has been implemented or certified.

## Source register

| Source | Evidence and interpretation |
| --- | --- |
| [Sales workbook](./docs/test.xlsx) | Sheet1 B6:B14 names nine products. C3:DB5 describes April–March monthly, quarterly and YTD target/projection/sales reporting. Numeric entry areas are blank; there are no actual targets, rates or transactions to import. |
| [Product Master](./docs/Software%20Data(Product%20Master)%20Pg2%20(2).docx) | Product/category/brand/pack/strength fields; inactive selection, pricing history and access rules. Explicit example product lists are not the company's catalogue. Osteoswift Gold is also named in the example format. |
| [Doctor master specification](./docs/Software%20Data%20Pg1.docx) | Regular/Irregular Prescriber classes; potential categories; specialty and qualification masters; class selected dynamically on doctor calls. Examples of doctors and report totals are not a contact directory. |
| [Input and Sample Master](./docs/Input%20master%204,%20Sample%20master%205.docx) | Promotional/Input type names and promotional material names; sample/product/pack links and limits. No approved company sample packs, allocation quantities or stock balances supplied. |
| [Expense Master](./docs/Expanse%20Master.docx) | Daily and Travel Allowance types. Fare chart contains illustrative employees/rates, with effective dates still shown as “Enter Date”; not an approved payroll/expense tariff. |
| [HQ Master](./docs/Hq%20Master.4%20(1).docx) | Zone → State/UT → Region → HQ → Patch structure and hierarchy visibility. HQ examples do not prove actual personnel assignments. |
| [Sales specification](./docs/Sales%20(1).docx) | Target/projection/primary/secondary/expiry flows, filtered reports, achievement and growth formulas, month locks. Example sales amounts are not actual bookings. |
| [Addition/deletion specification](./docs/aDDITION.docx) | Doctor/chemist/HQ/patch/stockist/hospital/SVL masters, input allocation, notices, SOP and authorization. |
| [Original addition PDF](./docs/ADDITION.pdf) | One page, rendered and visually reviewed because text extraction is empty. It is a field/layout specification for the same administration modules; no actual customer/product transaction rows. |
| [System Setup](./docs/system%20set%20up.docx) | Explicit warning: red examples are not fixed data. Describes configurable policies and monthly × 12 yearly calculation. Example 9504 does not agree with that formula and was not imported. |
| [User Master](./docs/User%20Master.docx) | User/role/HQ/manager fields, unique usernames, inactive login restriction and access rules. Listed people are explicitly an example table. |
| [Hierarchy sketch](./docs/doc1.doc) | Extracted read-only with Word. Explicitly marked “Example not actual”; no organizational staffing imported. |
| [Sales follow-up](./docs/doc2.doc) | Extracted read-only with Word. Example hierarchy plus instructions: remove Patch from target entry, admin projection view only, secondary entry by baseline/immediate superior, growth and achievement reporting following workbook. |

Root copies of Addition DOCX/PDF and System Setup duplicate the department folder
and were not treated as additional business records. Word lock files were ignored.
The existing project/three-layer guide and portal workflow were also compared;
original department documents and the user's current company catalogue direction
take precedence over generated examples.

## Data changes applied

1. Catalogue now contains the original seven website products plus **Osteoswift
   Gold** (B7) and **BGNOR M** (B12) from the workbook. Existing website spelling
   is preserved for those seven; workbook aliases such as “Trach 61” resolve to
   TRACH-61. Osteoswift Gold shares the OSTEOSWIFT brand group. BGNOR M has no
   inferred category. No example strength, pack quantity, tax, price or sales value
   was imported. Product/source mapping is in [company-catalog.json](./company-catalog.json).
2. Added missing named masters: Irregular Prescriber; Core/A/B/C/Group B categories;
   General Surgeon; Promotional/Sample/Gift/Digital input types; Visual Aid,
   Leave Behind Literature, Reminder Card and Product Brochure inputs; Daily
   Allowance and Travel Allowance expense types. Equivalent existing clinical
   specialties were reused rather than duplicated under synonyms.
3. Deactivated six call-average and twelve coverage policies that exactly matched
   the old automatic seed, had no author, and had never been edited. Preserved
   records and history rather than deleting them. Administrator-authored/edited
   policies are excluded by the importer. No replacement policy amounts invented.
4. Affected master tables and catalogue were backed up locally before live writes.
   Imports run in transactions, with an advisory lock, and repeat runs do not
   create duplicates. Backups contain operational data and are excluded from Git.

## Application corrections

| Finding | Correction |
| --- | --- |
| Reading System Setup silently created example policies | Removed all policy creation from call-average/coverage GET handlers. |
| New products assumed 18% GST and Schedule H | Removed backend model/API and portal defaults, including bulk uploads. Blank remains unset; explicit zero GST is preserved. |
| Product price-history endpoint could not load its User model/association | Corrected model path, association and returned user fields. Verified a price update appears in history. |
| Sales report joined unaggregated streams, multiplying sums | Each stream is independently filtered and totaled. Dashboard and report now use the same calculation. |
| Sales report ignored month/user filters; dashboard bypassed hierarchy visibility | Applied common year/month/product/division/HQ/state/user selection and user hierarchy restrictions. Unallocated rows are no longer globally visible to field users. Primary/expiry user filtering uses creator rather than a nonexistent user_id column. |
| Portal converted failed sales requests into successful empty tables | Failures now reach the visible error state. |
| Stored full job titles did not match approval/sales role codes | Added designation aliases, using the existing approval enum codes for history. |
| Approval endpoints lacked submitter/approver associations and final NSM approval remained pending | Added associations and corrected the final-level comparison. |
| Optional regional seed still used unrelated class/category labels | Future seed runs use the department's class/category names. Existing references are preserved, not automatically reclassified. |

## Matching areas and remaining gaps

| Area | Result / remaining requirement |
| --- | --- |
| Product catalogue | Nine document-backed names; Tablets/Gel forms retained. Missing commercial details remain unset. No unrelated example products reintroduced. |
| Regional people and customers | Earlier requested regional seed records remain. The supplied files contain no actual staff/customer directory to authenticate those identities or contact details. No additional people, phone numbers, professional registrations or licences were invented. |
| Doctor classifications | Correct choices added. Legacy classifications/references retained; an actual customer classification list is required to reclassify individual doctors without guessing. |
| User security | Previous inactive-login and password-hashing fixes remain. No passwords or employee accounts imported from illustrative user tables. |
| Sales workflows | Admin target and primary/expiry entry, projection and secondary review exist. Arithmetic/filter regressions fixed. The exact April–March wide workbook layout, quarterly/YTD columns and previous-period growth comparison are still not reproduced by the current portal report. |
| Approvals | Role-name/final-step issues fixed and tested. Skipping inactive hierarchy levels, team-specific approval scoping and full transactional approval change application still need end-to-end implementation/review; these are not certified by this pass. |
| Samples | Master/distribution structures exist, but the source does not specify company sample packs/limits. Per-call limit, active-item and package compatibility enforcement across all call entry paths still require a dedicated workflow pass. No sample quantities or stock invented. |
| Promotional inputs | Named material masters exist; no allocations, stock consumption or ROI results imported. Visual Aid must remain reusable rather than consumed per call when inventory behavior is implemented. |
| Expense/setup | Approved rates, effective dates, leave entitlements and role policies are missing. These were left unconfigured rather than copying examples into payroll/compliance logic. |
| HQ/SVL/policy administration | Models and administration routes exist for the documented modules. No actual SOP files, notices, route-to-employee assignments or yearly SVL revision dataset supplied. |

## Verification and deployment

- Isolated PostgreSQL regression checks pass: repeat import safety, policy reads do
  not seed, untouched defaults retire while authored policies survive, explicit
  zero GST survives, schedule stays unset, and price history returns updates.
- Sales regression uses multiple target/projection/secondary rows and another
  month to detect inflated sums; filtered totals and dashboard agree. A separate
  field user cannot retrieve another user's totals through the report.
- Full designation National Manager reaches the final approval state, with history.
- Database initialization regression passes. Portal production build passes
  (existing bundle-size advisory only). Live database imports completed separately
  from all isolated test fixtures.
- Backend code must reach the server repository and Render deployment to activate
  API corrections. Data imports alone do not deploy route changes. Git push status
  is reported with the delivery; the existing backend repository permission issue
  may still prevent deployment. Portal changes are independently deployable.

Re-run named imports using `npm run catalog:sync -- --apply` and
`npm run masters:sync -- --apply`. Run `npm run test:documents` only against the
isolated local test database. Never use the live client database for write tests.
