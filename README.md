# Ghost: Verifiable Autonomy Layer for AI Shopping Agents
> *"Trust the proof, not the promise."*

![Landing Page](./Screenshot/Landing%20Page.png)

Ghost is a verifiable autonomy layer built on the Midnight privacy blockchain. It lets AI shopping/commerce agents discover, compare, negotiate and buy on behalf of users, while enforcing hard, cryptographic spending rules and generating zero-knowledge proofs that every purchase obeyed those rules—without exposing private data or the agent’s internal logic.

---

## 🚀 Live Demo & Video
**Live App:** [https://ghost-kappa-one.vercel.app/](https://ghost-kappa-one.vercel.app/)

[![**Demo Video**](https://img.youtube.com/vi/s0wpYVi6FOo/0.jpg)](https://youtu.be/s0wpYVi6FOo)

---

## 🚨 The Problem

### Agentic AI adoption vs trust gap
- **The Trust Gap:** Only a small minority of consumers trust AI assistants to make everyday purchasing decisions. Around two-thirds of consumers do **not** trust AI even when it follows rules they set, fearing unauthorized purchases and loss of control over their money.
- **What’s missing today:** Current AI shopping/commerce agents rely on app-level settings and off-chain logs. A bug, breach, or malicious platform can ignore settings and logs. Users must trust the provider’s promise that "we enforced your limits" instead of seeing an independent proof.

There is no **verification layer** that gives users and merchants mathematical guarantees about agent behavior, rather than just UI toggles and marketing claims.

---

## 💡 The Solution

Ghost wraps AI shopping/commerce agents with cryptographic guardrails. Instead of asking users to "trust the platform," Ghost offers a simple promise:

> *"If an AI agent spends your money through Ghost, there is a verifiable proof that it stayed within your rules. If it can’t prove that, the transaction cannot go through."*

### Key Mechanisms:
1. **Hard, on-chain spending policies** stored privately on Midnight.
2. **Zero-knowledge proofs** that each agent-initiated purchase respects those policies.
3. **Cryptographic audit trails** for dispute resolution and compliance.

![Dashboard](./Screenshot/Dashboard.png)
*The central dashboard monitoring agent spending constraints and network activity.*

---

## ✨ Features

- **Safety Rails:** Agents cannot overspend beyond user-defined caps.
- **Privacy First:** 
  - **What is PUBLIC:** The `spending_limit` and `total_spent` are stored on the public ledger. Observers can verify the agent's total historic expenditure is within budget.
  - **What is PRIVATE:** The exact `amount` being spent in a single transaction is passed as a private witness. The AI's precise financial moves remain confidential during execution.
- **Constraint-enforced Checkout:** The agent proves that `total_spent + amount <= spending_limit` without having to publicly broadcast the `amount` before verification. We only deliberately disclose the amount to update the public ledger *after* the proof succeeds.

![Successful Circuit called via App](./Screenshot/Succesfull%20Circuit%20called%20via%20App.png)
*Zero-Knowledge Circuit Proof successfully generated and verified locally in the browser, before being settled on-chain.*

---

## 🏗 System Architecture

1. **Ghost Core (Midnight Smart Contract)**
   - Written in Compact, deployed on Midnight.
   - Private variables: policy commitments and internal constraint representations.
   - Public ledger state: Ghost registry entries for approved purchases, policy metadata, and revocation flags.
   - ZK circuits: equality/inequality and aggregate constraints (amounts vs limits).

2. **Agent dApp UI**
   - Next.js web interface where the user sets limits and the AI agent proposes purchases.
   - Integrates Lace Wallet for on-chain interactions and ZK proof submissions.

![Compiler](./Screenshot/Compiler.png)
*The Compact ZK contract is compiled to WebAssembly (WASM), generating the zero-knowledge circuits.*

---

## 🚀 Live Demo & Contracts

**Live Demo:** https://ghost-agent-midnight.vercel.app/ (Replace with your actual Vercel URL after deployment)

### Deployed Contract Addresses
| Network  | Address                          |
|----------|----------------------------------|
| Preprod  | e0c9d5d6d0ce7d5dc8dd4251a8d5ba0b368c42bb653f85b444e1318d93221f70 |
| Preview  | 9311008c4f7296577390c30c78f9f5c1c080587b204c28400b57a69hd9a83f56 |

![Deployed Contract Via App](./Screenshot/Deployed%20Contract%20Via%20App.png)
*Contract deployed successfully through the Ghost application interface.*

---

## 🛠 Tech Stack

- **Blockchain:** Midnight Network (Privacy-preserving DLT)
- **Smart Contracts:** Compact (Midnight's ZK language)
- **SDK:** Midnight.js 
- **Frontend:** Next.js (React), Tailwind CSS
- **Wallet:** Lace Wallet (Cardano / Midnight)

---

## 📂 Project File Structure

```text
Luma/
├── app/                        # Next.js App Router (Pages & Layouts)
│   ├── auth/signin/            # Lace Wallet Connection Screen
│   ├── dashboard/              # Main Ghost Dashboard UI
│   ├── globals.css             # Tailwind & Base Styles
│   └── layout.tsx              # Root Layout
├── components/                 # React UI Components
├── contracts/                  # Midnight Smart Contracts
│   └── ghost.compact           # Core ZK Spending Limit Contract
├── lib/                        # Utilities & Hooks
│   └── midnight/               # Midnight SDK Integration
│       ├── providers.ts        # Contract Deploy & Network Config
│       ├── MidnightProvider.tsx# React Context for Wallet State
│       └── useMidnight.ts      # Custom Hook for App Components
├── managed/                    # Auto-generated WASM & Types from Compact
├── public/                     # Static Assets & ZK Proving Keys (*.zkir, *.pk)
├── Screenshot/                 # Application Screenshots
├── package.json
└── next.config.mjs
```

---

## 💻 Run Locally

### Prerequisites
- Lace wallet installed (connected to Midnight Preview or Preprod network)
- Node.js v22+

```bash
# 1. Clone the repository
git clone https://github.com/Div1912/Luma.git
cd Luma

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```
