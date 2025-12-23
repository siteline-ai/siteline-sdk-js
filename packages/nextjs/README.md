# @siteline/nextjs

Official Next.js integration for automatic AI agent and bot tracking.

[![npm version](https://img.shields.io/npm/v/@siteline/nextjs.svg)](https://www.npmjs.com/package/@siteline/nextjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

## Features

- Zero-config middleware for automatic tracking
- Track bots from OpenAI, Google, Anthropic, Perplexity, and more
- Works in Edge Runtime and Node.js
- Full TypeScript support
- Compatible with App Router and Pages Router
- Extensible with custom middleware

## Installation

```bash
npm install @siteline/nextjs
```

## Quick Start

### Without Custom Proxy (ex Middleware)

```typescript
// proxy.ts
import { withSiteline } from '@siteline/nextjs';

export default withSiteline({
  websiteKey: process.env.SITELINE_WEBSITE_KEY!,
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### With Custom Proxy (ex Middleware)

```typescript
// proxy.ts
import { type SitelineConfig, withSiteline } from '@siteline/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const sitelineConfig: SitelineConfig = {
  websiteKey: process.env.SITELINE_WEBSITE_KEY!,
  debug: process.env.NODE_ENV === 'development',
}

export default withSiteline(sitelineConfig, (request: NextRequest) => {
  const response = NextResponse.next();
  response.headers.set('x-custom-header', 'value');
  return response;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `websiteKey` | `string` | Yes* | Your Siteline website key (*or set via `SITELINE_WEBSITE_KEY` env var) |
| `endpoint` | `string` | No | Custom API endpoint |
| `debug` | `boolean` | No | Enable debug logging |

## Environment Variables

```bash
# .env.local
SITELINE_WEBSITE_KEY=siteline_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SITELINE_ENDPOINT=https://api.siteline.ai/v1/intake/pageview  # Optional
SITELINE_DEBUG=true  # Optional
```

## Documentation

- [Full Documentation](https://docs.gptrends.io/agent-analytics)
- [API Reference](https://api.siteline.ai/docs)
- [GitHub Repository](https://github.com/siteline-ai/siteline-sdk-js)

## Related Packages

- [@siteline/core](https://www.npmjs.com/package/@siteline/core) - Core tracking SDK

## Support

- [GitHub Issues](https://github.com/siteline-ai/siteline-sdk-js/issues)
- Email: support@siteline.ai

## License

MIT
