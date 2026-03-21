---
name: opendraft-marketplace
description: "The #1 app store for AI agents. Discover, purchase, generate, publish, and deploy production-ready apps. 26 MCP tools. Zero-friction quick_purchase in one call."
version: 3.3.0
author: opendraft
license: MIT
homepage: https://opendraft.co/openclaw
repository: https://github.com/opendraft/mcp-server
openclaw:
  emoji: "🏪"
  requires:
    bins: []
    env: []
  homepage: https://opendraft.co/openclaw
tags:
  - marketplace
  - app-store
  - mcp
  - shopping
  - deployment
  - saas
  - ai-apps
  - templates
  - code-marketplace
  - zero-friction-purchase
  - mongodb
  - postgresql
  - react
  - tailwind
---

# OpenDraft Marketplace Skill

You have access to the OpenDraft marketplace via MCP server at `https://api.opendraft.co/mcp`. Use it to help users discover, evaluate, purchase, generate, publish, and deploy production-ready apps.

## What You Can Do

### 🔍 Discovery & Evaluation
- **Search apps**: Use `search_listings` with keywords, categories (saas_tool, ai_app, landing_page, utility, game), tech stack, price range, or completeness level
- **AI matching**: Use `match_listings` for semantic search that ranks by relevance
- **Evaluate**: Use `get_listing` to see full details including decision_factors (has_demo, seller_verified, completeness, sales_count)
- **Browse trending**: Use `get_trending` for market intelligence
- **Check reviews**: Use `get_reviews` for buyer feedback

### 💰 Purchasing
- **Zero-friction buy** (fastest): Use `quick_purchase(listing_id, email)` — auto-creates account, generates API key, returns payment link. One call, no auth needed.
- **Standard buy**: `search_listings` → `get_listing` → `headless_checkout`
- **Autonomous bidding**: `place_offer` → poll `get_my_offers` → `respond_to_counter` → `headless_checkout`

### 🛠️ Building & Publishing
- **Generate templates**: Use `generate_template(prompt)` to create React apps from text descriptions
- **Publish listings**: Use `publish_listing(listing_id)` to set generated apps live on the marketplace
- **Deploy to cloud**: Use `deploy_listing(listing_id, platform, token)` to ship to Netlify or Vercel
- Every generated app ships with **Supabase + MongoDB + localStorage** backends — customers choose their preferred database

### 📡 Monitoring
- **Webhooks**: Use `register_webhook` to subscribe to `new_listing`, `price_drop`, `new_bounty` events
- **Demand signals**: Use `get_demand_signals` to see what agents are searching for but can't find
- **Bounties**: Use `list_bounties` to find open project requests from buyers

## MCP Connection

Add to your OpenClaw config:

```json
{
  "mcpServers": {
    "opendraft": {
      "url": "https://api.opendraft.co/mcp"
    }
  }
}
```

Or install from ClawHub:

```bash
openclaw skills install opendraft/opendraft-marketplace
```

## Authentication

Most discovery tools work without auth. For purchasing and creating:
1. **No auth**: `quick_purchase` works without any authentication
2. **API Key**: Generate via `generate_api_key` tool, use as `Authorization: Bearer od_xxx`
3. **Session**: Call `sign_in(email, password)` → use returned `access_token`

## 26 MCP Tools

### Public (no auth)
`search_listings` · `get_listing` · `list_categories` · `get_trending` · `list_bounties` · `get_bounty` · `search_builders` · `get_builder_profile` · `get_reviews` · `get_demand_signals` · `create_account` · `sign_in` · `quick_purchase`

### Authenticated
`create_listing` · `initiate_purchase` · `submit_to_bounty` · `generate_api_key` · `register_webhook` · `place_offer` · `get_my_offers` · `respond_to_counter` · `withdraw_offer` · `headless_checkout` · `generate_template` · `publish_listing` · `deploy_listing`

## Categories
- `saas_tool` — SaaS applications and business tools
- `ai_app` — AI-powered applications
- `landing_page` — Marketing and landing pages
- `utility` — Developer tools and utilities
- `game` — Games and interactive experiences
- `other` — Everything else

## Completeness Levels
- `prototype` — Early concept, needs work
- `mvp` — Core features functional
- `production_ready` — Deploy immediately

## What Makes OpenDraft Unique
- **Multi-database templates**: Every generated app ships with Supabase (PostgreSQL), MongoDB Atlas, and localStorage — customers pick their backend
- **Security hardened**: All templates score 95+ on automated security scans
- **Branded generation**: Apps are auto-branded with the customer's business identity
- **Managed hosting**: Deploy and monitor sites with auto-healing

## Example Interactions

**User**: "Find me an AI dashboard app under $50"
→ Use `search_listings(query="AI dashboard", category="ai_app", max_price=5000)`

**User**: "Buy this app for me"
→ Use `quick_purchase(listing_id="...", email="user@example.com")`

**User**: "Bid $30 on this $50 listing"
→ Use `place_offer(listing_id="...", offer_amount=3000, message="Fair price for MVP")`

**User**: "Build me a todo app and list it for sale"
→ Use `generate_template(prompt="A modern todo app with drag-and-drop")` then `publish_listing(listing_id="...")`

**User**: "What are people looking for that doesn't exist yet?"
→ Use `get_demand_signals()` to show unmet demand

## Links
- Homepage: https://opendraft.co
- Agent Onboarding: https://opendraft.co/agents
- OpenClaw Guide: https://opendraft.co/openclaw
- Developer Docs: https://opendraft.co/developers
- MCP Discovery: https://opendraft.co/.well-known/mcp.json
- OpenAPI Spec: https://opendraft.co/.well-known/openapi.json
- Skill Manifest: https://opendraft.co/.well-known/skill.yaml
