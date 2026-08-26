import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cached, invalidateCache } from './cache.js';

// Note: The cache module uses a shared in-memory store
// We need to be careful with test isolation

describe('Cache module', () => {
  it('returns cached value on second call', async () => {
    let callCount = 0;
    const result1 = await cached('test1', 60000, async () => {
      callCount++;
      return 'hello';
    });
    assert.equal(result1, 'hello');
    assert.equal(callCount, 1);

    const result2 = await cached('test1', 60000, async () => {
      callCount++;
      return 'different value';
    });
    assert.equal(result2, 'hello');
    assert.equal(callCount, 1);
  });

  it('recomputes after TTL expires', async () => {
    let callCount = 0;
    const shortTTL = 1; // 1 millisecond
    
    await cached('ttl-test', shortTTL, async () => {
      callCount++;
      return 'first';
    });
    
    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const result = await cached('ttl-test', shortTTL, async () => {
      callCount++;
      return 'second';
    });
    assert.equal(result, 'second');
    assert.equal(callCount, 2);
  });

  it('invalidates specific prefix', async () => {
    await cached('user:1', 60000, async () => 'a');
    await cached('user:2', 60000, async () => 'b');
    await cached('vehicle:1', 60000, async () => 'c');
    
    invalidateCache('user:');
    
    // User entries should be invalidated
    const result1 = await cached('user:1', 60000, async () => 'new1');
    assert.equal(result1, 'new1');
    
    // Vehicle entry should still be cached
    const result2 = await cached('vehicle:1', 60000, async () => 'new2');
    assert.equal(result2, 'c');
  });

  it('invalidates all entries when no prefix', async () => {
    await cached('test-a', 60000, async () => 'a');
    await cached('test-b', 60000, async () => 'b');
    
    invalidateCache();
    
    const r1 = await cached('test-a', 60000, async () => 'new-a');
    const r2 = await cached('test-b', 60000, async () => 'new-b');
    
    assert.equal(r1, 'new-a');
    assert.equal(r2, 'new-b');
  });

  it('handles async functions', async () => {
    const result = await cached('async-test', 60000, async () => {
      return new Promise(resolve => setTimeout(() => resolve(42), 10));
    });
    assert.equal(result, 42);
  });

  it('handles errors gracefully', async () => {
    try {
      await cached('error-test', 60000, async () => {
        throw new Error('test error');
      });
      assert.fail('Should have thrown');
    } catch (e: any) {
      assert.equal(e.message, 'test error');
    }
  });
});
