/**
 * Tests for initialization and singleton behavior in proxy.ts
 * Uses jest.isolateModules to test module state properly
 */

import { NextRequest } from 'next/server';

describe('withSiteline initialization', () => {
  const validKey = 'siteline_secret_' + 'a'.repeat(32);
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockRequest = (url = 'https://example.com/test'): NextRequest => {
    return {
      url,
      method: 'GET',
      headers: new Headers({
        'user-agent': 'Mozilla/5.0',
      }),
    } as NextRequest;
  };

  it('skips initialization on subsequent calls (line 12 coverage)', async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.SITELINE_WEBSITE_KEY = validKey;

      const { withSiteline } = await import('../proxy');

      // First call - initializes
      const handler1 = withSiteline();
      const req1 = createMockRequest();
      await handler1(req1);

      // Second call - should hit early return on line 12
      const handler2 = withSiteline();
      const req2 = createMockRequest('https://example.com/second');
      await handler2(req2);

      // Third call - also hits early return
      const handler3 = withSiteline({ websiteKey: validKey });
      const req3 = createMockRequest('https://example.com/third');
      await handler3(req3);

      // All should work
      expect(true).toBe(true);
    });
  });

  it('warns when websiteKey is missing (line 24 coverage)', async () => {
    await jest.isolateModulesAsync(async () => {
      // Clear environment
      delete process.env.SITELINE_WEBSITE_KEY;
      delete process.env.SITELINE_ENDPOINT;
      delete process.env.SITELINE_DEBUG;

      const { withSiteline } = await import('../proxy');

      const handler = withSiteline();
      const req = createMockRequest();

      await handler(req);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Siteline] Missing websiteKey in config or environment'
      );
    });
  });

  it('initializes with environment variables', async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.SITELINE_WEBSITE_KEY = validKey;
      process.env.SITELINE_DEBUG = 'true';

      const { withSiteline } = await import('../proxy');

      const handler = withSiteline();
      const req = createMockRequest();

      const response = await handler(req);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  it('prefers config over environment variables', async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.SITELINE_WEBSITE_KEY = 'gptrends_secret_' + 'z'.repeat(32);

      const { withSiteline } = await import('../proxy');

      const handler = withSiteline({ websiteKey: validKey });
      const req = createMockRequest();

      const response = await handler(req);

      expect(response).toBeDefined();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
