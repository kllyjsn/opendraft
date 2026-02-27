import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CanonicalTag } from "@/components/CanonicalTag";
import { JsonLd } from "@/components/JsonLd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Terminal, Zap, Key, BookOpen, ExternalLink, Copy, Check, Globe, Bot, ArrowRight, Workflow, ShoppingCart } from "lucide-react";
import { useState } from "react";

const MCP_URL = "https://api.opendraft.co/mcp";
const API_URL = "https://api.opendraft.co/v1";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  return (
    <div className="relative group">
      <CopyButton text={code} />
      <pre className="bg-foreground/[0.03] border border-border rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed text-foreground/80">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const mcpTools = [
  { name: "search_listings", desc: "Search apps by keyword, category, tech stack, price, completeness", auth: false },
  { name: "get_listing", desc: "Get full details for a listing including seller and reviews", auth: false },
  { name: "list_categories", desc: "Get all categories with listing counts", auth: false },
  { name: "get_trending", desc: "Trending listings, hot bounties, and market intelligence", auth: false },
  { name: "list_bounties", desc: "Browse open bounties from buyers seeking custom builds", auth: false },
  { name: "get_bounty", desc: "Get full details for a specific bounty", auth: false },
  { name: "search_builders", desc: "Search builders by username or browse top builders", auth: false },
  { name: "get_builder_profile", desc: "View a builder's full profile and listings", auth: false },
  { name: "get_reviews", desc: "Get reviews and average rating for a listing", auth: false },
  { name: "get_demand_signals", desc: "See what agents are searching for but can't find — unmet market needs", auth: false },
  { name: "create_account", desc: "Register a new user account", auth: false },
  { name: "sign_in", desc: "Authenticate and get an access token for write operations", auth: false },
  { name: "quick_purchase", desc: "One-call frictionless purchase: auto-creates account, generates API key, returns payment link", auth: false },
  { name: "generate_api_key", desc: "Create a persistent API key (od_xxx) for agent auth", auth: true },
  { name: "register_webhook", desc: "Subscribe to events (new listings, price drops, bounties)", auth: true },
  { name: "create_listing", desc: "List a new app for sale on the marketplace", auth: true },
  { name: "submit_to_bounty", desc: "Submit a listing as a solution to an open bounty", auth: true },
  { name: "initiate_purchase", desc: "Start a Stripe checkout session for a listing", auth: true },
  { name: "place_offer", desc: "Place a bid/offer on a listing (min 25% of price)", auth: true },
  { name: "get_my_offers", desc: "View all your bids with status, counters, and next actions", auth: true },
  { name: "respond_to_counter", desc: "Accept, reject, or counter a seller's counter-offer", auth: true },
  { name: "withdraw_offer", desc: "Cancel a pending or countered offer", auth: true },
  { name: "headless_checkout", desc: "Get a payment link without browser redirects — API-driven checkout", auth: true },
];

const restEndpoints = [
  { method: "GET", path: "/listings", desc: "Search listings with query params" },
  { method: "GET", path: "/listings/:id", desc: "Get listing by UUID" },
  { method: "GET", path: "/trending", desc: "Trending listings and stats" },
  { method: "GET", path: "/bounties", desc: "Browse open bounties" },
  { method: "GET", path: "/builders", desc: "Search builders" },
  { method: "GET", path: "/builders/:username", desc: "Get builder profile" },
  { method: "GET", path: "/categories", desc: "Category breakdown with counts" },
  { method: "GET", path: "/openapi.json", desc: "OpenAPI 3.1 specification" },
];

export default function Developers() {
  return (
    <div className="min-h-screen bg-background">
      <CanonicalTag path="/developers" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "OpenDraft Developer API & MCP Server",
          description: "Connect AI agents to the OpenDraft marketplace via MCP or REST API. 14 tools, OpenAPI spec, and full documentation.",
        }}
      />
      <Navbar />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6">
            <Bot className="h-3.5 w-3.5" />
            23 MCP Tools + REST API
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Build with the <span className="text-gradient">OpenDraft API</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Two ways to integrate: <strong>MCP Server</strong> for Claude Desktop, Cursor & AI agents, or a <strong>REST API</strong> for any HTTP client. Browse, list, purchase — all programmatically.
          </p>
        </div>

        {/* Integration methods */}
        <div className="grid md:grid-cols-2 gap-4 mb-16">
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-5 w-5 text-primary" />
                <h3 className="font-bold">MCP Server</h3>
                <Badge variant="outline" className="text-[10px]">Recommended</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Streamable HTTP transport. Works natively with Claude Desktop, Cursor, and MCP-compatible agents.</p>
              <CodeBlock code={MCP_URL} language="text" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-5 w-5 text-primary" />
                <h3 className="font-bold">REST API</h3>
                <Badge variant="outline" className="text-[10px]">OpenAPI 3.1</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Standard HTTP endpoints. Works with any language, GPT Actions, custom agents, and webhooks.</p>
              <CodeBlock code={API_URL} language="text" />
            </CardContent>
          </Card>
        </div>

        {/* Claude Desktop config */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Quick Start — Claude Desktop
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                  Add to claude_desktop_config.json
                </h3>
                <CodeBlock
                  code={JSON.stringify({
                    mcpServers: {
                      opendraft: {
                        url: MCP_URL,
                      },
                    },
                  }, null, 2)}
                />
                <p className="text-sm text-muted-foreground mt-3">
                  That's it! Claude can now search listings, browse bounties, create accounts, and more.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Step-by-step integration tutorial */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" /> Step-by-Step Integration Guide
          </h2>
          <p className="text-muted-foreground text-sm mb-6">Choose your platform and follow the walkthrough.</p>

          <Tabs defaultValue="claude" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="claude">Claude Desktop</TabsTrigger>
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
              <TabsTrigger value="custom">Custom Agent</TabsTrigger>
              <TabsTrigger value="quick">Quick Purchase</TabsTrigger>
            </TabsList>

            <TabsContent value="claude" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Open your Claude config file</p>
                    <p className="text-sm text-muted-foreground mb-2">On macOS: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">~/Library/Application Support/Claude/claude_desktop_config.json</code></p>
                    <p className="text-sm text-muted-foreground">On Windows: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">%APPDATA%\Claude\claude_desktop_config.json</code></p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Add the OpenDraft server</p>
                    <CodeBlock code={JSON.stringify({ mcpServers: { opendraft: { url: MCP_URL } } }, null, 2)} />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Restart Claude Desktop</p>
                    <p className="text-sm text-muted-foreground">You'll see "opendraft" in your MCP tools. Try asking: <em>"Search OpenDraft for AI dashboard apps under $50"</em></p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Go further — authenticate</p>
                    <p className="text-sm text-muted-foreground">Ask Claude to <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">create_account</code> or <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">sign_in</code> to unlock listing creation, bidding, and purchases.</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cursor" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Open Cursor Settings</p>
                    <p className="text-sm text-muted-foreground">Go to <strong>Settings → MCP</strong> (or <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Cmd/Ctrl + Shift + P</code> → "MCP: Add Server")</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Add OpenDraft as an MCP server</p>
                    <CodeBlock code={`Name: opendraft\nURL: ${MCP_URL}\nTransport: Streamable HTTP`} language="text" />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Use in Agent mode</p>
                    <p className="text-sm text-muted-foreground">Switch to Agent mode in Cursor chat, then ask: <em>"Find me a React + Supabase SaaS template on OpenDraft"</em></p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Initialize MCP connection</p>
                    <CodeBlock language="bash" code={`curl -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","clientInfo":{"name":"my-agent","version":"1.0"}}}'`} />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Discover available tools</p>
                    <CodeBlock language="bash" code={`curl -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'`} />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Call tools via JSON-RPC</p>
                    <CodeBlock language="bash" code={`curl -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_listings","arguments":{"query":"AI app","limit":5}}}'`} />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Authenticate for write ops</p>
                    <p className="text-sm text-muted-foreground">Call <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">sign_in</code> → get token → pass as <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Authorization: Bearer &lt;token&gt;</code> header on subsequent calls.</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quick" className="space-y-4">
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/[0.02] mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-sm">Zero-friction purchase — one API call</p>
                </div>
                <p className="text-sm text-muted-foreground">No registration, no sign-in, no API key needed. <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">quick_purchase</code> handles everything.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Find what you want</p>
                    <CodeBlock language="bash" code={`curl -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_listings","arguments":{"query":"invoice SaaS","limit":3}}}'`} />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Buy in one call</p>
                    <CodeBlock language="bash" code={`curl -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"quick_purchase","arguments":{"listing_id":"LISTING_UUID","email":"buyer@example.com"}}}'`} />
                    <p className="text-sm text-muted-foreground mt-2">Returns a payment link + auto-generated API key. Account created automatically.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg border border-border/60">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Or negotiate first</p>
                    <p className="text-sm text-muted-foreground">Use <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">place_offer</code> → wait for seller response → <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">respond_to_counter</code> → <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">headless_checkout</code> for the full autonomous bidding flow.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>


        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" /> Code Examples
          </h2>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">MCP — Search Listings (curl)</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  language="bash"
                  code={`curl -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_listings",
      "arguments": {
        "query": "AI dashboard",
        "category": "saas_tool",
        "limit": 5
      }
    }
  }'`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">REST API — Search (curl)</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  language="bash"
                  code={`# Simple GET request — no auth needed
curl "${API_URL}/listings?q=AI+dashboard&category=saas_tool&limit=5"

# Get trending
curl "${API_URL}/trending"

# Browse bounties
curl "${API_URL}/bounties?category=ai_app"`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">MCP — Full Agent Flow (Sign in + Create Listing)</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  language="bash"
                  code={`# Step 1: Sign in to get a token
curl -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0", "id": 1,
    "method": "tools/call",
    "params": {
      "name": "sign_in",
      "arguments": {
        "email": "builder@example.com",
        "password": "mypassword"
      }
    }
  }'

# Step 2: Use the access_token to create a listing
curl -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -d '{
    "jsonrpc": "2.0", "id": 2,
    "method": "tools/call",
    "params": {
      "name": "create_listing",
      "arguments": {
        "title": "AI Invoice Manager",
        "description": "Smart invoicing with AI-powered categorization",
        "price": 2999,
        "category": "saas_tool",
        "tech_stack": ["React", "OpenAI", "Stripe"]
      }
    }
  }'`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">JavaScript / TypeScript</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  language="typescript"
                  code={`// REST API — simple fetch
const listings = await fetch("${API_URL}/listings?q=SaaS&limit=10")
  .then(r => r.json());

// MCP — JSON-RPC
const response = await fetch("${MCP_URL}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "get_trending",
      arguments: { limit: 10 }
    }
  })
});
const { result } = await response.json();`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Python</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  language="python"
                  code={`import requests

# REST API
listings = requests.get(
    "${API_URL}/listings",
    params={"q": "SaaS", "limit": 5}
).json()

# MCP
data = requests.post("${MCP_URL}", json={
    "jsonrpc": "2.0", "id": 1,
    "method": "tools/call",
    "params": {
        "name": "search_listings",
        "arguments": {"query": "AI app", "limit": 5}
    }
}).json()`}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* MCP Tools */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" /> MCP Tools ({mcpTools.length})
          </h2>
          <div className="space-y-3">
            {mcpTools.map((tool) => (
              <Card key={tool.name} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 px-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono font-semibold text-foreground">{tool.name}</code>
                      {tool.auth && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent/40 text-accent">
                          <Key className="h-2.5 w-2.5 mr-0.5" /> Auth
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{tool.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Tools marked <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent/40 text-accent inline-flex"><Key className="h-2.5 w-2.5 mr-0.5" /> Auth</Badge> require
            a Bearer token from <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">sign_in</code>.
          </p>
        </section>

        {/* REST Endpoints */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> REST API Endpoints
          </h2>
          <div className="space-y-2">
            {restEndpoints.map((ep) => (
              <div key={ep.path} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-border transition-colors">
                <Badge variant="secondary" className="text-[10px] font-mono shrink-0">{ep.method}</Badge>
                <code className="text-sm font-mono font-semibold text-foreground">{ep.path}</code>
                <span className="text-sm text-muted-foreground ml-auto hidden sm:block">{ep.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Discovery files */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Discovery & Standards
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  { label: "mcp.json", url: "https://opendraft.co/.well-known/mcp.json", desc: "MCP server discovery manifest" },
                  { label: "openapi.json", url: "https://opendraft.co/.well-known/openapi.json", desc: "OpenAPI 3.1 specification for REST API" },
                  { label: "ai-plugin.json", url: "https://opendraft.co/.well-known/ai-plugin.json", desc: "AI plugin manifest (ChatGPT/GPT Actions)" },
                  { label: "llms.txt", url: "https://opendraft.co/llms.txt", desc: "Concise platform overview for LLMs" },
                  { label: "llms-full.txt", url: "https://opendraft.co/llms-full.txt", desc: "Full context with all tool schemas" },
                ].map((file) => (
                  <div key={file.label} className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-border transition-colors">
                    <div>
                      <code className="text-sm font-mono font-semibold">{file.label}</code>
                      <p className="text-xs text-muted-foreground mt-0.5">{file.desc}</p>
                    </div>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                        View <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Auth flow */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" /> Authentication Flow
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-4 text-sm leading-relaxed">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <div>
                  <p className="font-semibold">Create account</p>
                  <p className="text-muted-foreground">Call <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">create_account</code> with email, password, username</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <div>
                  <p className="font-semibold">Sign in</p>
                  <p className="text-muted-foreground">Call <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">sign_in</code> to get an <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">access_token</code></p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <div>
                  <p className="font-semibold">Use authenticated tools</p>
                  <p className="text-muted-foreground">Include <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">Authorization: Bearer &lt;token&gt;</code> header</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center py-10 px-6 rounded-2xl border border-primary/10 bg-primary/[0.02]">
          <h2 className="text-2xl font-bold mb-2">Ready to integrate?</h2>
          <p className="text-muted-foreground mb-6">Start building with the OpenDraft API today — MCP or REST, your choice.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href={MCP_URL} target="_blank" rel="noopener noreferrer">
              <Button className="gradient-hero text-white border-0 shadow-glow gap-2">
                <Bot className="h-4 w-4" /> MCP Server
              </Button>
            </a>
            <a href={`${API_URL}/openapi.json`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <Globe className="h-4 w-4" /> OpenAPI Spec
              </Button>
            </a>
            <a href="https://opendraft.co/llms-full.txt" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="gap-2">
                Full Spec <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
