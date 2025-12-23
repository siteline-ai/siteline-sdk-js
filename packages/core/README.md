# @siteline/core

Core Siteline tracking SDK for monitoring AI agents, bots, and crawlers across your web applications.

[![npm version](https://img.shields.io/npm/v/@siteline/core.svg)](https://www.npmjs.com/package/@siteline/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Features

- Track bots from OpenAI, Google, Anthropic, Perplexity, and more
- Full TypeScript support with exported types
- Works in Node.js, Edge runtimes, and browsers
- Automatic data sanitization and validation

## Installation

```bash
npm install @siteline/core
```

## Quick Start

```typescript
import { Siteline } from '@siteline/core';

const siteline = new Siteline({
  websiteKey: 'siteline_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
});

siteline.track({
  url: '/api/users',
  method: 'GET',
  status: 200,
  duration: 125,
  userAgent: request.headers['user-agent'],
  ref: request.headers['referer'],
  ip: request.ip,
});
```

## API Reference

### Constructor

```typescript
new Siteline(config: SitelineConfig)
```

**Configuration Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `websiteKey` | `string` | Yes | Your Siteline website key |
| `endpoint` | `string` | No | Custom API endpoint (default: https://api.siteline.ai/v1/intake/pageview) |
| `debug` | `boolean` | No | Enable debug logging (default: false) |

### track()

```typescript
siteline.track(data: PageviewData)
```

**Pageview Data:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | Yes | Request URL path |
| `method` | `string` | Yes | HTTP method |
| `status` | `number` | Yes | HTTP status code |
| `duration` | `number` | Yes | Request duration in milliseconds |
| `userAgent` | `string \| null` | Yes | User-Agent header |
| `ref` | `string \| null` | Yes | Referer header |
| `ip` | `string \| null` | Yes | Client IP address |

## Framework Integrations

For framework-specific integrations with automatic tracking:

- **[@siteline/nextjs](https://www.npmjs.com/package/@siteline/nextjs)** - Next.js middleware integration

## Documentation

- [Full Documentation](https://docs.gptrends.io/agent-analytics)
- [API Reference](https://api.siteline.ai/docs)
- [GitHub Repository](https://github.com/siteline-ai/siteline-sdk-js)

## Support

- [GitHub Issues](https://github.com/siteline-ai/siteline-sdk-js/issues)
- Email: support@siteline.ai

## License

MIT
