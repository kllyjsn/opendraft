
# Enterprise Team Workspace — Full Build Plan

## Vision
Transform the enterprise landing page into a fully functional product where teams can create organizations, invite members, curate a private app catalog with admin approval workflows, and manage everything from a central dashboard.

---

## Phase 1: Database Enhancements
**Migration to add missing pieces:**
- `org_invitations` table — email-based invites with expiry, status (pending/accepted/expired), and token
- Add `accepted_at` timestamp to `org_members` for tracking
- RLS policies for invitations (org admins can create, invitees can accept)

## Phase 2: Org Creation Flow
- **Create Organization modal/page** — name, slug (auto-generated), optional logo upload
- Accessible from the Enterprise page CTA and from the user dashboard
- Auto-adds creator as `owner` via existing trigger
- Redirects to org dashboard after creation

## Phase 3: Org Dashboard (`/org/:slug`)
Central hub with 4 tabs:
1. **Overview** — org name, member count, app count, quick stats
2. **Members** — list members, invite new (by email), change roles, remove
3. **App Catalog** — browse org-approved apps, submit new apps for approval
4. **Settings** — org name, logo, branding, SSO config (owner/admin only)

## Phase 4: Team Invitation System
- Admin/owner enters email → creates invitation record + sends notification
- Invitee signs up/logs in → sees pending invitation → accepts → becomes member
- Invitation banner on dashboard for users with pending invites
- Invitation expiry (7 days)

## Phase 5: Private App Catalog & Approval Workflow
- Org members can submit marketplace listings to the org catalog
- Admins see pending submissions → approve/reject with notes
- Approved apps appear in the org's private catalog
- Compliance tags auto-inherited from listing security scans
- Filter by department, compliance framework, status

## Phase 6: Routing & Navigation
- `/org/new` — create organization
- `/org/:slug` — org dashboard (tabs: overview, members, catalog, settings)
- Add "My Organization" link in authenticated nav when user belongs to an org
- Enterprise page CTAs route to `/org/new` for authenticated users

---

## File Structure
```
src/pages/OrgNew.tsx          — create org form
src/pages/OrgDashboard.tsx    — tabbed org dashboard
src/components/org/
  OrgOverview.tsx             — stats & quick actions
  OrgMembers.tsx              — member list & invite
  OrgCatalog.tsx              — private app catalog
  OrgSettings.tsx             — org settings
  OrgInviteBanner.tsx         — pending invite banner
  InviteMemberDialog.tsx      — invite modal
  AppApprovalCard.tsx         — approve/reject app card
  SubmitAppDialog.tsx         — submit listing to org
src/hooks/useOrg.ts           — org data & membership hook
```

## Security
- All org data protected by RLS using `is_org_member` / `is_org_admin` functions
- Invitation tokens are UUIDs, single-use
- Only owners can delete org or transfer ownership
- Only admins+ can invite, approve apps, change roles
