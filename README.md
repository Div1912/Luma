# Ghost: Verifiable Autonomous Agents on Midnight

## The Problem
Agentic AI is the future, but trust is the main bottleneck. Consumers and enterprises alike are terrified of autonomous systems making unauthorized or harmful decisions. We want AI agents to shop, negotiate, and execute workflows for us, but we don’t trust what they do when left unsupervised. If a shopping agent blows past your budget, or a negotiation agent ignores constraints, the damage is real. 

## The Product Idea
**Ghost** is a verifiable autonomy layer for agents on the Midnight blockchain. It acts as a cryptographic guardrail for high-risk agent actions. 
Starting with our first use case—a shopping and B2B negotiation agent—Ghost ensures that an agent cannot finalize any transaction over a user-specified maximum limit without explicit approval. Each completed action comes with an on-chain zero-knowledge proof guaranteeing that the agent obeyed the constraints (e.g., `amount ≤ limit`) at the time of execution, all without leaking private data to the public ledger. You don't have to trust the AI; you trust the math.

## Technical Details: Public State vs Private Witness
In our Ghost smart contract (written in Compact):
- **Public State (`ledger`)**: The `spending_limit` and `total_spent` are stored on the public ledger. This allows the network and users to publicly verify that the total expenditure remains within the budget.
- **Private Witness**: The `amount` being spent in a single transaction is passed as a private input (witness) to the `spend` circuit. The zero-knowledge proof verifies that `total_spent + amount <= spending_limit` without the user having to publicly reveal their exact transaction details before the constraint is checked. Only when the constraint is satisfied do we deliberately use `disclose(amount)` to update the public ledger, making the final authorized spend amount public while keeping the execution constraints private-first.

## Setup Instructions (How to run locally)

### Prerequisites
- Node.js 22+
- Docker (for running the Midnight ZK Proof Server)
- [Midnight Compact Compiler](https://docs.midnight.network/develop/tutorial/building/prereqs)

### Build and Test
1. Clone the repository and navigate to the project root.
2. Navigate to the contract folder:
   ```bash
   cd ghost-contract
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Compile the Compact contract to generate zero-knowledge circuits and TypeScript bindings:
   ```bash
   npm run compact
   ```
5. Run the test suite to verify the spending limit constraints:
   ```bash
   npm test
   ```

## Submission Screenshots

### Successful Compile Output (Circuits Listed)
![Compile Output](./compile-output.png)
*(Note: Replace with your actual screenshot of `npm run compact` showing the circuits)*

### Contract Deployed with Address Shown
![Contract Deployment](./deployment.png)
*(Note: Replace with your actual screenshot of the Preprod deployment address)*
