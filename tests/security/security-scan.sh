#!/bin/bash
set -euo pipefail

# ── Security Scan — Carguinée ──────────────────────────────────────────────
# Run this script against a running instance to check security posture.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="${1:-http://localhost:3000}"
PASSED=0
FAILED=0
WARNINGS=0

pass() { echo -e "${GREEN}✅ PASS${NC} $1"; ((PASSED++)); }
fail() { echo -e "${RED}❌ FAIL${NC} $1"; ((FAILED++)); }
warn() { echo -e "${YELLOW}⚠️  WARN${NC} $1"; ((WARNINGS++)); }

echo "═══════════════════════════════════════════════════════════════"
echo "  Carguinée Security Scan"
echo "  Target: $BASE_URL"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── 1. HTTPS check ──
echo "── HTTPS ──"
if [[ "$BASE_URL" == https://* ]]; then
  pass "HTTPS is enabled"
else
  warn "HTTPS is NOT enabled (using HTTP)"
fi
echo ""

# ── 2. Security headers ──
echo "── Security Headers ──"
HEADERS=$(curl -s -I "$BASE_URL/api/health" 2>/dev/null || true)

check_header() {
  local name="$1"
  if echo "$HEADERS" | grep -qi "$name"; then
    pass "Header present: $name"
  else
    fail "Header missing: $name"
  fi
}

check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "X-XSS-Protection"
check_header "Referrer-Policy"
check_header "Content-Security-Policy"
check_header "Strict-Transport-Security"
echo ""

# ── 3. Auth bypass attempts ──
echo "── Auth Security ──"
# Try accessing protected route without token
NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/stats" 2>/dev/null || echo "000")
if [ "$NOAUTH" = "401" ] || [ "$NOAUTH" = "403" ]; then
  pass "Admin route properly protected (HTTP $NOAUTH)"
else
  fail "Admin route returned HTTP $NOAUTH (should be 401/403)"
fi

# Try accessing with invalid token
BADTOKEN=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer invalid-token-here" \
  "$BASE_URL/api/admin/stats" 2>/dev/null || echo "000")
if [ "$BADTOKEN" = "401" ] || [ "$BADTOKEN" = "403" ]; then
  pass "Invalid token rejected (HTTP $BADTOKEN)"
else
  fail "Invalid token accepted (HTTP $BADTOKEN)"
fi
echo ""

# ── 4. Rate limiting ──
echo "── Rate Limiting ──"
RATE_LIMITED=false
for i in $(seq 1 20); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST -H "Content-Type: application/json" \
    -d '{"phone":"+22400000000","password":"wrong"}' \
    "$BASE_URL/api/auth/login" 2>/dev/null || echo "000")
  if [ "$STATUS" = "429" ]; then
    RATE_LIMITED=true
    break
  fi
done

if [ "$RATE_LIMITED" = true ]; then
  pass "Rate limiting is active (429 after multiple attempts)"
else
  warn "Rate limiting not triggered in 20 attempts"
fi
echo ""

# ── 5. SQL Injection attempts ──
echo "── Injection Protection ──"
SQLI=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/vehicles?search='; DROP TABLE users;--" 2>/dev/null || echo "000")
if [ "$SQLI" = "200" ] || [ "$SQLI" = "400" ]; then
  pass "SQL injection attempt handled gracefully (HTTP $SQLI)"
else
  warn "SQL injection attempt returned HTTP $SQLI"
fi

# XSS in query params
XSS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/vehicles?search=<script>alert(1)</script>" 2>/dev/null || echo "000")
if [ "$XSS" = "200" ] || [ "$XSS" = "400" ]; then
  pass "XSS attempt handled gracefully (HTTP $XSS)"
else
  warn "XSS attempt returned HTTP $XSS"
fi
echo ""

# ── 6. npm audit ──
echo "── Dependency Audit ──"
if command -v npm &> /dev/null; then
  cd backend 2>/dev/null && AUDIT_OUT=$(npm audit --omit=dev 2>&1 || true) && cd ..
  if echo "$AUDIT_OUT" | grep -q "found 0 vulnerabilities"; then
    pass "No known vulnerabilities in backend dependencies"
  else
    VULN_COUNT=$(echo "$AUDIT_OUT" | grep -o "[0-9]* vulnerabilities" | head -1 || echo "unknown")
    fail "Backend has vulnerabilities: $VULN_COUNT"
  fi
else
  warn "npm not available — skipping dependency audit"
fi
echo ""

# ── 7. CSP validation ──
echo "── Content Security Policy ──"
CSP=$(echo "$HEADERS" | grep -i "content-security-policy" || true)
if [ -n "$CSP" ]; then
  if echo "$CSP" | grep -q "unsafe-inline"; then
    warn "CSP allows unsafe-inline (consider nonces)"
  else
    pass "CSP is configured without unsafe-inline"
  fi
  if echo "$CSP" | grep -q "report-uri\|report-to"; then
    pass "CSP reporting is configured"
  else
    warn "CSP reporting not configured"
  fi
else
  fail "No Content-Security-Policy header found"
fi
echo ""

# ── Summary ──
echo "═══════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}Passed: $PASSED${NC}  ${RED}Failed: $FAILED${NC}  ${YELLOW}Warnings: $WARNINGS${NC}"
TOTAL=$((PASSED + FAILED + WARNINGS))
if [ "$FAILED" -eq 0 ]; then
  echo -e "  ${GREEN}STATUS: PASS ✅${NC}"
else
  echo -e "  ${RED}STATUS: FAIL ❌${NC}"
fi
echo "═══════════════════════════════════════════════════════════════"

exit $FAILED
