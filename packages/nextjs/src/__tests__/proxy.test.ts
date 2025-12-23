/**
 * Note: These tests focus on the withSiteline function's behavior
 * without mocking @siteline/core to avoid issues with the singleton pattern.
 * The core Siteline client is thoroughly tested in packages/core/src/__tests__/client.test.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSiteline } from '../proxy';
import type { SitelineConfig } from '../types';

describe('withSiteline', () => {
  const validKey = 'siteline_secret_' + 'a'.repeat(32);
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    process.env.SITELINE_WEBSITE_KEY = validKey;
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
        'referer': 'https://referrer.com',
        'x-forwarded-for': '192.168.1.1',
      }),
    } as NextRequest;
  };

  describe('middleware overloads', () => {
    it('works without arguments - returns default response', async () => {
      const handler = withSiteline();
      const req = createMockRequest();
      const response = await handler(req);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('handles multiple handler creations (singleton pattern)', async () => {
      // First handler creation and call
      const handler1 = withSiteline({ websiteKey: validKey });
      const req1 = createMockRequest();
      const response1 = await handler1(req1);

      expect(response1).toBeDefined();
      expect(response1.status).toBe(200);

      // Second handler creation and call - should reuse initialization
      const handler2 = withSiteline({ websiteKey: validKey });
      const req2 = createMockRequest('https://example.com/test2');
      const response2 = await handler2(req2);

      expect(response2).toBeDefined();
      expect(response2.status).toBe(200);

      // Third handler creation - different overload
      const handler3 = withSiteline();
      const req3 = createMockRequest('https://example.com/test3');
      const response3 = await handler3(req3);

      expect(response3).toBeDefined();
      expect(response3.status).toBe(200);
    });

    it('accepts and calls custom middleware function', async () => {
      const customMiddleware = jest.fn().mockResolvedValue(
        NextResponse.json({ custom: true })
      );

      const handler = withSiteline(customMiddleware);
      const req = createMockRequest();

      await handler(req);

      expect(customMiddleware).toHaveBeenCalledWith(req);
      expect(customMiddleware).toHaveBeenCalledTimes(1);
    });

    it('accepts config and returns response', async () => {
      const config: SitelineConfig = {
        websiteKey: validKey,
        debug: false,
      };

      const handler = withSiteline(config);
      const req = createMockRequest();
      const response = await handler(req);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('accepts config and middleware - calls middleware', async () => {
      const config: SitelineConfig = {
        websiteKey: validKey,
        endpoint: 'https://custom.example.com/intake',
      };

      const customMiddleware = jest.fn().mockResolvedValue(
        NextResponse.redirect(new URL('https://redirect.com'))
      );

      const handler = withSiteline(config, customMiddleware);
      const req = createMockRequest();

      const response = await handler(req);

      expect(customMiddleware).toHaveBeenCalledWith(req);
      expect(response.status).toBe(307); // redirect status
    });
  });

  describe('configuration handling', () => {
    it('accepts config with websiteKey', async () => {
      const config: SitelineConfig = {
        websiteKey: validKey,
        debug: true,
      };

      const handler = withSiteline(config);
      const req = createMockRequest();

      const response = await handler(req);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('accepts config with custom endpoint', async () => {
      const config: SitelineConfig = {
        websiteKey: validKey,
        endpoint: 'https://custom.example.com/intake',
      };

      const handler = withSiteline(config);
      const req = createMockRequest();

      const response = await handler(req);

      expect(response).toBeDefined();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('response handling', () => {
    it('preserves JSON response from middleware', async () => {
      const jsonData = { data: 'test', success: true };
      const jsonMiddleware = () => NextResponse.json(jsonData);

      const handler = withSiteline({ websiteKey: validKey }, jsonMiddleware);
      const req = createMockRequest();

      const response = await handler(req);
      const data = await response.json();

      expect(data).toEqual(jsonData);
    });

    it('preserves text Response from middleware', async () => {
      const responseText = 'Hello World';
      const responseMiddleware = () => new Response(responseText, { status: 201 });

      const handler = withSiteline({ websiteKey: validKey }, responseMiddleware);
      const req = createMockRequest();

      const response = await handler(req);
      const text = await response.text();

      expect(text).toBe(responseText);
      expect(response.status).toBe(201);
    });

    it('preserves redirect response from middleware', async () => {
      const redirectMiddleware = () =>
        NextResponse.redirect(new URL('https://redirect.com'));

      const handler = withSiteline({ websiteKey: validKey }, redirectMiddleware);
      const req = createMockRequest();

      const response = await handler(req);

      expect(response.status).toBe(307);
    });

    it('preserves custom status codes', async () => {
      const customMiddleware = () =>
        NextResponse.json({ error: 'Not found' }, { status: 404 });

      const handler = withSiteline({ websiteKey: validKey }, customMiddleware);
      const req = createMockRequest();

      const response = await handler(req);

      expect(response.status).toBe(404);
    });
  });

  describe('request handling', () => {
    it('handles requests with missing headers', async () => {
      const handler = withSiteline({ websiteKey: validKey });
      const req = {
        url: 'https://example.com/test',
        method: 'POST',
        headers: new Headers(),
      } as NextRequest;

      const response = await handler(req);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('handles different HTTP methods', async () => {
      const handler = withSiteline({ websiteKey: validKey });
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const req = {
          url: 'https://example.com',
          method,
          headers: new Headers(),
        } as NextRequest;

        const response = await handler(req);
        expect(response).toBeDefined();
        expect(response.status).toBe(200);
      }
    });

    it('handles async middleware', async () => {
      const slowMiddleware = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return NextResponse.json({ slow: true });
      };

      const handler = withSiteline({ websiteKey: validKey }, slowMiddleware);
      const req = createMockRequest();

      const response = await handler(req);
      const data = await response.json();

      expect(data).toEqual({ slow: true });
    });
  });

  describe('error handling', () => {
    it('propagates errors from middleware', async () => {
      const errorMiddleware = () => {
        throw new Error('Middleware error');
      };

      const handler = withSiteline({ websiteKey: validKey }, errorMiddleware);
      const req = createMockRequest();

      await expect(handler(req)).rejects.toThrow('Middleware error');
    });

    it('handles middleware that returns Promise rejection', async () => {
      const rejectMiddleware = () => Promise.reject(new Error('Async error'));

      const handler = withSiteline({ websiteKey: validKey }, rejectMiddleware);
      const req = createMockRequest();

      await expect(handler(req)).rejects.toThrow('Async error');
    });
  });

  describe('integration with IP extraction', () => {
    it('works with x-forwarded-for header', async () => {
      const handler = withSiteline({ websiteKey: validKey });
      const req = {
        url: 'https://example.com',
        method: 'GET',
        headers: new Headers({
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
        }),
      } as NextRequest;

      const response = await handler(req);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('works with x-real-ip header', async () => {
      const handler = withSiteline({ websiteKey: validKey });
      const req = {
        url: 'https://example.com',
        method: 'GET',
        headers: new Headers({
          'x-real-ip': '203.0.113.2',
        }),
      } as NextRequest;

      const response = await handler(req);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('works with cf-connecting-ip header', async () => {
      const handler = withSiteline({ websiteKey: validKey });
      const req = {
        url: 'https://example.com',
        method: 'GET',
        headers: new Headers({
          'cf-connecting-ip': '203.0.113.3',
        }),
      } as NextRequest;

      const response = await handler(req);

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });
});
