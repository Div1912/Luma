# Ghost: Verifiable Autonomy Layer for AI Shopping Agents

**Tagline:** _"Trust the proof, not the promise."_

Ghost is a verifiable autonomy layer built on the Midnight privacy blockchain. It lets AI shopping/commerce agents discover, compare, negotiate and buy on behalf of users, while enforcing hard, cryptographic spending rules and generating zero-knowledge proofs that every purchase obeyed those rules—without exposing private data or the agent’s internal logic.

---

## 1. Problem

### 1.1 Agentic AI adoption vs trust gap

- Agentic AI is projected to grow from single-digit billions in 2026 to tens or even hundreds of billions by the early 2030s, with 30–40%+ CAGR, as agents move from chatbots to autonomous decision-makers in commerce, finance, and operations.
- But fresh 2026 surveys show a sharp trust gap:
  - Only a small minority of consumers trust AI assistants to make everyday purchasing decisions; a clear majority prefer human advice.
  - Around two-thirds of consumers do **not** trust AI even when it follows rules they set.
  - Roughly 60% of consumers say they would stop using an AI shopping agent after a single mistake.
  - Top fears: unauthorized purchases, loss of control over money, and unclear accountability when things go wrong.
- Enterprise decision-makers mirror this: security leaders say AI agents **should** handle real tasks, but only a small fraction are willing to fully automate anything. The top stated blocker is "unintended agent actions." Governance and accountability, not raw capability, are the bottlenecks.

### 1.2 What’s missing today

Current AI shopping/commerce agents (and the platforms that host them) rely on:

- App-level settings (spending limits, categories) enforced by the platform itself.
- Off-chain logs for auditing and disputes.

Problems:

- A bug, breach, or malicious platform can ignore settings and logs.
- Users must trust the provider’s promise that "we enforced your limits" instead of seeing an independent proof.
- Merchants and regulators have no cryptographic way to verify that agents obeyed user-specified policies.

There is no **verification layer** that gives users and merchants mathematical guarantees about agent behavior, rather than UI toggles and marketing claims.

Ghost exists to be that verification layer.

---

## 2. Solution Overview

**Ghost** wraps AI shopping/commerce agents with:

1. **Hard, on-chain spending policies** stored privately on Midnight.
2. **Zero-knowledge proofs** that each agent-initiated purchase respects those policies.
3. **Explicit approval flows** for high-risk transactions.
4. **Instant revocation** (kill switch) for all agent permissions.
5. **Cryptographic audit trails** for dispute resolution and compliance.

Instead of asking users to "trust the platform," Ghost offers a simple promise:

> "If an AI agent spends your money through Ghost, there is a verifiable proof that it stayed within your rules. If it can’t prove that, the transaction cannot go through."

Ghost is implemented as:

- A Midnight smart contract (Ghost Core) that enforces policies and verifies proofs.
- An Agent SDK that AI platforms use to integrate Ghost into their checkout flows.
- A simple consumer UI for setting limits, approvals, and revocation.

---

## 3. Users and Stakeholders

### 3.1 Consumers

Target users:

- People using AI to discover products and deals, who want the convenience of agentic commerce but are afraid of granting full spending control.
- Early adopters of AI shopping assistants who currently double-check every agent recommendation manually.

Key value:

- **Safety rails:** Agents cannot overspend beyond user-defined caps.
- **Control:** Users can set limits, require explicit approvals, and revoke agents instantly.
- **Transparency:** Users can see a clear record of what the agent did, and why it was allowed.

### 3.2 Merchants, BNPL providers, and fintechs

Target partners:

- Merchants experimenting with AI-led shopping experiences (chat assistants, auto-filled carts, agentic bundles).
- BNPL providers and neobanks offering AI budgeting/shopping features.

Key value:

- **Brand protection:** Ghost reduces the risk of catastrophic agent mistakes that erode consumer trust.
- **Differentiation:** "Our AI agents are cryptographically accountable" is a meaningful marketing and compliance story.
- **Dispute resolution:** Merchants and BNPL providers get verifiable records to handle chargebacks and compliance investigations.

### 3.3 AI agent platforms (B2B2C)

Target platforms:

- Companies building AI shopping assistants, recommendation agents, and commerce bots.

Key value:

- **Trust layer in a box:** They can integrate Ghost instead of building their own cryptographic and policy infrastructure.
- **Regulatory readiness:** Ghost helps them align with emerging agentic AI governance standards and financial regulations.

---

## 4. Product Capabilities

### 4.1 Private policy storage on Midnight

When a user connects an AI shopping agent to Ghost, they set:

- Max per-purchase spending limit (e.g., ₹2,000).
- Optional daily, weekly, or monthly caps (e.g., ₹8,000/month for groceries).
- Optional category-based rules (e.g., groceries vs electronics).

Ghost Core stores these limits as **private state** in a Midnight smart contract:

- Raw values (like ₹2,000) are never stored as public plaintext.
- Instead, commitments and private variables inside Midnight’s Compact circuits represent the policies.
- Only proofs about these values are ever disclosed.

### 4.2 Constraint-enforced checkout

When the AI agent wants to finalize a purchase, it must:

1. Build a purchase intent: amount, merchant, category.
2. Generate a zero-knowledge proof that:
   - The intent amount is less than or equal to the user’s private per-purchase limit.
   - The intent respects daily/monthly caps (given current public/proof state).
   - Any category rules are satisfied.
3. Call Ghost Core with the proof and public metadata.

Ghost Core:

- Verifies the proof against its private policy state and public purchase history.
- If valid, records an "Approved" purchase event on-chain with amount, merchant ID, category, and timestamp.
- If invalid, rejects the transaction. The agent cannot bypass Ghost to complete the purchase through this integration.

### 4.3 Explicit approval for high-risk transactions

For purchases beyond certain thresholds (e.g., >₹5,000, or specific categories):

- Ghost flags the intent as "Requires Human Approval".
- The user receives an approval prompt via Ghost’s UI or the host app:
  - Item details and price.
  - A proof that the purchase would still respect overall monthly or category rules.
- Only after explicit approval does Ghost verify and record the transaction.

This ensures that high-stakes purchases always have a human-in-the-loop, while everyday small purchases remain autonomous within constraints.

### 4.4 Instant revocation (kill switch)

Ghost exposes a revocation function:

- Users can revoke agent permissions instantly:
  - At the agent level (one specific AI assistant).
  - At the global level (all agents connected to Ghost).
- Revocation flips a flag in Ghost’s private policy state and public registry.
- After revocation, any checkout attempt from that agent fails verification, regardless of the proof.

This makes revocation a protocol-level guarantee, not just a UI action.

### 4.5 Cryptographic audit trails

Ghost maintains an on-chain and proof-level record of:

- Approved purchase events (amount, merchant, category, timestamp).
- Whether each purchase was within constraints.
- Policy state transitions (e.g., limit changes, revocations).

In case of disputes, regulators or partners can:

- Verify that a given purchase was indeed authorized under the user’s policy.
- Detect attempted policy violations or bypasses.

Audit trails are privacy-preserving: they reveal outcomes and necessary metadata, but not the user’s complete financial profile or agent’s full reasoning.

---

## 5. Architecture

### 5.1 Components

1. **Ghost Core (Midnight Smart Contract)**
   - Written in Compact, deployed on Midnight.
   - Private variables: policy commitments and internal constraint representations.
   - Public ledger state: Ghost registry entries for approved purchases, policy metadata, and revocation flags.
   - ZK circuits: equality/inequality and aggregate constraints (amounts vs limits, caps, categories).

2. **Agent SDK**
   - Client library for AI platforms (TypeScript/JavaScript first).
   - Exposes high-level functions:
     - `setPolicy(policyConfig)` – configure spending rules via Ghost.
     - `ghostCheckout(intent)` – wrap agent checkout calls with proof generation and contract submission.
     - `revokeAgent()` – trigger revocation.
   - Abstracts proof generation; developers interact with simple APIs.

3. **Consumer UI**
   - Web and/or mobile interface:
     - Set/edit per-purchase and aggregate limits.
     - Configure approval thresholds.
     - View recent Ghost-approved purchases.
     - Trigger revocation and manage agents.

4. **Merchant/Fintech Integration**
   - APIs or plugins:
     - Verify Ghost-approved transactions.
     - Read audit data for disputes.
     - Optionally display Ghost trust badges to consumers.

### 5.2 Data flow

- Policies: set by user, stored as private commitments in Ghost Core.
- Agent intents: constructed off-chain by the AI agent and passed to Ghost SDK.
- Proofs: generated off-chain (client-side or server-side) and verified on-chain.
- Approvals: mediated by Ghost UI / host app, committed back into Ghost Core.

---

## 6. Example User Journey (v1: Grocery Shopping)

1. **Onboarding**
   - User installs a shopping app or enables an AI grocery assistant.
   - App prompts: "Protect your AI purchases with Ghost".
   - User connects their payment method and sets Ghost policies:
     - Max per grocery purchase: ₹1,500.
     - Monthly grocery cap: ₹8,000.

2. **Agent operates autonomously**
   - Agent scans prices, builds a cart:
     - Total: ₹1,350.
   - Before payment, agent calls `ghostCheckout({ amount: 1350, category: 'grocery', merchantId })`.

3. **Ghost verification**
   - SDK generates a proof that:
     - 1,350 ≤ 1,500.
     - Monthly total after this purchase would stay ≤ 8,000.
   - Ghost Core verifies the proof and records an "Approved" event.

4. **Payment completes**
   - Merchant or BNPL provider checks Ghost for approval.
   - Transaction completes.

5. **Overspend attempt**
   - Later, agent constructs a ₹2,200 cart.
   - SDK can’t generate a valid proof; Ghost Core rejects the intent.
   - App shows: "Ghost blocked this purchase – exceeds your set limit".

6. **User adjusts policy**
   - User raises per-purchase limit to ₹2,500 via Ghost UI.
   - Policies update on-chain via Ghost Core; future proofs use the new limit.

---

## 7. Differentiation

Ghost vs current approaches:

- **App settings vs protocol guarantees**:
  - Current agents rely on app-level settings that can be ignored or misimplemented.
  - Ghost embeds spending rules into a verifiable protocol, making violations cryptographically impossible within the integration.

- **Logs vs proofs**:
  - Logs can be manipulated or lost.
  - Ghost produces zero-knowledge proofs that can be independently verified.

- **Opaque vs accountable agents**:
  - Current agents ask users to trust platforms when something goes wrong.
  - Ghost gives users, merchants, and regulators cryptographic evidence of what the agent did relative to user-defined rules.

---

## 8. v1 Scope for Midnight Program

### Level 1 (New Moon)

- Implement Ghost Core v1:
  - Compact contract with:
    - Private policy commitment.
    - Simple per-purchase limit constraint.
  - Deployed to Midnight Preview/Preprod.
- README:
  - Explain public vs private state.
  - Describe initial product idea: Ghost spending guardrail for AI grocery agents.

### Level 2 (Waxing Crescent)

- Wire Ghost Core to a minimal frontend:
  - Policy configuration UI.
  - Demo AI "agent" UI that proposes purchases.
- Integrate Lace wallet for on-chain interactions.
- Show an observable privacy behavior:
  - Proof of spending limit enforcement without revealing the actual limit.

### Level 3 (First Quarter)

- Harden the dApp:
  - Tests for constraint enforcement.
  - CI/CD for compile + tests.
- Choose "Private Payroll/Splits" or "Confidential Credentials" on the idea list as a conceptual anchor, but demonstrate Ghost’s spending-limit logic as your core contribution.

---

## 9. Long-Term Vision

Beyond the initial shopping guardrail, Ghost can expand to:

- Complex budgeting and multi-category policies.
- B2B negotiation agents with proof-backed budgets.
- Portfolio/trading agents with provable risk constraints.
- Compliance-grade enterprise agents (lending, insurance) with auditable ZK proofs.

But the core remains the same: **cryptographic accountability for autonomous agents**, starting with the clearest, most user-visible pain point—spending control in AI commerce.
