import { NextRequest, NextResponse } from 'next/server';
import { ProofVerifier } from '@/packages/sdk/src/zk/verifier';
import { PRODUCTION_NETWORKS, stateCache } from '@/lib/midnight/resilience';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proofHash, network = 'preprod' } = body;

    if (!proofHash) {
      return NextResponse.json({ error: 'proofHash is required' }, { status: 400 });
    }

    const cacheKey = `proof:${network}:${proofHash}`;
    const cached = stateCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true, verificationLatencyMs: 1 });
    }

    const start = performance.now();
    const verifier = new ProofVerifier(network);
    const verification = await verifier.verify(proofHash, { network });
    const latencyMs = Math.max(1, Math.round(performance.now() - start));

    const endpoints = PRODUCTION_NETWORKS[network as 'preview' | 'preprod' | 'mainnet'] || PRODUCTION_NETWORKS.preprod;

    const responseData = {
      proofHash,
      valid: verification.valid,
      network: verification.network,
      blockHeight: verification.blockHeight,
      verifiedAt: new Date().toISOString(),
      explorerUrl: `${endpoints.explorerUri}/transactions/${proofHash}`,
      verificationLatencyMs: latencyMs,
      cached: false,
    };

    stateCache.set(cacheKey, responseData, 60000); // cache valid proofs for 60 seconds

    return NextResponse.json(responseData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
