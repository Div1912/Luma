# Ghost
> Verifiable autonomous AI agents with mathematically guaranteed spending limits.

![Landing Page](./Screenshot/Landing%20Page.png)

## Live Demo
https://ghost-agent-midnight.vercel.app/ (Replace with your actual Vercel URL after deployment)

## Dashboard Overview
The central dashboard monitoring agent spending constraints and network activity.
![Dashboard](./Screenshot/Dashboard.png)

## Contract Address
| Network  | Address                          |
|----------|----------------------------------|
| Preprod  | e0c9d5d6d0ce7d5dc8dd4251a8d5ba0b368c42bb653f85b444e1318d93221f70 |
| Preview  | 9311008c4f7296577390c30c78f9f5c1c080587b204c28400b57a69hd9a83f56 |

## What This Does
Ghost acts as a cryptographic guardrail for AI agents executing financial transactions on your behalf. By leveraging zero-knowledge proofs on the Midnight network, the agent's spending actions are strictly bound by a user-defined limit. The transaction is only approved and recorded if the agent proves it respected your budget constraint, giving you trustless autonomy.

## Workflow & Execution
### 1. Contract Compilation
The Compact ZK contract is compiled to WebAssembly (WASM), generating the zero-knowledge circuits.
![Compiler](./Screenshot/Compiler.png)

### 2. Contract Deployment
The Ghost application interface connects to your Lace wallet to deploy the smart contract on the Midnight Network.
![Deployed Contract Via App](./Screenshot/Deployed%20Contract%20Via%20App.png)
![Deployed Contract](./Screenshot/Deployed%20Contract.png)

### 3. Circuit Execution
The Zero-Knowledge Circuit Proof is successfully generated and verified locally in the browser, before being settled on-chain.
![Successful Circuit called via App](./Screenshot/Succesfull%20Circuit%20called%20via%20App.png)

## Privacy Model
- **What is PUBLIC:** The `spending_limit` and `total_spent` are stored on the public ledger. Observers can verify the agent's total historic expenditure is within budget.
- **What is PRIVATE:** The exact `amount` being spent in a single transaction is passed as a private witness. The AI's precise financial moves remain confidential during execution.
- **What the user PROVES without revealing:** The agent proves that `total_spent + amount <= spending_limit` without having to publicly broadcast the `amount` before verification. We only deliberately disclose the amount to update the public ledger *after* the proof succeeds.

## Privacy Claim
An on-chain observer sees that a transaction occurred, and they see the updated total spending tally (because we explicitly disclose it after validation), but they **cannot see** the private transaction details or parameters that were passed to the circuit *during* the zero-knowledge validation phase. The execution constraint is proven in zero-knowledge.

## Tech Stack
Midnight network, Compact, Midnight.js SDK, Next.js (React), Tailwind CSS, Lace wallet

## Prerequisites
- Lace wallet installed (connected to Midnight Preview or Preprod network)
- Node.js v22+

## Run Locally
```bash
# 1. Clone the repository
git clone https://github.com/Div1912/Luma.git
cd Luma

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

## Demo Video
[PLACEHOLDER — I will add the link after recording]

## PROJECT FILE STRUCTURE
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
