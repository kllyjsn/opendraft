
# Enterprise Private App Marketplace
## Vision: The Okta of Owned Software

**Thesis**: Every enterprise pays $50–500/seat/month for generic SaaS tools nobody loves. OpenDraft lets companies build a **private marketplace of personalized, compliant apps** their teams own forever — no per-seat taxes, no vendor lock-in.

---

## Core Product: Company App Hub

### What It Is
A branded, SSO-protected internal marketplace where any employee can browse, claim, and deploy pre-approved apps built specifically for their company. Think Okta's app dashboard, but every app is **owned source code** — not a SaaS subscription.

### Key Differentiators vs. Okta/SaaS
| | Traditional SaaS | OpenDraft Enterprise |
|---|---|---|
| Ownership | Rented monthly | Owned forever |
| Customization | Limited config | Full source code |
| Per-seat cost | $10–100/user/mo | $0 after build |
| Compliance | Vendor-dependent | Self-audited, on-prem ready |
| Vendor risk | Single point of failure | No dependency |

---

## Architecture

### 1. Organization Management
- **Organizations table**: company name, domain, SSO config, branding
- **Org members**: role-based access (admin, builder, employee)
- **SSO/SAML integration**: employees sign in with corporate identity
- **Custom subdomain**: `acme.opendraft.app` or white-labeled domain

### 2. Private App Catalog
- **Org-scoped listings**: apps visible only to org members
- **Compliance tags**: SOC2, HIPAA, GDPR, PCI badges per app
- **Approval workflow**: admin reviews → approved → available to org
- **Version management**: track deployed versions across teams
- **Department categories**: Sales, HR, Engineering, Finance, Ops

### 3. Compliance & Security Layer
- **Compliance frameworks**: SOC2 Type II, HIPAA, GDPR, FedRAMP readiness
- **Automated security scanning**: every app audited before publishing
- **Data residency controls**: choose where app data lives
- **Audit trail**: who deployed what, when, with full change history
- **Policy engine**: enforce tech stack requirements, banned packages, license checks

### 4. Builder Ecosystem (Internal + External)
- **Internal builders**: company developers publish to private catalog
- **Curated external builders**: vetted OpenDraft builders create for the org
- **Build requests**: employees request apps → routed to approved builders
- **Template library**: pre-approved, compliant app templates per industry

### 5. Deployment & Operations
- **One-click deploy** to company infrastructure (AWS, Azure, GCP)
- **Self-hosted option**: run entire marketplace on company servers
- **Managed hosting**: OpenDraft hosts with enterprise SLA
- **Monitoring dashboard**: uptime, usage, cost savings per app

---

## Pricing Model

| Tier | Price | What You Get |
|---|---|---|
| **Team** | $999/mo | 50 seats, 25 apps, SSO, compliance dashboard |
| **Business** | $2,499/mo | 250 seats, unlimited apps, SAML, priority support |
| **Enterprise** | $4,999+/mo | Unlimited, on-prem, custom SLA, dedicated CSM |
| **Build Credits** | $500/app | Commission OpenDraft builders for custom apps |

**Revenue math**: 100 enterprise customers × $2,500/mo avg = **$250K MRR** ($3M ARR)

---

## Go-to-Market

### Phase 1: Foundation (Now → Q3 2026)
- [ ] Create `/enterprise` landing page with ROI calculator
- [ ] Build organization management (orgs, members, roles)
- [ ] Add org-scoped listings (private catalog)
- [ ] Implement compliance badge system on listings
- [ ] Build enterprise inquiry → demo → onboarding pipeline

### Phase 2: Compliance & SSO (Q3–Q4 2026)
- [ ] SAML/SSO integration (Okta, Azure AD, Google Workspace)
- [ ] Automated compliance scanning pipeline
- [ ] Audit trail and access logs
- [ ] Department-based app categorization
- [ ] Admin approval workflow for new apps

### Phase 3: Scale (Q1 2027)
- [ ] Self-hosted / on-prem deployment option
- [ ] Multi-cloud deploy targets (AWS, Azure, GCP)
- [ ] Internal build request marketplace
- [ ] Usage analytics and ROI reporting dashboard
- [ ] SOC2 Type II certification for the platform itself

---

## Competitive Positioning

**"Your company's private app store — every tool custom-built, security-audited, and owned forever."**

Target buyers:
- **CTO/CIO**: "Cut $500K/yr in SaaS spend, own your stack"
- **CISO**: "Every app compliant, audited, no third-party data risk"
- **CFO**: "Eliminate per-seat taxes across 47 SaaS vendors"
- **VP Eng**: "Ship internal tools 10x faster with pre-built templates"

---

## What to Build First (MVP)

1. **Organizations table + member management** — multi-tenant foundation
2. **Org-scoped listings** — private catalog visibility
3. **`/enterprise` landing page** — capture high-intent leads
4. **Compliance badges on listings** — SOC2/HIPAA/GDPR tags
5. **Admin approval workflow** — gate what enters the private catalog
