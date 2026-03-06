/**
 * scan-security Edge Function
 * ----------------------------
 * Scans a listing's template ZIP for security vulnerabilities and assigns a security_score (0-100).
 * 
 * Checks performed:
 * 1. No hardcoded secrets/API keys
 * 2. No dangerouslySetInnerHTML usage
 * 3. No eval() or Function() calls
 * 4. No inline event handlers (onclick= in HTML)
 * 5. Input validation patterns present (zod, z.object, etc.)
 * 6. No http:// URLs (enforce https)
 * 7. No localStorage for sensitive data patterns
 * 8. CSP meta tag or security headers present
 * 9. SECURITY.md and security-manifest.json present
 * 10. TypeScript strict mode enabled
 * 
 * Called by: revenue-automation (on listing approval) or admin manually
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SecurityFinding {
  rule: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  file?: string;
  line?: number;
  message: string;
  deduction: number; // points deducted from 100
}

// Patterns that indicate hardcoded secrets
const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey|secret[_-]?key|private[_-]?key|access[_-]?token|auth[_-]?token)\s*[:=]\s*["'][a-zA-Z0-9_\-]{16,}/gi,
  /sk[-_](?:live|test)[_-][a-zA-Z0-9]{20,}/g,  // Stripe secret keys
  /ghp_[a-zA-Z0-9]{36}/g,                        // GitHub PATs
  /AIza[a-zA-Z0-9_\-]{35}/g,                     // Google API keys
  /-----BEGIN (?:RSA )?PRIVATE KEY-----/g,        // Private keys
];

// Dangerous code patterns
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; rule: string; message: string; severity: SecurityFinding["severity"]; deduction: number }> = [
  {
    pattern: /dangerouslySetInnerHTML/g,
    rule: "no-dangerous-html",
    message: "dangerouslySetInnerHTML detected — XSS risk. Use a sanitization library like DOMPurify.",
    severity: "critical",
    deduction: 15,
  },
  {
    pattern: /\beval\s*\(/g,
    rule: "no-eval",
    message: "eval() detected — code injection risk. Use safer alternatives.",
    severity: "critical",
    deduction: 15,
  },
  {
    pattern: /new\s+Function\s*\(/g,
    rule: "no-function-constructor",
    message: "new Function() detected — equivalent to eval(). Use safer alternatives.",
    severity: "critical",
    deduction: 10,
  },
  {
    pattern: /\bon\w+\s*=\s*["']/g,
    rule: "no-inline-handlers",
    message: "Inline event handler detected in HTML — use React event props instead.",
    severity: "medium",
    deduction: 3,
  },
  {
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/g,
    rule: "enforce-https",
    message: "Insecure HTTP URL detected. Use HTTPS.",
    severity: "medium",
    deduction: 3,
  },
  {
    pattern: /localStorage\.setItem\s*\(\s*["'](?:token|password|secret|api[_-]?key|session)/gi,
    rule: "no-sensitive-localstorage",
    message: "Sensitive data stored in localStorage — use httpOnly cookies or secure session management.",
    severity: "high",
    deduction: 10,
  },
  {
    pattern: /document\.cookie\s*=/g,
    rule: "no-direct-cookie-manipulation",
    message: "Direct cookie manipulation detected — use a secure cookie library with httpOnly and Secure flags.",
    severity: "medium",
    deduction: 5,
  },
  {
    pattern: /innerHTML\s*=/g,
    rule: "no-innerhtml",
    message: "Direct innerHTML assignment — XSS risk. Use textContent or a sanitization library.",
    severity: "high",
    deduction: 10,
  },
];

function scanFileContent(filePath: string, content: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  // Skip non-source files
  if (!/\.(tsx?|jsx?|html?|css|json|md)$/i.test(filePath)) return findings;
  // Skip node_modules and lock files
  if (filePath.includes("node_modules") || filePath.includes("lock")) return findings;

  // Check for hardcoded secrets
  for (const pattern of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      findings.push({
        rule: "no-hardcoded-secrets",
        severity: "critical",
        file: filePath,
        message: "Possible hardcoded API key or secret detected. Use environment variables.",
        deduction: 20,
      });
      break; // One finding per file for secrets
    }
  }

  // Check dangerous patterns
  for (const { pattern, rule, message, severity, deduction } of DANGEROUS_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) {
      findings.push({ rule, severity, file: filePath, message, deduction });
    }
  }

  return findings;
}

function scanProjectStructure(fileMap: Map<string, string>): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const paths = [...fileMap.keys()];

  // Check for SECURITY.md
  const hasSecurityMd = paths.some(p => /security\.md$/i.test(p));
  if (!hasSecurityMd) {
    findings.push({
      rule: "security-manifest",
      severity: "medium",
      message: "Missing SECURITY.md — include security documentation for transparency.",
      deduction: 5,
    });
  }

  // Check for security-manifest.json
  const hasManifest = paths.some(p => /security-manifest\.json$/i.test(p));
  if (!hasManifest) {
    findings.push({
      rule: "security-manifest-json",
      severity: "low",
      message: "Missing security-manifest.json — machine-readable security metadata.",
      deduction: 3,
    });
  }

  // Check for TypeScript strict mode
  const tsconfigPath = paths.find(p => /tsconfig\.json$/i.test(p));
  if (tsconfigPath) {
    const tsconfig = fileMap.get(tsconfigPath) || "";
    if (!tsconfig.includes('"strict": true') && !tsconfig.includes('"strict":true')) {
      findings.push({
        rule: "typescript-strict",
        severity: "medium",
        message: "TypeScript strict mode not enabled — enables stronger type safety.",
        deduction: 5,
      });
    }
  }

  // Check for input validation library (zod, yup, joi)
  const allContent = [...fileMap.values()].join("\n");
  const hasValidation = /import.*(?:zod|yup|joi|superstruct|valibot)/i.test(allContent) ||
    /z\.object|z\.string|Yup\.object|Joi\.object/i.test(allContent);
  if (!hasValidation) {
    findings.push({
      rule: "input-validation",
      severity: "medium",
      message: "No input validation library detected. Use Zod or similar for runtime validation.",
      deduction: 5,
    });
  }

  // Check for CSP meta tag in index.html
  const indexHtml = paths.find(p => /index\.html$/i.test(p));
  if (indexHtml) {
    const html = fileMap.get(indexHtml) || "";
    if (!html.includes("Content-Security-Policy") && !html.includes("content-security-policy")) {
      findings.push({
        rule: "csp-header",
        severity: "medium",
        message: "No Content-Security-Policy meta tag in index.html.",
        deduction: 5,
      });
    }
  }

  // Bonus: Check for secure fetch wrapper patterns
  const hasSecureFetch = /(?:secureFetch|authFetch|apiClient|createApiClient)/i.test(allContent);
  if (hasSecureFetch) {
    findings.push({
      rule: "secure-fetch-wrapper",
      severity: "info",
      message: "Secure fetch wrapper pattern detected — good practice.",
      deduction: -5, // bonus points
    });
  }

  return findings;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const listingId: string = body.listing_id;
    if (!listingId) throw new Error("listing_id required");

    // Fetch listing
    const { data: listing, error: listingErr } = await supabase
      .from("listings")
      .select("id, title, file_path, seller_id")
      .eq("id", listingId)
      .single();

    if (listingErr || !listing) throw new Error("Listing not found");
    if (!listing.file_path) throw new Error("Listing has no file to scan");

    // Download ZIP
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("listing-files")
      .download(listing.file_path);

    if (downloadErr || !fileData) throw new Error("Failed to download template ZIP");

    // Parse ZIP
    const zip = await JSZip.loadAsync(await fileData.arrayBuffer());
    const fileMap = new Map<string, string>();

    const entries = Object.entries(zip.files).filter(([_, f]) => !f.dir);
    await Promise.all(
      entries.map(async ([path, file]) => {
        try {
          const content = await file.async("string");
          fileMap.set(path, content);
        } catch {
          // Binary file, skip
        }
      })
    );

    // Run scans
    const findings: SecurityFinding[] = [];

    // File-level scans
    for (const [path, content] of fileMap) {
      findings.push(...scanFileContent(path, content));
    }

    // Project-structure scans
    findings.push(...scanProjectStructure(fileMap));

    // Calculate score
    const totalDeductions = findings
      .filter(f => f.deduction > 0)
      .reduce((sum, f) => sum + f.deduction, 0);
    const bonuses = findings
      .filter(f => f.deduction < 0)
      .reduce((sum, f) => sum + Math.abs(f.deduction), 0);

    const score = Math.max(0, Math.min(100, 100 - totalDeductions + bonuses));

    // Update listing security_score
    await supabase
      .from("listings")
      .update({ security_score: score })
      .eq("id", listingId);

    // Log the scan
    await supabase.from("activity_log").insert({
      event_type: "security_scan",
      event_data: {
        listing_id: listingId,
        title: listing.title,
        score,
        findings_count: findings.filter(f => f.severity !== "info").length,
        critical_count: findings.filter(f => f.severity === "critical").length,
        high_count: findings.filter(f => f.severity === "high").length,
      },
    });

    console.log(`Security scan: "${listing.title}" scored ${score}/100 (${findings.length} findings)`);

    return new Response(
      JSON.stringify({
        success: true,
        listing_id: listingId,
        score,
        grade: score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F",
        findings: findings.map(f => ({
          rule: f.rule,
          severity: f.severity,
          file: f.file,
          message: f.message,
        })),
        summary: {
          total: findings.length,
          critical: findings.filter(f => f.severity === "critical").length,
          high: findings.filter(f => f.severity === "high").length,
          medium: findings.filter(f => f.severity === "medium").length,
          low: findings.filter(f => f.severity === "low").length,
          info: findings.filter(f => f.severity === "info").length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("scan-security error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
