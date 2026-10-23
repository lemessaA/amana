# AMANA Frontend Implementation Plan

## Audit Summary

**Current State:**
- Next.js 16.2.2 with App Router (strict TypeScript mode enabled)
- Tailwind CSS 4.2.2 with PostCSS integration
- Basic pages exist (login, register, devices, etc.) but minimal styling
- Two lib utilities: `auth.ts` (useRequireAuth hook) and `api.ts` (apiFetch helper)
- No component library (shadcn/ui, Lucide, forms, validation) installed
- No dark theme configured; default light colors in globals.css
- All pages are client-side rendered ("use client")

**Backend API Surface Confirmed:**
- Authentication: POST /auth/register, POST /auth/login, GET /auth/me
- Devices: POST /devices/register, GET /devices/lookup (public), POST /devices/{id}/release
- Theft Reports: POST /theft-reports, details via GET /investigations/{id}
- Investigations (theft cases): GET /investigations/queue, GET /investigations/{id}, POST /investigations/{id}/triage, POST /investigations/{id}/extend, POST /investigations/{id}/reopen, POST /process-deadlines
- Claim Disputes: POST /claim-disputes, GET /claim-disputes/queue, POST /claim-disputes/{id}/resolve, POST /claim-disputes/{id}/extend, POST /claim-disputes/{id}/release
- Identifier Conflicts: POST /identifier-conflicts, GET /identifier-conflicts/queue, POST /identifier-conflicts/{id}/resolve, POST /identifier-conflicts/{id}/extend
- Transfers: POST /transfers/initiate, POST /transfers/{id}/accept, POST /transfers/{id}/decline, POST /transfers/{id}/cancel, POST /transfers/expire-overdue
- Evidence: POST /evidence/upload, POST /evidence/{id}/review
- Notifications: GET /notifications
- Account: GET /auth/me, POST /account/deactivate, GET /account/limited-case-access
- Reconsiderations: POST /reconsiderations, GET /reconsiderations, POST /reconsiderations/{id}/decide

**Known API Gaps for Frontend:**
- No GET /devices endpoint to list user's devices (frontend will need to track registered device IDs or fetch case-related data only)
- No endpoint to list user's theft reports or cases (only reviewer queue)
- No endpoint to get transfer details by ID (only initiate/accept/decline/cancel)
- Limited support for listing user's own disputes/conflicts in main routes (only reviewer queues exist)

## Implementation Order & Rationale

Implementation follows dependency order: design tokens first, then API client, then shared components, then pages. Pages are ordered by criticality and feature dependencies.

---

- [ ] 1. Update Tailwind and PostCSS configuration with AMANA dark palette and design tokens.
      Replace globals.css with Tailwind v4 CSS custom properties for the dark palette (primary bg, sidebar bg, card bg, elevated surface, accents, text colors, semantic colors). Configure tailwind.config.ts with the custom theme.
      Files: `src/app/globals.css`, `tailwind.config.ts` (create new)
      Verify: `npm run build` succeeds. Inspect built CSS for custom properties. Load /login in browser and confirm dark colors apply.

- [ ] 2. Install and initialize required dependencies: shadcn/ui, lucide-react, react-hook-form, @hookform/resolvers, zod.
      Run `npx shadcn-ui@latest init` to set up shadcn/ui with default Tailwind config, then install lucide-react, react-hook-form, @hookform/resolvers, and zod with npm. Update package.json if needed.
      Files: `package.json` (update)
      Verify: `npm list lucide-react react-hook-form zod` and confirm all are installed. `npm run build` succeeds.

- [ ] 3. Extend the centralized API client with full endpoint coverage and typed schemas.
      Replace `src/lib/api.ts` with complete typed wrapper functions for all backend endpoints: auth, devices, reports, investigations, disputes, conflicts, transfers, evidence, notifications, account, reconsiderations. Include Bearer token injection from localStorage. Add error handling and optional retry logic. Export typed response types.
      Files: `src/lib/api.ts`
      Verify: `npm run build` succeeds. Code compiles with no TypeScript errors.

- [ ] 4. Create the AppLayout wrapper component with responsive design system.
      Build `src/components/AppLayout.tsx` (or separate Sidebar and Header if more modular) to provide a reusable shell: dark-themed sidebar with role-based navigation, collapsible on mobile, top navigation bar with user menu and notifications badge, main content area with padding, breadcrumb placeholder. Accept `children` prop. Sidebar includes navigation links (Overview, My Devices, Register Device, Theft Reports, Claims and Disputes, Transfers, Notifications, Account Settings, and conditional admin/reviewer routes). Header includes logout, user info, notification icon.
      Files: `src/components/AppLayout.tsx` (or `src/components/Sidebar.tsx`, `src/components/Header.tsx`)
      Verify: Visual inspection and `npm run build` succeeds.

- [ ] 5. Create reusable UI components: Button, Input, Select, Card, Badge, Dialog/Modal, Alert, Tabs.
      Use shadcn/ui and Tailwind to build or wrap: Button (variants: primary, secondary, danger; sizes: sm, md, lg), Input (with label, error, disabled states), Select (dropdown), Card (header, body, footer), Badge (status colors), Dialog (modal for confirmations), Alert (error, warning, success), Tabs. All use the AMANA color palette. Components live in `src/components/ui/`.
      Files: Create multiple files in `src/components/ui/`
      Verify: `npm run build` succeeds. Visually confirm all components render with correct colors and states.

- [ ] 6. Create form components: FormField (wrapper), FormError, FormLabel.
      Build higher-level form field components that wrap react-hook-form and integrate with Zod validation. Simplify form page code. Located in `src/components/forms/`.
      Files: `src/components/forms/FormField.tsx`, `src/components/forms/FormError.tsx`, `src/components/forms/FormLabel.tsx` (or single file)
      Verify: `npm run build` succeeds.

- [ ] 7. Refactor the login page with polished UI, form validation, and error handling.
      Update `src/app/login/page.tsx`: remove inline styles, integrate AppLayout, use form components, add Zod schema for email/password, implement proper error messages, show loading state during submission, redirect to dashboard on success (using useRouter).
      Files: `src/app/login/page.tsx`
      Verify: Navigate to /login in browser. Test successful and failed login flows. Check that token is stored and user is redirected.

- [ ] 8. Build the registration page with form validation, terms acceptance, and error handling.
      Create/update `src/app/register/page.tsx`: email, password, confirm password, terms checkbox (required). Use Zod schema, form components, error display. On success, store token and redirect to dashboard or onboarding. Mirror login styling.
      Files: `src/app/register/page.tsx`
      Verify: Test successful and failed registration. Confirm terms checkbox is required. Check token storage and redirect.

- [ ] 9. Build the public landing page (/index or /home) with hero section, feature overview, and CTAs.
      Create or significantly enhance `src/app/page.tsx` to replace the current placeholder: hero section with headline "Know the Device. Check the Status. Make Informed Decisions.", supporting text, CTA buttons (Check Device Status → /lookup, Register a Device → /register for unauthenticated users or /devices for authenticated). Add sections: How AMANA Works, Register and Document Claims, Report Suspected Theft, Resolve Disputes, Check Device Status, FAQ, Privacy Notice, Footer. Use smooth scrolling, professional layout, and dark palette. No stock images; use CSS or simple SVG components for device/security icons.
      Files: `src/app/page.tsx`
      Verify: Visual inspection. Navigate to / (or / redirected by middleware). Confirm all sections render, CTAs navigate correctly, responsive on mobile/tablet.

- [ ] 10. Build the public device lookup page (/lookup).
       Create `src/app/lookup/page.tsx` (or enhance if exists): search form for device identifier (IMEI, serial, etc.), calls GET /devices/lookup (no auth required), displays PublicLookupResponse with effective_status and explanation. Show: status badge (safe/restricted/unknown/etc.), explanation text, related actions (e.g., "Report this device"). No authentication required. Clear, readable layout emphasizing trust and clarity.
       Files: `src/app/lookup/page.tsx`
       Verify: Test lookup with known and unknown identifiers. Confirm status and explanation render correctly.

- [ ] 11. Build the authenticated dashboard (/dashboard or redirect / to /dashboard for logged-in users).
        Create `src/app/dashboard/page.tsx`: fetch GET /auth/me to confirm user role, display summary cards (registered devices, active claims, open reports, pending transfers, notifications count—using placeholder data fetched from available endpoints or display 0 if endpoint unavailable). Show recent activity sections, pending actions, quick navigation. Route-protect with useRequireAuth. Use AppLayout. Empty states for new users. Skeleton loading during fetch.
        Files: `src/app/dashboard/page.tsx`
        Verify: Log in, navigate to /dashboard. Confirm user info, summary cards, and sections display. Check responsive layout on mobile.

- [ ] 12. Build the device registration form page (/devices/register).
        Update or create `src/app/devices/register/page.tsx`: form for device_type (phone, computer), identifier_type (imei, serial, etc.), identifier_value. Optional: receipt upload, acquisition basis picker. Zod validation. Submit POST /devices/register, display device_id on success, allow copy-to-clipboard. Form reset option. Use AppLayout. Inline help text for each field.
        Files: `src/app/devices/register/page.tsx`
        Verify: Test successful registration. Check that device_id is displayed. Confirm error messages for invalid input.

- [ ] 13. Build the theft report form page (/reports/new).
        Create `src/app/reports/new/page.tsx`: form for identifier_value (device lookup), allegation_category (dropdown: theft, suspicious, damage, etc. — confirm options from backend), description (textarea), optional incident_period. Zod validation. Submit POST /theft-reports. Display case_id and status on success. Explain that reports are screened. Use AppLayout.
        Files: `src/app/reports/new/page.tsx`
        Verify: Submit a theft report. Check that case is created and case_id is shown. Confirm validation errors display.

- [ ] 14. Build the claim dispute form page (/disputes/new).
        Create `src/app/disputes/new/page.tsx`: form for identifier_value (device lookup), acquisition_basis (picker: purchase, gift, inherit, etc.), description (textarea). Zod validation. Submit POST /claim-disputes. Display case_id and deadline_at on success. Explain dispute process. Use AppLayout.
        Files: `src/app/disputes/new/page.tsx`
        Verify: Submit a claim dispute. Confirm case is created with deadline.

- [ ] 15. Build the identifier conflict report form page (/conflicts/new).
        Create `src/app/conflicts/new/page.tsx`: form for identifier_value (the conflicting identifier). Zod validation. Submit POST /identifier-conflicts. Display case_id and deadline_at on success. Brief explanation. Use AppLayout.
        Files: `src/app/conflicts/new/page.tsx`
        Verify: Submit an identifier conflict. Confirm case is created.

- [ ] 16. Build the notifications list page (/notifications).
        Create `src/app/notifications/page.tsx`: fetch GET /notifications (authenticated). Display list of notifications with channel, type, delivery_status, created_at. Sort by newest first. Empty state if none. Use AppLayout. Link to relevant detail pages if applicable (e.g., click a transfer notification → /transfers).
        Files: `src/app/notifications/page.tsx`
        Verify: Fetch and display notifications. Confirm responsive layout.

- [ ] 17. Build the account settings page (/account).
        Create `src/app/account/page.tsx`: fetch GET /auth/me to display user email and role, show account_status. Display deactivation option (warning + confirm modal). Submit POST /account/deactivate. Show last-login, if available. Use AppLayout. Include locale preference if supported. Audit log link if available.
        Files: `src/app/account/page.tsx`
        Verify: Load account page. Display user info. Test deactivation flow (confirm modal, submit, redirect to login or limited access page).

- [ ] 18. Build the transfers page (/transfers).
        Create `src/app/transfers/page.tsx`: section to initiate transfer (form: device_id lookup via identifier or dropdown, recipient_user_id email input). POST /transfers/initiate. Show list of pending transfers (if endpoint exists; otherwise show message). For each pending transfer: accept, decline, cancel actions. Use AppLayout. Explain transfer process and expiry.
        Files: `src/app/transfers/page.tsx`
        Verify: Initiate a transfer. Display transfer in pending list. Test accept/decline/cancel actions.

- [ ] 19. Build the investigation/case detail page (/investigations/[id] or /cases/[id]).
        Create `src/app/investigations/[id]/page.tsx`: fetch GET /investigations/{id} (reviewer-only; show 403 if not reviewer). Display case_id, device_id, status, outcome, opened_at, deadline_at, related theft_reports (list), active restrictions (list). Show triage options (if status is "open" or "investigating"): outcome picker (approved, rejected, etc.), reason textarea, optional next_review_days. Submit POST /investigations/{id}/triage. Show extend and reopen actions if user is senior_reviewer. Use AppLayout.
        Files: `src/app/investigations/[id]/page.tsx`
        Verify: Navigate to a known investigation ID. Confirm case details display. Test triage form (as reviewer).

- [ ] 20. Build the investigation queue page (/admin/investigations or /reviewer/cases).
        Create `src/app/admin/investigations/page.tsx`: fetch GET /investigations/queue (reviewer-only). Display table/list of open/investigating cases assigned to current reviewer (or all if senior_reviewer). Show case_id, device_id, opened_at, deadline_at, remaining_hours, has_provisional_restriction, triage_due_at. Sort by deadline ascending (most urgent first). Clickable rows → /investigations/[id]. Filters: status, assigned to me / all. Use AppLayout.
        Files: `src/app/admin/investigations/page.tsx`
        Verify: Load queue as reviewer. Confirm cases display with correct timing. Click case to navigate to detail.

- [ ] 21. Build the claim dispute detail and queue pages (/disputes/[id], /admin/disputes).
        Create `src/app/disputes/[id]/page.tsx`: fetch GET dispute details (note: no dedicated endpoint; reconstruct from case if available or use queue endpoint). Display case_id, device_id, requester_user_id, opened_at, deadline_at, status, outcome. If reviewer: show resolve form (outcome picker: acknowledge/reject/defer, reason textarea, optional next_review_days). Submit POST /claim-disputes/{id}/resolve. Show extend and release options. Create `src/app/admin/disputes/page.tsx`: fetch GET /claim-disputes/queue. Display table of open disputes. Click to detail page. Use AppLayout.
        Files: `src/app/disputes/[id]/page.tsx`, `src/app/admin/disputes/page.tsx`
        Verify: Load dispute queue and detail pages. Test resolve action as reviewer.

- [ ] 22. Build the identifier conflict detail and queue pages (/conflicts/[id], /admin/conflicts).
        Create `src/app/conflicts/[id]/page.tsx`: fetch conflict details. Display case_id, device_identifier_id, existing_device_id, submitted_by, opened_at, deadline_at, status, outcome. If reviewer: show resolve form (outcome picker: duplicate/data_entry_error/legitimate_additional_identifier/unresolved_conflict, reason textarea, next_review_days if unresolved_conflict). Submit POST /identifier-conflicts/{id}/resolve. Show extend option. Create `src/app/admin/conflicts/page.tsx`: fetch GET /identifier-conflicts/queue. Display table of open conflicts. Click to detail. Use AppLayout.
        Files: `src/app/conflicts/[id]/page.tsx`, `src/app/admin/conflicts/page.tsx`
        Verify: Load conflict queue and detail pages. Test resolve action as reviewer.

- [ ] 23. Build the evidence upload and review interface.
        Create `src/components/EvidenceUpload.tsx` component: file input, drag-and-drop area, upload progress bar, success confirmation. POST /evidence/upload (multipart: file + optional claim_id or case_id). Display evidence_id, review_status, file_size on success. Create `src/app/admin/evidence/page.tsx` (reviewer-only): fetch pending evidence (query from evidence list endpoint if available, or display message if missing endpoint). For each evidence item: review form (decision: approved/rejected, reason textarea). Submit POST /evidence/{id}/review. Show evidence_id, review_status, file_size.
        Files: `src/components/EvidenceUpload.tsx`, `src/app/admin/evidence/page.tsx`
        Verify: Upload a file. Confirm evidence_id and review_status display. Test review action as reviewer.

- [ ] 24. Build the reconsideration request form and list pages (/reconsiderations/new, /reconsiderations).
        Create `src/app/reconsiderations/new/page.tsx`: form for case_type (dropdown: investigation, dispute, conflict), case_id (UUID input), reason (textarea). Zod validation. Submit POST /reconsiderations. Display request_id and status on success. Create `src/app/reconsiderations/page.tsx`: fetch GET /reconsiderations (list user's reconsiderations). Display list: request_id, case_type, case_id, status, outcome, submitted_at. Conditionally show decision form if status is "pending" and user is senior_reviewer (POST /reconsiderations/{id}/decide with outcome and reason). Use AppLayout.
        Files: `src/app/reconsiderations/new/page.tsx`, `src/app/reconsiderations/page.tsx`
        Verify: Submit a reconsideration request. List own reconsiderations. Test decision action as senior_reviewer.

- [ ] 25. Implement authentication middleware/protected routes.
        Create `src/middleware.ts` or use server-side checks in layout: protect authenticated routes with useRequireAuth hook or server-side session validation. Redirect unauthenticated users to /login. Protect reviewer/admin routes with role checks (403 if not reviewer/admin). Store token in localStorage; consider using cookies for better security. Redirect to /limited-access if account_status is "deactivated" but user tries to access protected routes (allow limited access endpoint).
        Files: `src/middleware.ts` (create if using Next.js middleware) or enhance `src/lib/auth.ts`
        Verify: Try accessing /dashboard without logging in → redirect to /login. Log in, navigate to /admin/investigations as non-reviewer → 403 or redirect. Log in as reviewer → can access admin pages.

- [ ] 26. Implement loading states, error boundaries, and retry logic.
        Add Suspense boundaries with skeleton loaders for async data fetches. Create `src/components/ErrorBoundary.tsx` to catch React errors. Add error pages: `src/app/error.tsx` (global), `src/app/404.tsx` or `src/app/not-found.tsx`. Implement retry buttons in error states. Add loading spinners in forms during submission. Update API client to handle network errors gracefully and provide user-friendly messages.
        Files: `src/components/ErrorBoundary.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`, update `src/lib/api.ts`
        Verify: Simulate network error (network throttle in dev tools). Confirm error message displays and retry button works. Test 404 by navigating to unknown route.

- [ ] 27. Implement the limited-access page for deactivated accounts (/limited-access).
        Create `src/app/limited-access/page.tsx`: fetch GET /account/limited-case-access (for deactivated accounts). Display read-only summary: investigations, claim_disputes, identifier_conflicts, reconsiderations, pending_transfers (all with limited details). Explain account deactivation status. Provide support contact or reactivation request option (if endpoint exists). No mutations allowed. Use simple, accessible layout.
        Files: `src/app/limited-access/page.tsx`
        Verify: Deactivate an account, log out, log back in, navigate to /limited-access. Confirm case summary displays.

- [ ] 28. Enhance the public landing page with detailed sections and smooth UX.
        Add to `src/app/page.tsx` (if not fully completed in step 9): animated scroll-to-section navigation, feature cards with icons (use Lucide), FAQ accordion, privacy notice section, footer with links and copyright. Ensure mobile responsiveness. Keep design clean and professional (no excessive animations or gradients). Use AMANA color accents sparingly.
        Files: `src/app/page.tsx` (enhance)
        Verify: Load / in browser. Test all navigation, CTAs, responsive layout on mobile/tablet.

- [ ] 29. Implement breadcrumbs and page titles consistently across app.
        Add a Breadcrumb component in `src/components/Breadcrumb.tsx`. Use in AppLayout or individual pages to show navigation path. Ensure all authenticated pages have clear, descriptive titles (using `<Metadata>` for SSR or title tags). Example: "/admin/investigations" → Breadcrumb: "Admin > Investigations".
        Files: `src/components/Breadcrumb.tsx`, update pages to use it
        Verify: Load several pages. Confirm breadcrumb navigation displays correctly. Test breadcrumb clicks navigate.

- [ ] 30. Add accessibility features: ARIA labels, semantic HTML, keyboard navigation, focus states.
        Audit all components and pages: ensure form labels are associated with inputs (use htmlFor), buttons have descriptive text, images have alt text, use semantic HTML tags (main, nav, section, article), ensure color contrast meets WCAG standards, test keyboard navigation (tab through form, use arrow keys in dropdowns). Add focus styles to interactive elements. Use Lucide icons with proper alt text or aria-label.
        Files: Update all components and pages
        Verify: Use keyboard only to navigate a form page (tab, enter, arrow keys). Check color contrast with browser tools or axe DevTools extension. Run Lighthouse accessibility audit; target score ≥ 90.

- [ ] 31. Build the responsive mobile menu for small screens.
        Enhance AppLayout Sidebar to collapse on mobile (< 768px) into a hamburger menu. Create `src/components/MobileMenu.tsx` if separate. Ensure all navigation is accessible via mobile menu. Test touch interactions. Use media queries or Tailwind's responsive utilities (md:, lg: prefixes).
        Files: Update `src/components/AppLayout.tsx` or create `src/components/MobileMenu.tsx`
        Verify: Load on mobile device or use browser device emulation. Test opening/closing menu. Navigate through menu. Confirm all pages are usable on mobile.

- [ ] 32. Set up environment configuration for API base URL.
        Create `src/config.ts` or use .env.local: set NEXT_PUBLIC_API_BASE_URL to backend URL (e.g., http://localhost:8000/api/v1 for dev, production URL for prod). Update `src/lib/api.ts` to use this config. Ensure frontend can connect to both local and deployed backends without code changes.
        Files: Create `src/config.ts` or update `.env.local` and `src/lib/api.ts`
        Verify: Run `npm run dev`, confirm API calls succeed against backend. Check that changing API_BASE_URL in env switches backend correctly.

- [ ] 33. Add client-side form validation and state management for complex flows.
        For multi-step flows (e.g., transfer initiation with recipient lookup), use React state or Zod + react-hook-form to manage form state across steps. Persist form data during navigation (e.g., via URL params or React Context) so users don't lose progress if they navigate away. Test cancel and back buttons.
        Files: Update form pages as needed
        Verify: Start a multi-step form, navigate away, return → confirm form data is preserved (or provide save/resume option).

- [ ] 34. Implement notification badge and real-time polling (if needed).
        Update AppLayout Header to show notification count badge (fetched from GET /notifications). Optionally add polling interval (e.g., refresh every 30s) or use WebSocket if backend supports it (not mentioned in current API). Show badge with unread count if available. Click → /notifications.
        Files: Update `src/components/Header.tsx` or AppLayout
        Verify: Fetch notifications. Confirm badge count displays. Click badge → navigate to /notifications.

- [ ] 35. Test end-to-end user flows and fix integration issues.
        Test complete user journeys: register → device lookup → register device → report theft → reviewer accepts investigation → dispute resolution → transfer device. Confirm all API calls succeed, data persists, redirects work, error handling is graceful. Load test pages in multiple browsers (Chrome, Firefox, Safari on macOS/iOS if possible). Check responsive design on actual devices (phone, tablet, desktop).
        Files: Manual testing (no new files)
        Verify: Complete at least 3 end-to-end flows from registration to a case outcome. All pages render without errors. No console warnings.

- [ ] 36. Finalize styling and polish UX: review colors, spacing, typography, transitions.
        Audit all pages against the AMANA design spec: verify dark palette applied consistently, spacing/padding is uniform, typography hierarchy is clear (use Tailwind text sizes), transitions are subtle (avoid jarring animations). Ensure buttons, forms, and interactive elements provide clear visual feedback (hover, active, focus states). Remove any temporary placeholder styling. Test print styles if relevant.
        Files: Update CSS/Tailwind config and component styles as needed
        Verify: Visual inspection of all pages in browser. Confirm color palette matches spec. Test hover/active/focus states on interactive elements. Print a page and ensure it's readable.

- [ ] 37. Build and test production build.
        Run `npm run build`. Fix any build errors or TypeScript warnings. Test the production build locally with `npm start` to ensure SSR, static generation, and dynamic routes work correctly. Verify no console errors in production build.
        Files: No new files
        Verify: `npm run build` succeeds with no errors. `npm start` runs without errors. Navigate app in production build and confirm all pages load.

- [ ] 38. Create deployment configuration and documentation.
        Create or update `.env.production` for production API URL. Document deployment process: build steps, environment variables, required Node.js version, any database or external dependencies. Add README.md with setup instructions for new developers.
        Files: `.env.production`, `README.md` (update if exists, create if not)
        Verify: Review documentation is complete. Confirm build and dev setup instructions work for a fresh clone.

---

## Key Implementation Notes

1. **API Token Handling:** Store Bearer token in localStorage after login. Inject into all authenticated requests in `apiFetch` header. On logout, clear token and redirect to /login.

2. **Role-Based Navigation:** Sidebar and AppLayout conditionally render routes based on user role (from GET /auth/me). Non-reviewers don't see /admin routes in UI, but backend still enforces 403 on API calls.

3. **Missing Endpoints:**
   - No GET /devices to list user's devices; frontend tracks device_id from registration success response.
   - No dedicated get-dispute, get-conflict detail endpoints; detail data may be sparse (consider combining queue endpoint data).
   - No transfer details by ID; transfer data only in queue or after action responses.
   - Consider adding these to backend if needed for better UX, or document limitation in frontend.

4. **Styling Approach:** Use Tailwind CSS v4 with custom CSS properties for the AMANA dark palette. All components inherit from globals.css. No CSS modules needed; Tailwind handles responsive design. shadcn/ui components integrate seamlessly.

5. **Component Organization:**
   - `src/components/ui/` — reusable low-level UI components (Button, Input, Card, etc.)
   - `src/components/forms/` — form-specific wrappers and helpers
   - `src/components/` — higher-level composed components (AppLayout, EvidenceUpload, etc.)
   - `src/app/` — Next.js App Router pages
   - `src/lib/` — utilities (api.ts, auth.ts, config.ts, validation schemas)

6. **Error Handling:** apiFetch throws on non-2xx status. Catch errors in components and display user-friendly messages. Retry buttons for network errors. Log errors to console in dev.

7. **Loading States:** Use React Suspense + skeleton components for SSR pages, or loading spinners for client-side fetches.

8. **Testing:** Manual testing in dev server and production build. Use browser DevTools for network inspection and responsive design testing. No automated test suite mentioned; consider adding jest/vitest if needed later.

---

## Dependency Installation Summary

Run the following in `frontend/` directory:

```bash
npm install lucide-react react-hook-form @hookform/resolvers zod
npx shadcn-ui@latest init
```

shadcn/ui init will prompt for component locations and Tailwind config; accept defaults (components in `src/components/ui`).

Already installed: Next.js, React, TypeScript, Tailwind CSS, PostCSS, ESLint.

---

## Verification Commands

- **Build:** `npm run build`
- **Dev server:** `npm run dev` (runs on http://localhost:3000 by default)
- **Lint:** `npm run lint`
- **Manual testing:** Open browser to http://localhost:3000, test UI and API integration

