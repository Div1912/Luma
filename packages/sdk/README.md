# @ghost/sdk

> **Zero-Knowledge Policy Compliance & Spending Guardrails for Autonomous AI Agents**  
> Built for Midnight Network. Compatible with LangChain, AutoGPT, Eliza, and AutoGen.

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://npmjs.com/package/@ghost/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Midnight Network](https://img.shields.io/badge/Midnight-Preprod-purple.svg)](https://midnight.network)

---

## ⚡ Installation

```bash
npm install @ghost/sdk
```

---

## 🚀 3-Line LangChain Integration

Plug verifiable ZK spending policies directly into any LangChain agent toolchain:

```typescript
import { GhostClient, GhostSpendingTool } from '@ghost/sdk';

// 1. Initialize the Ghost client
const ghost = new GhostClient({ apiKey: process.env.GHOST_API_KEY });

// 2. Attach the ZK Spending Tool to your LangChain agent
const tools = [new GhostSpendingTool(ghost, { agentId: 'procurement_agent_1' })];

// 3. Let LangChain execute under mathematical zero-knowledge guardrails!
const result = await agent.invoke({ input: "Order 5 servers from AWS for $350" });
```

---

## 🤖 3-Line AutoGPT & Eliza Integration

Wrap any autonomous action loop with non-bypassable policy guardrails:

```typescript
import { GhostClient, withGhostGuard } from '@ghost/sdk';

// 1. Initialize the Ghost client
const ghost = new GhostClient({ apiKey: process.env.GHOST_API_KEY });

// 2. Wrap your execution command with Ghost Guard
const safeExecute = withGhostGuard(ghost, { agentId: 'autogpt_node_42' }, originalExecuteCommand);

// 3. Autonomous commands that exceed budgets or hit blocklists are blocked automatically
await safeExecute({ command_name: 'purchase_item', arguments: { amount: 1500, merchant: 'Untrusted Vendor' } });
```

---

## 🛡️ Direct SDK API Usage

```typescript
import { GhostClient } from '@ghost/sdk';

const ghost = new GhostClient({
  apiKey: 'gsk_live_9f82kd01a84f...',
  network: 'preprod' // 'preprod' | 'preview' | 'mainnet'
});

// Evaluate spend in ~3ms
const decision = await ghost.evaluate({
  agentId: 'agent_shopping_01',
  amount: 150,
  merchant: 'AWS Cloud Services',
  category: 'cloud_infrastructure'
});

if (decision.approved) {
  console.log('✓ ZK Proof Witness Generated:', decision.proofHash);
  
  // Execute and submit proof to Midnight Network
  const tx = await ghost.executeSpend({
    agentId: 'agent_shopping_01',
    amount: 150,
    merchant: 'AWS Cloud Services'
  });
  console.log('✓ Settled on Midnight Explorer:', tx.txHash);
} else {
  console.error('✗ Blocked by Policy:', decision.reason);
}
```

---

## 📄 License

MIT © Ghost Network
