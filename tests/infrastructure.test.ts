/**
 * @file tests/infrastructure.test.ts
 * Tests for Production Infrastructure, Midnight Network Endpoints,
 * Indexer Resilience, and State Caching.
 */

import { describe, it, expect } from 'vitest';
import {
  PRODUCTION_NETWORKS,
  stateCache,
  checkMidnightInfrastructureHealth,
} from '../lib/midnight/resilience.js';

describe('Production Infrastructure & Resilience Layer', () => {
  describe('Network Configurations', () => {
    it('defines distinct endpoints for Preview, Preprod, and Mainnet', () => {
      expect(PRODUCTION_NETWORKS.preview.indexerUri).toContain('preview');
      expect(PRODUCTION_NETWORKS.preprod.indexerUri).toContain('preprod');
      expect(PRODUCTION_NETWORKS.mainnet.indexerUri).toBeDefined();

      expect(PRODUCTION_NETWORKS.preview.explorerUri).toBe('https://preview.midnightexplorer.com');
      expect(PRODUCTION_NETWORKS.preprod.explorerUri).toBe('https://preprod.midnightexplorer.com');
      expect(PRODUCTION_NETWORKS.mainnet.explorerUri).toBe('https://midnightexplorer.com');
    });
  });

  describe('Sub-second State Caching', () => {
    it('caches and retrieves items within TTL', () => {
      stateCache.set('test_key', { blockHeight: 185420 }, 1000);
      const cached = stateCache.get<{ blockHeight: number }>('test_key');
      expect(cached).toEqual({ blockHeight: 185420 });
    });

    it('returns null for non-existent or expired keys', async () => {
      stateCache.set('expired_key', { data: 'old' }, 10);
      await new Promise((r) => setTimeout(r, 20));
      expect(stateCache.get('expired_key')).toBeNull();
    });
  });

  describe('Infrastructure Health Checks', () => {
    it('checks health status and returns latency metrics', async () => {
      const health = await checkMidnightInfrastructureHealth('preprod');
      expect(health.network).toBe('preprod');
      expect(health.indexerHealthy).toBe(true);
      expect(health.proverHealthy).toBe(true);
      expect(health.proverLatencyMs).toBeLessThanOrEqual(50);
      expect(health.lastBlockHeight).toBeGreaterThan(180000);
    });
  });
});
