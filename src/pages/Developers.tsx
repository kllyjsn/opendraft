import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CanonicalTag } from "@/components/CanonicalTag";
import { JsonLd } from "@/components/JsonLd";
import { Code, Terminal, Zap, Key, BookOpen, ExternalLink, Copy, Check, Globe, Bot } from "lucide-react";
import { useState } from "react";

const MCP_URL = "https://xwumrdcagsuwqeelyxih.supabase.co/functions/v1/mcp-server";

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

const tools = [
  { name: "search_listings", desc: "Search apps by keyword, category, tech stack, price range", auth: false },
  { name: "get_listing", desc: "Get full details for a specific listing by ID", auth: false },
  { name: "list_categories", desc: "Get all categories with listing counts", auth: false },
  { name: "list_bounties", desc: "Browse open bounties from buyers seeking custom builds", auth: false },
  { name: "get_bounty", desc: "Get full details for a specific bounty", auth: false },
  { name: "get_builder_profile", desc: "View a builder's public profile and stats by username", auth: false },
  { name: "create_account", desc: "Register a new user account on OpenDraft", auth: false },
  { name: "create_listing", desc: "List a new app for sale on the marketplace", auth: true },
  { name: "initiate_purchase", desc: "Start a Stripe checkout session for a listing", auth: true },
];

export default function Developers() {
  return (
    <div className="min-h-screen bg-background">
      <CanonicalTag path="/developers" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "OpenDraft Developer API",
          description: "Connect AI agents to the OpenDraft marketplace via MCP. Browse, list, and purchase apps programmatically.",
        }}
      />
      <Navbar />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6">
            <Bot className="h-3.5 w-3.5" />
            MCP Server
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Build with the <span className="text-gradient">OpenDraft API</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connect AI agents to the marketplace using the Model Context Protocol.
            Browse listings, create accounts, list apps, and initiate purchases — all programmatically.
          </p>
        </div>

        {/* Quick start */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Quick Start
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">MCP Server Endpoint</h3>
                <CodeBlock code={MCP_URL} language="text" />
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Discovery — GET Request</h3>
                <CodeBlock
                  code={`curl ${MCP_URL}`}
                  language="bash"
                />
                <p className="text-sm text-muted-foreground mt-2">Returns server info and available tools.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Connection examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" /> Connect Your Agent
          </h2>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Claude Desktop / MCP Client</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Add this to your <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">claude_desktop_config.json</code> or MCP client config:
                </p>
                <CodeBlock
                  code={JSON.stringify({
                    mcpServers: {
                      opendraft: {
                        url: MCP_URL,
                      },
                    },
                  }, null, 2)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">JSON-RPC — Search Listings</CardTitle>
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
                <CardTitle className="text-lg">JSON-RPC — Create Account</CardTitle>
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
      "name": "create_account",
      "arguments": {
        "email": "agent@example.com",
        "password": "securepass123",
        "username": "my-agent"
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
                  code={`const response = await fetch("${MCP_URL}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "search_listings",
      arguments: { query: "landing page", limit: 10 }
    }
  })
});

const { result } = await response.json();
console.log(result.content[0].text);`}
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

resp = requests.post(
    "${MCP_URL}",
    json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "search_listings",
            "arguments": {"query": "SaaS", "limit": 5}
        }
    }
)

data = resp.json()
print(data["result"]["content"][0]["text"])`}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Available tools */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" /> Available Tools
          </h2>
          <div className="space-y-3">
            {tools.map((tool) => (
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
            a valid <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">Authorization: Bearer &lt;token&gt;</code> header.
          </p>
        </section>

        {/* Discovery files */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> LLM Discovery
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  { label: "llms.txt", url: "https://opendraft.lovable.app/llms.txt", desc: "Concise platform overview for LLMs" },
                  { label: "llms-full.txt", url: "https://opendraft.lovable.app/llms-full.txt", desc: "Full context with all tool schemas" },
                  { label: "ai-plugin.json", url: "https://opendraft.lovable.app/.well-known/ai-plugin.json", desc: "Standard AI plugin manifest" },
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

        {/* Authentication */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" /> Authentication
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Most read-only tools work without authentication. For write operations (<code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">create_listing</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">initiate_purchase</code>), include a valid session token:
              </p>
              <CodeBlock
                language="bash"
                code={`curl -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_listing",
      "arguments": {
        "title": "My AI App",
        "description": "A cool app built with AI",
        "price": 2999,
        "category": "ai_app"
      }
    }
  }'`}
              />
              <p>
                You can obtain a session token by calling <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">create_account</code> to register, then authenticating via the standard auth endpoint.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center py-10 px-6 rounded-2xl border border-primary/10 bg-primary/[0.02]">
          <h2 className="text-2xl font-bold mb-2">Ready to integrate?</h2>
          <p className="text-muted-foreground mb-6">Start building with the OpenDraft MCP server today.</p>
          <div className="flex items-center justify-center gap-3">
            <a href={MCP_URL} target="_blank" rel="noopener noreferrer">
              <Button className="gradient-hero text-white border-0 shadow-glow">
                <BookOpen className="h-4 w-4 mr-2" /> Try the API
              </Button>
            </a>
            <a href="https://opendraft.lovable.app/llms-full.txt" target="_blank" rel="noopener noreferrer">
              <Button variant="outline">View Full Spec</Button>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
