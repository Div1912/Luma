# Ghost Protocol (Luma) — Operator & User Guide

**Enterprise-grade cryptographic guardrails and Zero-Knowledge autonomy layer for autonomous AI spending on the Midnight Privacy Blockchain.**

---

## 1. System Architecture & Overview

Ghost wraps autonomous AI spending agents in mathematical guardrails using Zero-Knowledge (ZK) proofs. Rather than trusting off-chain centralized software toggles, Ghost enforces that funds cannot leave an enterprise treasury without a verifiable ZK proof confirming that the transaction satisfies pre-approved corporate spending policies.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Enterprise Operator UI                          │
│         Next.js 15 Dashboard • Policy Engine • Fleet Dispatcher         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Ghost Verification Layer (@ghost/guard)              │
│  ┌──────────────────────┐  ┌────────────────────┐  ┌────────────────┐  │
│  │ <5ms Preflight Check │  │   Intent Firewall  │  │ Velocity Limit │  │
│  └──────────┬───────────┘  └──────────┬─────────┘  └────────┬───────┘  │
└─────────────┼─────────────────────────┼─────────────────────┼──────────┘
              ▼                         ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Zero-Knowledge Engine                          │
│       Compact Smart Contract • Midnight Proof Server • zk-SNARKs       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       ┌────────────────────────┐      ┌─────────────────────────┐
       │   Midnight Blockchain  │      │   Stripe Dual-Rail      │
       │  (Private x402 tDUST)  │      │  (Dynamic Credit Cards) │
       └────────────────────────┘      └─────────────────────────┘
```

---

## 2. Prerequisites & Network Setup

### 2.1 1AM Wallet
1. Install the **1AM Midnight Wallet** extension in your Chrome or Brave browser.
2. Create or restore a Midnight account using your 24-word seed phrase.
3. Switch your active network in 1AM Wallet settings to **Midnight Preprod**.

### 2.2 Preprod Network Parameters
- **Network Name:** Midnight Preprod
- **Indexer GraphQL Endpoint:** `https://indexer.preprod.midnight.network/api/v4/graphql`
- **WebSocket Endpoint:** `wss://indexer.preprod.midnight.network/api/v4/graphql/ws`
- **RPC Endpoint:** `https://rpc.preprod.midnight.network`
- **Block Explorer:** `https://preprod.midnightexplorer.com`
- **Proof Server:** `https://proof-server.preprod.midnight.network`

### 2.3 Obtaining Testnet tDUST
To deploy contracts and submit on-chain ZK transactions, your 1AM wallet requires testnet **tDUST**:
1. Copy your Midnight Preprod address from 1AM Wallet (starts with `mn_addr_preprod1...`).
2. Request tDUST from the official Midnight Preprod Faucet.
3. Ensure your wallet confirms an unshielded balance before proceeding.

---

## 3. Onboarding & Contract Deployment

### Step 1: Connect 1AM Wallet
1. Open the Ghost dashboard at `http://localhost:3000/dashboard` (or deployed production domain).
2. Click **Connect Wallet** in the top navigation bar.
3. Approve the connection request in the 1AM Wallet extension popup.

### Step 2: Operator Profile Setup
First-time operators are automatically prompted to complete their profile:
- **Full Name:** Operator or Organization display name
- **Role:** Administrator, Security Lead, or Procurement Officer
- **Organization:** Enterprise entity name

Submitting the profile establishes your cryptographic identity and synchronizes your record to Supabase PostgreSQL.

### Step 3: Genesis Contract Deployment
1. On the dashboard overview page, click **Deploy Ghost Contract**.
2. The platform synthesizes the initial private state and launches the deployment transaction through your 1AM wallet.
3. Sign the deployment transaction when prompted by 1AM Wallet.
4. Your unique 64-character contract address (e.g. `d72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad`) is permanently bound to your operator profile and verified on the Midnight consensus layer.

---

## 4. Core Operational Pillars

### 4.1 Zero-Knowledge Spending Guardrails (`@ghost/guard`)
Wraps any AI tool execution in a non-bypassable proxy. Before money leaves the treasury:
1. **Preflight Check (<5ms):** In-memory check verifying daily quota, single-transaction limit, and merchant allowlists.
2. **ZK Witness Synthesis:** Assembles private witnesses and calls the Midnight prover.
3. **Consensus Blocking:** If limits are exceeded, consensus blocks the transaction without disclosing corporate financials.

```typescript
import { withGhostGuard } from '@ghost/guard';

const safeSpend = withGhostGuard(rawSpendFunction, {
  agentId: 'procurement-bot-01',
  policyId: 'CLOUD_INFRA_POLICY',
  localPolicy: {
    perTransactionLimit: 500,  // Max 500 tDUST
    dailyTotalLimit: 2000,     // Max 2,000 tDUST
    allowedCategories: ['CLOUD_COMPUTE', 'SAAS'],
  },
  extractContext: (args) => ({
    amount: args.amount,
    merchant: args.merchant,
    category: args.category,
  }),
});
```

### 4.2 Dual-Rail Settlement Router (`@ghost/dual-rail`)
Autonomous AI agents can pay both Web3 and traditional vendors dynamically:
- **Midnight x402 ZK Crypto:** Used for decentralized cloud compute, decentralized storage, and Web3 agent-to-agent micropayments.
- **Stripe Dynamic Cards:** Generates single-use, merchant-locked virtual credit cards for traditional SaaS APIs (e.g. OpenAI, AWS, Google Cloud).

### 4.3 Cryptographic Intent Firewall (`@ghost/intent`)
Defends against prompt injection (e.g. malicious invoices commanding agents to transfer treasury funds):
- Humans sign cryptographic intent tokens defining task scopes.
- If agent action parameters diverge from the intent token hash, the Intent Firewall trips and blocks execution immediately.

### 4.4 Adaptive Velocity Dampening (`@ghost/velocity`)
Protects against infinite agent hallucination loops:
- Token-bucket rate limiter restricts transaction frequencies.
- Exponentially Weighted Moving Average (EWMA) anomaly detectors trip an emergency circuit breaker if an agent attempts burst spending.

### 4.5 Multi-Agent Quorum Consensus (`@ghost/quorum`)
Ensures enterprise compliance (SOX / SOC 2):
- Orders above threshold (e.g. >10,000 tDUST) require M-of-N ZK consensus approvals (e.g., Procurement Bot + Security Bot + Human Admin).

### 4.6 Human-in-the-Loop (HITL) Approvals
When an agent encounters a transaction exceeding standard automated limits:
1. The transaction enters the **Pending Approvals** queue (`/dashboard/approvals`).
2. An authorized human administrator inspects the merchant, amount, and intent justification.
3. One-click signing in 1AM Wallet either authorizes or vetoes the execution.

---

## 5. Verification & Audit Trail

### 5.1 Real-Time Audit Log & CSV Export
Navigate to `/dashboard/audit` to view the tamper-proof cryptographic audit log:
- **Proof Hash:** Cryptographic commitment verifying policy adherence.
- **Transaction Hash:** Direct 64-character Midnight transaction ID.
- **Contract Address:** Target contract anchoring private state.
- **1-Click CSV Export:** Click **Export CSV** in the top-right corner to download a complete, timestamped RFC-4180 audit trail for enterprise accounting and compliance.

### 5.2 Header Ergonomics & Quick-Actions
- **Dark / High-Contrast Mode Toggle:** Click the Moon/Sun icon in the top navigation bar to toggle between the deep OLED midnight palette and high-contrast accessibility mode.
- **tDUST Faucet Quick-Link:** Click the green **tDUST Faucet** button in the header for 1-click access to the official Midnight Preprod Faucet to fund testnet transactions.
- **1-Click Contract Copy:** On the Overview dashboard (`/dashboard`), click the copy icon beside the verified contract address to copy the full 64-character hash without truncation.

### 5.3 Verifying on Midnight Preprod Explorer
Every contract and transaction can be verified independently on the public Midnight explorer:
- **Contract Details:** `https://preprod.midnightexplorer.com/contract/<CONTRACT_ADDRESS>`
- **Transaction Proof:** `https://preprod.midnightexplorer.com/tx/<TRANSACTION_HASH>`

---

## 6. Troubleshooting & FAQs

### Error 171: OutOfDustValidityWindow
- **Cause:** Transaction submission was delayed past the network validity epoch due to testnet block indexing spikes.
- **Resolution:** Re-trigger the transaction. The platform will automatically query the latest block height (`https://rpc.preprod.midnight.network`) and submit a fresh witness.

### 1AM Wallet Fails to Connect
- Ensure the extension is unlocked.
- Verify that the active network is set to **Midnight Preprod**.
- Click **Disconnect** in the dashboard header, refresh, and reconnect.

### Transaction Stuck in Pending
- The Midnight Preprod block time is approximately 6 seconds. Most transactions confirm within 1–2 blocks.
- Check live indexer health via the GraphQL endpoint: `https://indexer.preprod.midnight.network/api/v4/graphql`.
