export const DEFAULT_SDK_NAME = '@siteline/nextjs';
export const DEFAULT_SDK_VERSION = '1.0.1';
export const DEFAULT_INTEGRATION_TYPE = 'nextjs';

export const ENV_VARS = {
  DEFAULT_WEBSITE_KEY: process.env.SITELINE_WEBSITE_KEY,
  DEFAULT_ENDPOINT: process.env.SITELINE_ENDPOINT,
  DEFAULT_DEBUG: process.env.SITELINE_DEBUG,
} as const;
