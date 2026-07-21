# Implementation Plan - Form Validations, Dynamic Directors/Trustees, Nigeria State/LGA Selectors, Surveys, Profile Lock, Other Services, & Global Search Navigation

We will implement strict input validation (email, phone, alphabetic), dynamic list inputs for directors/shareholders and board of trustees, state/LGA selectors with Nigeria data, a post-submission satisfaction survey, profile field locking (restricted to admin staff), addition of new licenses, global search and navigation, updated support contact numbers, and a 50% increase in default accessibility font size.

---

## User Review Required

> [!IMPORTANT]
> **Profile Fields Locking**: Regular clients will only be allowed to modify their profile picture (avatar). Profile text fields (Name, Phone, Company, Address, Biography) will be read-only for clients, and can only be modified by system administrators.
>
> **Nigeria States & LGAs**: All state and LGA inputs will be converted from free text to dynamic, dependent select dropdowns covering all 36 states and the FCT.

---

## Proposed Changes

### 1. Official Logo Replacement

#### [NEW] [logo.jpg](file:///c:/Users/Rhythm%20Plug/Desktop/PRIMEFLOW/client/public/logo.jpg)
- Overwrite the existing `logo.jpg` and `primeflow-bg.jpg` in `client/public/` with the new official logo attached: `media__1783768687566.jpg`.

---

### 2. General Settings & Support Contacts

#### [MODIFY] [Header.tsx](file:///c:/Users/Rhythm%20Plug/Desktop/PRIMEFLOW/client/src/components/Header.tsx)
- **Base Font Size Increase**: Adjust default zoom scale to `150%` (representing a 50% increase in font size) if no zoom preference is saved. Allow manual scaling between `120%` and `180%` in steps of `10%`.
- **Global Search Navigation**:
  - Implement a functional global search bar.
  - Offer autocomplete suggestions matching services (e.g., "Company Incorporation", "SCUML", "NSITF"), sub-services (e.g., "Driver's Licence", "Car Dealer's Licence"), and static tabs (e.g., "Knowledge Hub", "Consultations Chat").
  - On suggestion click, transition to the respective tab and emit a `navigate-service` event to pre-fill service selections.

#### [MODIFY] [App.tsx](file:///c:/Users/Rhythm%20Plug/Desktop/PRIMEFLOW/client/src/App.tsx)
- **Profile Lock**: Render text fields as read-only for non-admin users. Only render the "Save Profile Changes" button if the user is an admin or is updating their avatar.
- **Knowledge Hub Quick Link**: Add a quick access card for the Knowledge Hub in the client's home workspace.
- **Support Contacts**: Update the floating WhatsApp button to point to `+234 706 671 4961`.

#### [MODIFY] [LandingPage.tsx](file:///c:/Users/Rhythm%20Plug/Desktop/PRIMEFLOW/client/src/components/LandingPage.tsx)
- **Support Contacts**: Add `+234 707 292 8256` as the official phone number for calls & WhatsApp, and list `+234 706 671 4961` as the WhatsApp-only support line.
- **FIRS to NRS Replacement**: Rename all references of FIRS to NRS (Federal Inland Revenue Service -> Nigeria Revenue Service).

---

### 3. Compliance Dashboard & AI Advisor

#### [MODIFY] [ComplianceDashboard.tsx](file:///c:/Users/Rhythm%20Plug/Desktop/PRIMEFLOW/client/src/components/ComplianceDashboard.tsx)
- **FIRS to NRS**: Rename FIRS references to NRS.
- **NSITF WhatsApp Auto-Generation**: Add a click trigger on the NSITF item to open a WhatsApp message addressed to `+234 707 292 8256` with a pre-filled text: `"Hello Primeflow, I would like to process my NSITF Compliance Registration."`

#### [MODIFY] [AIAdvisor.tsx](file:///c:/Users/Rhythm%20Plug/Desktop/PRIMEFLOW/client/src/components/AIAdvisor.tsx)
- **SCUML Timeline & Fee**: Update SCUML details to `7–14 working days` and `₦40,000`. Refactor matching pricing and timeline tables.
- **FIRS to NRS**: Rename FIRS references to NRS.

---

### 4. Services Wizard Customizations

#### [MODIFY] [ServicesPortal.tsx](file:///c:/Users/Rhythm%20Plug/Desktop/PRIMEFLOW/client/src/components/ServicesPortal.tsx)
- **Other Services Categories**: Add `"Driver's Licence"` and `"Car Dealer's Licence"` to `OTHER_SUB_SERVICES` list.
- **Dynamic Directors / Shareholders**:
  - Support adding multiple directors/shareholders dynamically using an array state.
  - Allow users to click "Add Director/Shareholder" to append a new details block.
- **Dynamic Board of Trustees**:
  - Support adding multiple trustees members dynamically for NGO/trustee filings.
- **Nigeria States & LGAs Selector**:
  - Inject a database dictionary of all 36 states + FCT with their respective LGAs.
  - Render dynamic select elements for residential/business addresses and state/LGA of origin.
- **Strict Format Validation**:
  - Validate email fields with regex.
  - Validate phone number fields to contain only digits/symbols (no alphabetics).
  - Validate name fields to contain only alphabetics, spaces, and dots.
- **Attachment Max Constraints**:
  - Restrict files queue to a maximum of 5 documents at a time.
  - Reject any file exceeding 5MB individually.
- **Wizard Labels**: Update wizard buttons to display "Previous" and "Next".
- **Post-Submission Survey**:
  - When submission succeeds, render a white-glassmorphic survey questionnaire card.
  - Ask 4 questions (Usability rating, Speed rating, Guideline clarity, Suggestions).
  - Submit survey data to a secure backend endpoint.

---

### 5. Backend Server Refactoring

#### [MODIFY] [auth.ts](file:///c:/Users/Rhythm%20Plug/Desktop/PRIMEFLOW/server/src/routes/auth.ts)
- **Profile Lock**: Restrict text updates inside `/profile/:userId` endpoint to users with `admin` role. Allow avatar picture uploads for both admins and owners.

#### [MODIFY] [services.ts](file:///c:/Users/Rhythm%20Plug/Desktop/PRIMEFLOW/server/src/routes/services.ts)
- **Survey Endpoint**: Add `POST /api/services/survey` to log application review surveys into the audit logs.

#### [MODIFY] [compliance.ts](file:///c:/Users/Rhythm%20Plug/Desktop/PRIMEFLOW/server/src/routes/compliance.ts)
- **FIRS to NRS**: Update seed records and item keys (replace `firs` with `nrs` and FIRS agency with NRS).

---

## Verification Plan

### Automated Tests
- Compile client and server builds:
  - `npm run build` inside `client/`
  - `npm run build` inside `server/`

### Manual Verification
1. Verify the brand logo is updated to the new attached logo across all headers and footers.
2. Verify that the default font size renders at 150% scale.
3. Test searching "SCUML" or "Driver's Licence" in the header and verify it navigates directly to the service wizard.
4. Try updating profile details as a regular client and verify that all text fields are locked.
5. In the Services Portal, test adding 3 directors and verify that all 3 detail cards render.
6. Verify State/LGA dropdowns load and filter dynamically.
7. Test uploading more than 5 documents and check that the constraint blocks the upload.
8. Verify that the 4 survey questions appear after a successful submission.
