#!/usr/bin/env python3
"""
AIRWISE AI — Production Smoke Test Suite
Executes safe non-destructive health, security, and functionality probes against any deployed target.

Usage:
    python backend/scripts/production_smoke_test.py --backend https://api.airwise.ai --frontend https://airwise.ai
    python backend/scripts/production_smoke_test.py --backend http://localhost:8000 --frontend http://localhost:3000
"""

import sys
import json
import argparse
import urllib.request
import urllib.error
from typing import Dict, Any, Tuple


class Colors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"


def probe_url(url: str, expected_statuses: Tuple[int, ...] = (200,), headers: Dict[str, str] = None) -> Tuple[bool, int, Dict[str, Any], str]:
    """Sends HTTP GET request and checks response status code and JSON payload."""
    req = urllib.request.Request(url, headers=headers or {"User-Agent": "AirwiseProductionSmokeTest/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            status_code = res.status
            content_type = res.headers.get("Content-Type", "")
            raw = res.read().decode("utf-8")
            data = json.loads(raw) if "application/json" in content_type else {}
            success = status_code in expected_statuses
            return success, status_code, data, raw
    except urllib.error.HTTPError as e:
        status_code = e.code
        raw = e.read().decode("utf-8") if e.fp else ""
        data = {}
        try:
            data = json.loads(raw)
        except Exception:
            pass
        success = status_code in expected_statuses
        return success, status_code, data, raw
    except Exception as e:
        return False, 0, {}, str(e)


def run_smoke_tests(backend_url: str, frontend_url: str = None) -> int:
    backend_url = backend_url.rstrip("/")
    if frontend_url:
        frontend_url = frontend_url.rstrip("/")

    print(f"\n{Colors.BOLD}{Colors.HEADER}====================================================================")
    print("AIRWISE AI — PRODUCTION DEPLOYMENT SMOKE TEST RUNNER")
    print(f"Backend Target : {backend_url}")
    if frontend_url:
        print(f"Frontend Target: {frontend_url}")
    print(f"===================================================================={Colors.ENDC}\n")

    results = []

    # --------------------------------------------------------------------------
    # 1. Backend Liveness Probe
    # --------------------------------------------------------------------------
    liveness_url = f"{backend_url}/api/v1/health/live"
    print(f"[*] Probing Backend Liveness: {liveness_url} ... ", end="")
    ok, code, data, _ = probe_url(liveness_url, expected_statuses=(200,))
    if ok and data.get("status") == "live":
        print(f"{Colors.OKGREEN}PASSED{Colors.ENDC} (HTTP {code}, status={data.get('status')})")
        results.append(True)
    else:
        print(f"{Colors.FAIL}FAILED{Colors.ENDC} (HTTP {code}, data={data})")
        results.append(False)

    # --------------------------------------------------------------------------
    # 2. Backend Database Readiness Probe
    # --------------------------------------------------------------------------
    readiness_url = f"{backend_url}/api/v1/health/ready"
    print(f"[*] Probing Database Readiness: {readiness_url} ... ", end="")
    ok, code, data, _ = probe_url(readiness_url, expected_statuses=(200,))
    if ok and data.get("status") == "ready":
        print(f"{Colors.OKGREEN}PASSED{Colors.ENDC} (HTTP {code}, database={data.get('database')})")
        results.append(True)
    else:
        print(f"{Colors.FAIL}FAILED{Colors.ENDC} (HTTP {code}, data={data})")
        results.append(False)

    # --------------------------------------------------------------------------
    # 3. Security Check: Unauthenticated Admin Endpoint Protection (RBAC)
    # --------------------------------------------------------------------------
    admin_probe_url = f"{backend_url}/api/v1/admin/dashboard/overview"
    print(f"[*] Probing RBAC Security (Unauthenticated Admin): {admin_probe_url} ... ", end="")
    ok, code, _, _ = probe_url(admin_probe_url, expected_statuses=(401, 403))
    if ok:
        print(f"{Colors.OKGREEN}PASSED{Colors.ENDC} (HTTP {code} correctly denied access)")
        results.append(True)
    else:
        print(f"{Colors.FAIL}FAILED{Colors.ENDC} (HTTP {code} unexpected; admin endpoint exposed!)")
        results.append(False)

    # --------------------------------------------------------------------------
    # 4. Environmental Data Endpoint Status
    # --------------------------------------------------------------------------
    sources_url = f"{backend_url}/api/v1/pollution/sources"
    print(f"[*] Probing Telemetry Data Providers: {sources_url} ... ", end="")
    ok, code, data, _ = probe_url(sources_url, expected_statuses=(200,))
    if ok and data.get("success"):
        providers = [p.get("id") for p in data.get("data", [])]
        print(f"{Colors.OKGREEN}PASSED{Colors.ENDC} (HTTP {code}, providers={providers})")
        results.append(True)
    else:
        print(f"{Colors.FAIL}FAILED{Colors.ENDC} (HTTP {code}, data={data})")
        results.append(False)

    # --------------------------------------------------------------------------
    # 5. Geocoding / Location Search Probe
    # --------------------------------------------------------------------------
    search_url = f"{backend_url}/api/v1/pollution/search?city=London"
    print(f"[*] Probing Geocoding Location Search: {search_url} ... ", end="")
    ok, code, data, _ = probe_url(search_url, expected_statuses=(200,))
    if ok and data.get("success"):
        matches = len(data.get("data", []))
        print(f"{Colors.OKGREEN}PASSED{Colors.ENDC} (HTTP {code}, found {matches} stations)")
        results.append(True)
    else:
        print(f"{Colors.FAIL}FAILED{Colors.ENDC} (HTTP {code}, data={data})")
        results.append(False)

    # --------------------------------------------------------------------------
    # 6. Optional Frontend Homepage Verification
    # --------------------------------------------------------------------------
    if frontend_url:
        print(f"[*] Probing Frontend Public Website: {frontend_url} ... ", end="")
        ok, code, _, raw = probe_url(frontend_url, expected_statuses=(200,))
        if ok and ("AIRWISE" in raw or "airwise" in raw or "<html" in raw):
            print(f"{Colors.OKGREEN}PASSED{Colors.ENDC} (HTTP {code}, HTML rendered)")
            results.append(True)
        else:
            print(f"{Colors.FAIL}FAILED{Colors.ENDC} (HTTP {code})")
            results.append(False)

    # --------------------------------------------------------------------------
    # Final Tally
    # --------------------------------------------------------------------------
    total = len(results)
    passed = sum(1 for r in results if r)
    print(f"\n{Colors.BOLD}Smoke Test Result: {passed}/{total} checks passed.{Colors.ENDC}")

    if passed == total:
        print(f"{Colors.OKGREEN}{Colors.BOLD}ALL PRODUCTION PROBES VERIFIED SUCCESSFULLY!{Colors.ENDC}\n")
        return 0
    else:
        print(f"{Colors.FAIL}{Colors.BOLD}VERIFICATION FAILED: {total - passed} probe(s) reported errors.{Colors.ENDC}\n")
        return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AIRWISE AI Production Smoke Test Runner")
    parser.add_argument("--backend", required=True, help="Backend API base URL (e.g. http://localhost:8000 or https://api.airwise.ai)")
    parser.add_argument("--frontend", required=False, default=None, help="Frontend website URL (e.g. http://localhost:3000 or https://airwise.ai)")
    args = parser.parse_args()

    sys.exit(run_smoke_tests(args.backend, args.frontend))
