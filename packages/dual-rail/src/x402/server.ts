/**
 * @file packages/dual-rail/src/x402/server.ts
 * Lightweight verification & testbed HTTP 402 paywall server.
 */

import http, { Server, IncomingMessage, ServerResponse } from 'http';
import { createHash } from 'crypto';
import { PaywallServerOptions } from '../types.js';

export interface PaywallServerInstance {
  server: Server;
  url: string;
  close: () => Promise<void>;
  getSettledCount: () => number;
}

export function createX402PaywallServer(options: PaywallServerOptions = {}): Promise<PaywallServerInstance> {
  const contractAddress =
    options.contractAddress || '0xd72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad';
  const price = options.pricePerRequest ?? 15;
  const currency = options.currency || 'tDUST';
  const network = options.network || 'preprod';

  const usedNonces = new Set<string>();
  let settledPaymentsCount = 0;

  return new Promise((resolve, reject) => {
    const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
      const authHeader = req.headers['authorization'];

      // 1. If no authorization header or not L402, respond with 402 challenge
      if (!authHeader || !authHeader.startsWith('L402 ')) {
        const serverNonce = '0x' + createHash('sha256').update(`${Date.now()}_${Math.random()}`).digest('hex');

        res.writeHead(402, {
          'Content-Type': 'application/json',
          'WWW-Authenticate': `L402 contract="${contractAddress}", amount="${price}", currency="${currency}", nonce="${serverNonce}", network="${network}"`,
        });
        res.end(
          JSON.stringify({
            error: 'Payment Required',
            message: `Endpoint requires ${price} ${currency} micropayment on Midnight.`,
            challenge: {
              contract: contractAddress,
              amount: price,
              currency,
              nonce: serverNonce,
              network,
            },
          })
        );
        return;
      }

      // 2. Parse submitted L402 proof
      const proofMatch = authHeader.match(/proof="([^"]+)"/);
      const nonceMatch = authHeader.match(/nonce="([^"]+)"/);

      if (!proofMatch || !nonceMatch) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Malformed L402 authorization header' }));
        return;
      }

      const proof = proofMatch[1];
      const nonce = nonceMatch[1];

      // 3. Replay Protection: Assert nonce hasn't been spent already
      if (usedNonces.has(nonce)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Replay Attack Detected: Nonce already settled' }));
        return;
      }

      // 4. Validate proof signature sanity
      if (!proof.startsWith('0xzk_m2m_') && !proof.startsWith('0x')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid ZK payment proof' }));
        return;
      }

      // 5. Payment verified! Commit nonce and unlock paywalled payload
      usedNonces.add(nonce);
      settledPaymentsCount += 1;

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-402-Payment-Settled': 'true',
        'X-402-Receipt': proof,
      });
      res.end(
        JSON.stringify({
          data: 'Unlocked high-value AI inference dataset / premium API access.',
          settledPrice: price,
          currency,
          txReceipt: proof,
        })
      );
    });

    server.listen(options.port || 0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to get server address'));
        return;
      }
      const url = `http://127.0.0.1:${addr.port}`;
      resolve({
        server,
        url,
        close: () => new Promise<void>((r) => server.close(() => r())),
        getSettledCount: () => settledPaymentsCount,
      });
    });

    server.on('error', reject);
  });
}
