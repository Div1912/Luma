# Ghost
> Verifiable autonomous AI agents with mathematically guaranteed spending limits.

## Live Demo
https://ghost-agent-midnight.vercel.app/ (Replace with your actual Vercel URL after deployment)

## Contract Address
| Network  | Address                          |
|----------|----------------------------------|
| Preprod  | e0c9d5d6d0ce7d5dc8dd4251a8d5ba0b368c42bb653f85b444e1318d93221f70 |

## What This Does
Ghost acts as a cryptographic guardrail for AI agents executing financial transactions on your behalf. By leveraging zero-knowledge proofs on the Midnight network, the agent's spending actions are strictly bound by a user-defined limit. The transaction is only approved and recorded if the agent proves it respected your budget constraint, giving you trustless autonomy.

## Privacy Model
- **What is PUBLIC:** The `spending_limit` and `total_spent` are stored on the public ledger. Observers can verify the agent's total historic expenditure is within budget.
- **What is PRIVATE:** The exact `amount` being spent in a single transaction is passed as a private witness. The AI's precise financial moves remain confidential during execution.
- **What the user PROVES without revealing:** The agent proves that `total_spent + amount <= spending_limit` without having to publicly broadcast the `amount` before verification. We only deliberately disclose the amount to update the public ledger *after* the proof succeeds.

## Privacy Claim
An on-chain observer sees that a transaction occurred, and they see the updated total spending tally (because we explicitly disclose it after validation), but they **cannot see** the private transaction details or parameters that were passed to the circuit *during* the zero-knowledge validation phase. The execution constraint is proven in zero-knowledge.

## Tech Stack
Midnight network, Compact, Midnight.js SDK, React/Vite, Lace wallet

## Prerequisites
- Lace wallet installed (connected to Midnight Preprod network)
- Node.js v22

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
  my-project/
  ├── contracts/
  │   └── ghost.compact
  ├── managed/
  ├── src/
  │   ├── components/
  │   │   ├── WalletConnect.tsx
  │   │   └── CircuitCall.tsx
  │   ├── hooks/
  │   │   ├── useMidnight.ts
  │   │   ├── providers.ts
  │   │   └── in-memory-private-state-provider.ts
  │   ├── App.tsx
  │   └── main.tsx
  ├── tests/
  ├── public/
  ├── .github/
  ├── README.md
  ├── package.json
  └── vite.config.ts
