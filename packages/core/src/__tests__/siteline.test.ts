import { Siteline } from '../siteline';
import type { PageviewData } from '../types';

describe('Siteline', () => {
  const validKey = 'siteline_secret_' + 'a'.repeat(32);
  let fetchMock: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('accepts valid websiteKey', () => {
      expect(() => new Siteline({ websiteKey: validKey })).not.toThrow();
    });

    it('rejects invalid websiteKey format - wrong prefix', () => {
      expect(() => new Siteline({ websiteKey: 'invalid_secret_' + 'a'.repeat(32) }))
        .toThrow('Invalid websiteKey format');
    });

    it('rejects invalid websiteKey format - wrong length', () => {
      expect(() => new Siteline({ websiteKey: 'siteline_secret_abc' }))
        .toThrow('Invalid websiteKey format');
    });

    it('rejects invalid websiteKey format - non-hex chars', () => {
      expect(() => new Siteline({ websiteKey: 'siteline_secret_' + 'z'.repeat(32) }))
        .toThrow('Invalid websiteKey format');
    });

    it('rejects non-HTTPS endpoint', () => {
      expect(() => new Siteline({
        websiteKey: validKey,
        endpoint: 'http://api.example.com'
      })).toThrow('Endpoint must use HTTPS');
    });

    it('accepts custom HTTPS endpoint', () => {
      const client = new Siteline({
        websiteKey: validKey,
        endpoint: 'https://custom.example.com'
      });
      expect(client).toBeInstanceOf(Siteline);
    });

    it('uses default endpoint when not provided', () => {
      const client = new Siteline({ websiteKey: validKey });
      expect(client).toBeInstanceOf(Siteline);
    });

    it('logs initialization in debug mode', () => {
      new Siteline({ websiteKey: validKey, debug: true });
      expect(consoleLogSpy).toHaveBeenCalledWith('[Siteline] Siteline initialized');
    });

    it('does not log without debug mode', () => {
      new Siteline({ websiteKey: validKey });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('track', () => {
    it('sends pageview data', async () => {
      const client = new Siteline({ websiteKey: validKey });
      const data: PageviewData = {
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: 'Mozilla/5.0',
        ref: 'https://referrer.com',
        ip: '192.168.1.1',
      };

      client.track(data);

      await jest.runAllTimersAsync();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://siteline.ai/v1/intake/pageview',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': '@siteline/core/1.0.1',
          },
          body: expect.any(String),
        })
      );
    });

    it('sanitizes URL to 2048 chars', async () => {
      const client = new Siteline({ websiteKey: validKey });
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);

      client.track({
        url: longUrl,
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.url).toHaveLength(2048);
    });

    it('normalizes method to uppercase and limits to 10 chars', async () => {
      const client = new Siteline({ websiteKey: validKey });

      client.track({
        url: 'https://example.com',
        method: 'verylongmethod',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.method).toBe('VERYLONGME');
    });

    it('clamps status to 0-999 range', async () => {
      const client = new Siteline({ websiteKey: validKey });

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 1500,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.status).toBe(999);
    });

    it('clamps duration to 0-300000 range', async () => {
      const client = new Siteline({ websiteKey: validKey });

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 500000,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.duration).toBe(300000);
    });

    it('truncates userAgent to 512 chars', async () => {
      const client = new Siteline({ websiteKey: validKey });
      const longUserAgent = 'Mozilla/5.0 ' + 'x'.repeat(1000);

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: longUserAgent,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.userAgent).toHaveLength(512);
    });

    it('truncates ref to 2048 chars', async () => {
      const client = new Siteline({ websiteKey: validKey });
      const longRef = 'https://ref.com/' + 'a'.repeat(3000);

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: longRef,
        ip: null,
      });

      await jest.runAllTimersAsync();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.ref).toHaveLength(2048);
    });

    it('truncates ip to 45 chars', async () => {
      const client = new Siteline({ websiteKey: validKey });
      const longIP = 'a'.repeat(100);

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: longIP,
      });

      await jest.runAllTimersAsync();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.ip).toHaveLength(45);
    });

    it('handles null optional fields', async () => {
      const client = new Siteline({ websiteKey: validKey });

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.userAgent).toBeNull();
      expect(body.ref).toBeNull();
      expect(body.ip).toBeNull();
    });

    it('includes SDK metadata', async () => {
      const client = new Siteline({
        websiteKey: validKey,
        sdk: '@custom/sdk',
        sdkVersion: '2.0.0',
        integrationType: 'custom-integration',
      });

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.sdk).toBe('@custom/sdk');
      expect(body.sdk_version).toBe('2.0.0');
      expect(body.integration_type).toBe('custom-integration');
    });

    it('logs success in debug mode', async () => {
      const client = new Siteline({ websiteKey: validKey, debug: true });

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      expect(consoleLogSpy).toHaveBeenCalledWith('[Siteline] Tracked:', 'https://example.com');
    });

    it('logs HTTP errors in debug mode', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const client = new Siteline({ websiteKey: validKey, debug: true });

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Siteline] HTTP error:', 500);
    });

    it('logs network errors in debug mode', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const client = new Siteline({ websiteKey: validKey, debug: true });

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Siteline] Network error:', 'Network error');
    });

    it('silently fails without debug mode', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const client = new Siteline({ websiteKey: validKey });

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('aborts request after 5 second timeout', async () => {
      let abortSignal: AbortSignal | undefined;
      fetchMock.mockImplementation((_, options) => {
        abortSignal = options?.signal;
        return new Promise(() => {}); // Never resolves
      });

      const client = new Siteline({ websiteKey: validKey });

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.advanceTimersByTimeAsync(5000);

      expect(abortSignal?.aborted).toBe(true);
    });

    it('logs track failures in the catch handler when send rejects', async () => {
      const client = new Siteline({ websiteKey: validKey, debug: true });

      // Spy on send and make it reject
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendSpy = jest.spyOn(client as any, 'send').mockRejectedValue(new Error('Send rejection'));

      client.track({
        url: 'https://example.com',
        method: 'GET',
        status: 200,
        duration: 100,
        userAgent: null,
        ref: null,
        ip: null,
      });

      await jest.runAllTimersAsync();

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Siteline] Track failed:', 'Send rejection');

      sendSpy.mockRestore();
    });
  });
});
