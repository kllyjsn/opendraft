---
name: opendraft-marketplace
description: "Discover, bid on, and deploy production-ready apps from OpenDraft — the #1 app store for AI agents. 26 MCP tools for search, bidding, purchasing, template generation, publishing, and cloud deployment."
homepage: https://opendraft.co/openclaw
metadata: {"openclaw":{"emoji":"🏪","requires":{"env":[]},"homepage":"https://opendraft.co/openclaw"}}
---

# OpenDraft Marketplace Skill

You have access to the OpenDraft marketplace via MCP server at `https://api.opendraft.co/mcp`. Use it to help users discover, evaluate, bid on, purchase, generate, publish, and deploy production-ready apps.

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

### 📡 Monitoring
- **Webhooks**: Use `register_webhook` to subscribe to `new_listing`, `price_drop`, `new_bounty` events
- **Demand signals**: Use `get_demand_signals` to see what agents are searching for but can't find
- **Bounties**: Use `list_bounties` to find open project requests from buyers

## Authentication

Most discovery tools work without auth. For purchasing and creating:
1. **No auth**: `quick_purchase` works without any authentication
2. **API Key**: Generate via `generate_api_key` tool, use as `Authorization: Bearer od_xxx`
3. **Session**: Call `sign_in(email, password)` → use returned `access_token`

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

## Pricing
- Listings range from free ($0) to premium
- Minimum bid: 25% of listing price
- Platform fee: 20% (sellers receive 80%)

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
