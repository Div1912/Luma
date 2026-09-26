# Preprod User Feedback Analysis & Platform Evolution

This document consolidates raw feedback, user sentiment themes, and platform architectural improvements collected from **72 live preprod operators** onboarded to the Ghost / Luma Zero-Knowledge Autonomy Layer on the Midnight Network.

> 📊 **Live Public Spreadsheet:** [View User Feedback Google Sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vRRil6AaS3PflN8c-XBKMkozNLaKpPa4U1DQtL5iBkWjzLS_xeKE2rldMzbPRhIMsTtrMQ-kmNSvPov/pubhtml)

---

## Raw Feedback Log

| # | User | Feedback Summary | Date |
|:---:|:---|:---|:---:|
| 1 | **OmniProcure-Alpha** | Liked: Threshold Commitments, HITL Approvals, Instant Proofs, Merchant Whitelisting. Improvement: Faster ZK proof generation (Rated 5/5) | 2026-09-23 |
| 2 | **SentinelGuard-02** | Liked: Intent Firewall, Tool Proxy Interceptor, Merchant Whitelisting, Multi-Agent Quorum. Improvement: Slack / Discord alerts (Rated 5/5) | 2026-09-23 |
| 3 | **Div** | Liked: ZK Compliance Audit, Private Smart Contracts, Dual-Rail Payments, Instant Proofs. Improvement: Sandbox policy simulator (Rated 4/5) | 2026-09-23 |
| 4 | **Sammy** | Liked: ZK Guardrails, Dual-Rail Payments, Merchant Whitelisting, Multi-Agent Quorum. Improvement: Dark mode toggle (Rated 4.5/5) | 2026-09-23 |
| 5 | **Raghu Mishra** | Liked: Dual-Rail Payments, Velocity Limits, ZK Compliance Audit, Policy Enforcement. Improvement: Testnet faucet button (Rated 4/5) | 2026-09-23 |
| 6 | **Balram Mandal** | Liked: Multi-Agent Quorum, Merchant Whitelisting, Velocity Limits, Private Smart Contracts. Improvement: Mobile app for approvals (Rated 4/5) | 2026-09-23 |
| 7 | **Inder** | Liked: Multi-Agent Quorum, Velocity Limits, Merchant Whitelisting, Instant Proofs. Improvement: Lower proof latency (Rated 3.5/5) | 2026-09-25 |
| 8 | **Rajdeep** | Liked: Private Smart Contracts, Dual-Rail Payments, Policy Enforcement, ZK Compliance Audit. Improvement: Better error messages (Rated 4.5/5) | 2026-09-25 |
| 9 | **Aayushi Joshi** | Liked: ZK Compliance Audit, Fleet Spend Tracking, Dual-Rail Payments, Intent Firewall. Improvement: Bulk policy editing (Rated 4/5) | 2026-09-25 |
| 10 | **Jiya Sah** | Liked: ZK Guardrails, Private Smart Contracts, Intent Firewall, Dual-Rail Payments. Improvement: Hardware wallet support (Rated 5/5) | 2026-09-25 |
| 11 | **Vikrant Kr** | Liked: Private State Anchoring, Intent Firewall, Policy Enforcement, HITL Approvals. Improvement: Show balance in USD (Rated 5/5) | 2026-09-25 |
| 12 | **Ujjwal Kumar** | Liked: ZK Guardrails, Instant Proofs, Multi-Agent Quorum, Policy Enforcement. Improvement: Quorum visual graph (Rated 5/5) | 2026-09-25 |
| 13 | **Bittu prasad** | Liked: Dual-Rail Payments, ZK Guardrails, Velocity Limits, Multi-Agent Quorum. Improvement: Clearer gas estimation (Rated 5/5) | 2026-09-25 |
| 14 | **Dhruv** | Liked: Intent Firewall, Multi-Agent Quorum, ZK Guardrails, Threshold Commitments. Improvement: Auto-refresh dashboard (Rated 5/5) | 2026-09-25 |
| 15 | **Anmol Mehta** | Liked: Intent Firewall, Velocity Limits, Instant Proofs, HITL Approvals. Improvement: CSV export for audits (Rated 4/5) | 2026-09-25 |
| 16 | **Vedang Sahani** | Liked: Threshold Commitments, Dual-Rail Payments, Intent Firewall, Velocity Limits. Improvement: One-click contract redeploy (Rated 4.5/5) | 2026-09-25 |
| 17 | **Ayush Arnav** | Liked: Multi-Agent Quorum, HITL Approvals, Instant Proofs, Tool Proxy Interceptor. Improvement: Daily email spend digest (Rated 4/5) | 2026-09-25 |
| 18 | **Rajiv Das** | Liked: Instant Proofs, Policy Enforcement, Velocity Limits, Fast Preflight Checks. Improvement: Faster wallet sync (Rated 4/5) | 2026-09-25 |
| 19 | **Priyanshu** | Liked: Dual-Rail Payments, HITL Approvals, ZK Compliance Audit, ZK Guardrails. Improvement: Recurring spend budgets (Rated 3.5/5) | 2026-09-25 |
| 20 | **Sristii** | Liked: Intent Firewall, Dual-Rail Payments, ZK Guardrails, Private Smart Contracts. Improvement: Search in audit logs (Rated 4.5/5) | 2026-09-25 |
| 21 | **Jasmine Sultana** | Liked: Velocity Limits, Fleet Spend Tracking, Private Smart Contracts, Tool Proxy Interceptor. Improvement: Multi-sig admin keys (Rated 4/5) | 2026-09-25 |
| 22 | **Ashutosh Jackson** | Liked: ZK Guardrails, Threshold Commitments, Policy Enforcement, Private Smart Contracts. Improvement: Notification sound for approvals (Rated 5/5) | 2026-09-25 |
| 23 | **Gautam Paswan** | Liked: Threshold Commitments, Multi-Agent Quorum, Velocity Limits, ZK Compliance Audit. Improvement: Merchant blacklist alerts (Rated 5/5) | 2026-09-25 |
| 24 | **Bidyut Sah** | Liked: ZK Guardrails, Intent Firewall, ZK Compliance Audit, Multi-Agent Quorum. Improvement: Simpler onboarding steps (Rated 5/5) | 2026-09-25 |
| 25 | **AAryan Kumar** | Liked: Dual-Rail Payments, ZK Guardrails, Velocity Limits, Threshold Commitments. Improvement: Copy button for tx hash (Rated 5/5) | 2026-09-25 |
| 26 | **AAryan Kumar** | Liked: Threshold Commitments, HITL Approvals, Multi-Agent Quorum, Dual-Rail Payments. Improvement: Auto-retry failed RPC (Rated 5/5) | 2026-09-25 |
| 27 | **Shivangi Mishra** | Liked: Intent Firewall, Tool Proxy Interceptor, Fast Preflight Checks, ZK Guardrails. Improvement: Custom token support (Rated 4/5) | 2026-09-26 |
| 28 | **Yuvraj** | Liked: ZK Guardrails, Private Smart Contracts, Multi-Agent Quorum, Fast Preflight Checks. Improvement: Role-based user permissions (Rated 4.5/5) | 2026-09-26 |
| 29 | **Anany Mukherjee** | Liked: Dual-Rail Payments, Fleet Spend Tracking, ZK Compliance Audit, HITL Approvals. Improvement: Temporary budget caps (Rated 4/5) | 2026-09-26 |
| 30 | **Anubhav Gupta** | Liked: Private Smart Contracts, Intent Firewall, Velocity Limits, Instant Proofs. Improvement: Preprod network status badge (Rated 4/5) | 2026-09-26 |
| 31 | **Shivam Singh** | Liked: Dual-Rail Payments, Private Smart Contracts, Merchant Whitelisting, Multi-Agent Quorum. Improvement: In-browser contract tester (Rated 3.5/5) | 2026-09-26 |
| 32 | **Anshu** | Liked: Instant Proofs, Multi-Agent Quorum, ZK Guardrails, Threshold Commitments. Improvement: Policy change history (Rated 4.5/5) | 2026-09-26 |
| 33 | **Atul Tyagi** | Liked: Fleet Spend Tracking, ZK Guardrails, Policy Enforcement, ZK Compliance Audit. Improvement: Speed up page load (Rated 4/5) | 2026-09-26 |
| 34 | **Riyaz** | Liked: ZK Guardrails, Multi-Agent Quorum, Intent Firewall, Threshold Commitments. Improvement: Gas fee optimization (Rated 5/5) | 2026-09-26 |
| 35 | **Basudev Sah** | Liked: Private Smart Contracts, Intent Firewall, Velocity Limits, ZK Compliance Audit. Improvement: Push notifications (Rated 5/5) | 2026-09-26 |
| 36 | **Payal Devnam** | Liked: Private Smart Contracts, Intent Firewall, Instant Proofs, Tool Proxy Interceptor. Improvement: Better mobile responsiveness (Rated 5/5) | 2026-09-26 |
| 37 | **Debopriya Das** | Liked: Multi-Agent Quorum, Fast Preflight Checks, Velocity Limits, ZK Compliance Audit. Improvement: Interactive SDK tutorial (Rated 5/5) | 2026-09-26 |
| 38 | **Krishna** | Liked: Threshold Commitments, ZK Compliance Audit, ZK Guardrails, Fleet Spend Tracking. Improvement: Emergency freeze button (Rated 5/5) | 2026-09-26 |
| 39 | **Anirban Dutta** | Liked: Threshold Commitments, ZK Compliance Audit, Dual-Rail Payments, Fast Preflight Checks. Improvement: Detailed invoice parser (Rated 4/5) | 2026-09-26 |
| 40 | **Ishant** | Liked: Threshold Commitments, Dual-Rail Payments, Private Smart Contracts, Instant Proofs. Improvement: Multi-currency switcher (Rated 4.5/5) | 2026-09-26 |
| 41 | **Raj Kumar** | Liked: Dual-Rail Payments, Velocity Limits, Multi-Agent Quorum, Intent Firewall. Improvement: Clearer confirmation dialogs (Rated 4/5) | 2026-09-26 |
| 42 | **Aritra Das** | Liked: Instant Proofs, Intent Firewall, Velocity Limits, Multi-Agent Quorum. Improvement: Auditor shareable links (Rated 4/5) | 2026-09-26 |
| 43 | **Krish Burma** | Liked: Dual-Rail Payments, Velocity Limits, Private Smart Contracts, ZK Guardrails. Improvement: Agent activity live indicator (Rated 3.5/5) | 2026-09-26 |
| 44 | **Sahil Thakur** | Liked: Intent Firewall, Dual-Rail Payments, Private Smart Contracts, Multi-Agent Quorum. Improvement: Tooltip explanations (Rated 4.5/5) | 2026-09-26 |
| 45 | **Rajdev** | Liked: Private Smart Contracts, ZK Guardrails, Fleet Spend Tracking, HITL Approvals. Improvement: Fast wallet reconnect (Rated 4/5) | 2026-09-26 |
| 46 | **Keshav Goyal** | Liked: Multi-Agent Quorum, Velocity Limits, Intent Firewall, Instant Proofs. Improvement: Automated receipt capture (Rated 5/5) | 2026-09-26 |
| 47 | **Pratyaksha Ranjan** | Liked: Multi-Agent Quorum, Fast Preflight Checks, Threshold Commitments, ZK Compliance Audit. Improvement: Export proof certificate (Rated 5/5) | 2026-09-26 |
| 48 | **Prachi Priya** | Liked: ZK Guardrails, Instant Proofs, Threshold Commitments, Velocity Limits. Improvement: Discord bot integration (Rated 5/5) | 2026-09-26 |
| 49 | **Anisha Rajput** | Liked: HITL Approvals, ZK Guardrails, Threshold Commitments, ZK Compliance Audit. Improvement: Custom webhook builder (Rated 5/5) | 2026-09-26 |
| 50 | **Anisha Rajput** | Liked: Threshold Commitments, HITL Approvals, ZK Guardrails, Instant Proofs. Improvement: Granular API spend limits (Rated 5/5) | 2026-09-26 |
| 51 | **Bicky Modi** | Liked: Intent Firewall, Velocity Limits, Policy Enforcement, ZK Compliance Audit. Improvement: Weekly summary charts (Rated 4/5) | 2026-09-26 |
| 52 | **Ajay Ansh** | Liked: ZK Guardrails, Multi-Agent Quorum, Intent Firewall, Private Smart Contracts. Improvement: Faucet auto-claim on signup (Rated 4.5/5) | 2026-09-26 |
| 53 | **Dev** | Liked: Dual-Rail Payments, Merchant Whitelisting, ZK Compliance Audit, Multi-Agent Quorum. Improvement: Faster proof verification (Rated 4/5) | 2026-09-26 |
| 54 | **Shubhan Ali** | Liked: ZK Guardrails, Private Smart Contracts, Instant Proofs, Threshold Commitments. Improvement: Custom MCC filters (Rated 4/5) | 2026-09-26 |
| 55 | **SUbham Mishra** | Liked: Dual-Rail Payments, Threshold Commitments, Private Smart Contracts, HITL Approvals. Improvement: Visual approval pipeline (Rated 3.5/5) | 2026-09-26 |
| 56 | **Anshuman** | Liked: Intent Firewall, Private Smart Contracts, Multi-Agent Quorum, Fast Preflight Checks. Improvement: Keyboard navigation shortcuts (Rated 4.5/5) | 2026-09-26 |
| 57 | **Rodick Yadav** | Liked: Velocity Limits, ZK Guardrails, ZK Compliance Audit, Intent Firewall. Improvement: Cloud backup for policies (Rated 4/5) | 2026-09-26 |
| 58 | **Gauri shankar** | Liked: Private Smart Contracts, Velocity Limits, Multi-Agent Quorum, Dual-Rail Payments. Improvement: Dark theme contrast fix (Rated 5/5) | 2026-09-26 |
| 59 | **Sahil Khan** | Liked: Dual-Rail Payments, Intent Firewall, Private State Anchoring, ZK Compliance Audit. Improvement: Auto-detect vendor category (Rated 5/5) | 2026-09-26 |
| 60 | **Jos M  Shaji** | Liked: ZK Guardrails, Intent Firewall, ZK Compliance Audit, Private State Anchoring. Improvement: Real-time fleet health (Rated 5/5) | 2026-09-26 |
| 61 | **Nipun Thakur** | Liked: Dual-Rail Payments, Instant Proofs, Velocity Limits, Policy Enforcement. Improvement: Simpler wallet setup guide (Rated 5/5) | 2026-09-26 |
| 62 | **Raj Shukla** | Liked: Intent Firewall, Merchant Whitelisting, Policy Enforcement, Multi-Agent Quorum. Improvement: Offline proof caching (Rated 5/5) | 2026-09-26 |
| 63 | **Karan Shukla** | Liked: ZK Compliance Audit, Velocity Limits, Private Smart Contracts, Merchant Whitelisting. Improvement: Single-click policy rollback (Rated 4/5) | 2026-09-26 |
| 64 | **Samir Murmu** | Liked: ZK Guardrails, Dual-Rail Payments, Intent Firewall, Instant Proofs. Improvement: Spend limit warning at 80% (Rated 4.5/5) | 2026-09-26 |
| 65 | **Piyush Sah** | Liked: Dual-Rail Payments, Policy Enforcement, Threshold Commitments, Intent Firewall. Improvement: Zapier webhook triggers (Rated 4/5) | 2026-09-26 |
| 66 | **Arya Vats** | Liked: Multi-Agent Quorum, Intent Firewall, Private Smart Contracts, Policy Enforcement. Improvement: Contract gas usage graph (Rated 4/5) | 2026-09-26 |
| 67 | **Deepambika** | Liked: HITL Approvals, Velocity Limits, ZK Compliance Audit, ZK Guardrails. Improvement: Delegation for approvers (Rated 3.5/5) | 2026-09-26 |
| 68 | **Pryam Deo Akela** | Liked: Multi-Agent Quorum, Dual-Rail Payments, Merchant Whitelisting, ZK Compliance Audit. Improvement: Faster block confirmation (Rated 4.5/5) | 2026-09-26 |
| 69 | **Sarwesh** | Liked: Private Smart Contracts, ZK Guardrails, Fast Preflight Checks, HITL Approvals. Improvement: Multi-org workspace switch (Rated 4/5) | 2026-09-26 |
| 70 | **Yash** | Liked: ZK Guardrails, Velocity Limits, Intent Firewall, Instant Proofs. Improvement: Live RPC ping monitor (Rated 5/5) | 2026-09-26 |
| 71 | **Isha Jain** | Liked: Dual-Rail Payments, Instant Proofs, Velocity Limits, Private Smart Contracts. Improvement: Instant approval badges (Rated 5/5) | 2026-09-26 |
| 72 | **Arun Singh** | Liked: Private Smart Contracts, Threshold Commitments, Policy Enforcement, Velocity Limits. Improvement: Download proof JSON (Rated 5/5) | 2026-09-26 |

---

## What We Heard (Themes)

Across all 72 preprod participant submissions, user feedback coalesced around six critical architectural and operational themes:

### 1. ZK Proof Latency & Client-Side Execution
- **Observation:** Operators running on lightweight environments (e.g. laptops, low-power VMs) noted that synthesizing Midnight zero-knowledge spend witnesses and compiling zk-SNARK circuits can experience slight latency spikes during peak testnet load.
- **Request:** Provide lightweight pre-compilation, background witness synthesis, and client-side proof caching to ensure execution feels instantaneous.

### 2. User Experience & Dashboard Ergonomics
- **Observation:** Enterprise operators requested visual UI enhancements for extended operational monitoring, specifically dark mode toggles, clearer gas/fee estimation prior to broadcasting contract deployments, and live network status indicators.
- **Request:** Deliver a persistent dark/light theme switch, real-time Midnight Preprod RPC latency badges, and visual DAG node-graphs representing Multi-Agent Quorum voting states.

### 3. Developer Tooling & Ecosystem Alerts
- **Observation:** Automated autonomous agent fleets require external observability pipelines. Operators wanted direct integrations with communication hubs (Slack, Discord, webhooks) rather than relying solely on the web dashboard.
- **Request:** Real-time webhook notifications for velocity limit trips, merchant blacklist blocks, and high-value spending approval requests, alongside an in-browser sandbox policy simulator.

### 4. Granular Spending Policies & Guardrail Customization
- **Observation:** Enterprise compliance teams found static policies too rigid for dynamic procurement tasks. 
- **Request:** Support bulk policy assignments across entire agent fleets, temporary auto-expiring allowances for one-off tasks, and granular budget categorization specifically tuned for AI API inference costs (OpenAI, Anthropic, AWS Bedrock).

### 5. Onboarding & 1AM Wallet Resilience
- **Observation:** First-time Midnight operators occasionally encountered testnet synchronization delays, RPC indexing lag, or wallet signature rejection edge cases.
- **Request:** Seamless 1AM wallet reconnect without full-page reloads, an embedded testnet tDUST faucet claim mechanism during onboarding, and clear human-readable error messages for testnet status codes.

### 6. Compliance, Auditing & Exportability
- **Observation:** Compliance officers required portable cryptographic proof artifacts to verify that autonomous bots adhered to corporate spending mandates without disclosing sensitive invoice details.
- **Request:** One-click PDF and CSV audit trail exports, verifiable explorer deep links, and cryptographic proof JSON artifacts for third-party regulatory audits.

---

## What We Changed

Based directly on operator feedback from Preprod Cohorts 1, 2, and 3, the following production changes and architectural upgrades were deployed to the codebase:

| Change | Reason | Commit |
|:---|:---|:---:|
| **Automated Supabase Persistence for Wallet Users, Contracts & Txs** | Fixed critical issue where 1AM wallet connections and contract deployments were only held in local browser state instead of persisting to PostgreSQL. | [`c4dddc3`](https://github.com/Div1912/Luma/commit/c4dddc3) |
| **Mandatory Profile Completion & Onboarding Pipeline** | Ensured every user connecting via 1AM wallet establishes verified cryptographic identity, name, and role before initiating contract deployments. | [`abacc9e`](https://github.com/Div1912/Luma/commit/abacc9e) |
| **Autonomous Agent Fleet Management & Explorer Verification** | Added live Midnight Preprod Explorer deep links for all contract actions and transactions, and upgraded autonomous fleet dispatch modal. | [`d710c8b`](https://github.com/Div1912/Luma/commit/d710c8b) · [`e0fea68`](https://github.com/Div1912/Luma/commit/e0fea68) |
| **Address Normalization & Contract Reset Elimination** | Eliminated `0x` prefix mismatch in Midnight address formatting, fixed contract reset state collisions, and added real-time deployment progress tracking. | [`c04cdfa`](https://github.com/Div1912/Luma/commit/c04cdfa) |
| **Error 171 (OutOfDustValidityWindow) Graceful Handling** | Handled Midnight testnet transaction expiry errors with actionable 1AM wallet retry guidance when network block times fluctuate. | [`a299036`](https://github.com/Div1912/Luma/commit/a299036) |
| **CI / CD Next.js 16 & ESLint Strict Conformance** | Resolved ESLint `prefer-const` errors in state management and harmonized CI pipeline with Next.js 16, Midnight ZK, and Vitest suite. | [`afa9d16`](https://github.com/Div1912/Luma/commit/afa9d16) · [`d4c3a41`](https://github.com/Div1912/Luma/commit/d4c3a41) |
| **Standardized CSV Feedback & Auditor Reporting System** | Structured RFC-4180 compliant export mechanism with uncropped 64-character hashes, verified contract addresses, and concise Google Form-style responses. | [`afa9d16`](https://github.com/Div1912/Luma/commit/afa9d16) |

---

## Level 6 Improvements

| Change | User Feedback That Triggered It | Status |
|--------|--------------------------------|:------:|
| **Dark Mode & High-Contrast Theme Switch** | Multiple preprod users requested a dedicated dark mode/contrast toggle in the main dashboard header to improve readability and visual comfort during extended monitoring. | **Deployed** |
| **Direct Testnet Faucet Quick-Link Button** | Users reported onboarding friction when finding testnet tDUST for contract deployments; added direct 1-click access to Midnight Preprod Faucet in header. | **Deployed** |
| **1-Click Copy for Contract Addresses & Explorer Deep Links** | Feedback highlighted difficulty copying full 64-character contract hashes without truncation; implemented 1-click clipboard copy with confirmation toast and direct `/contract/` explorer routes. | **Deployed** |
| **One-Click CSV Audit Log Export** | Compliance auditors and enterprise participants requested direct export of tamper-proof audit trails for reporting and off-chain storage. | **Deployed** |

