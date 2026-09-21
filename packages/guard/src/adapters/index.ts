/**
 * @file packages/guard/src/adapters/index.ts
 * Dedicated framework adapters for LangChain, Vercel AI SDK, and ElizaOS.
 */

export { wrapLangChainTool } from './langchain.js';
export type { LangChainToolLike } from './langchain.js';

export { wrapVercelTool } from './vercel.js';
export type { VercelToolLike } from './vercel.js';

export { wrapElizaAction } from './eliza.js';
export type { ElizaActionLike } from './eliza.js';
