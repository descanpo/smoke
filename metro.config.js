const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js optionally imports @opentelemetry/api for tracing.
// Metro cannot resolve that package's extensionless ESM internals on web,
// and the app never uses tracing, so alias it to a no-op stub module.
const emptyModule = path.resolve(__dirname, 'empty-module.js');
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@opentelemetry/api' || moduleName.startsWith('@opentelemetry/')) {
    return { type: 'sourceFile', filePath: emptyModule };
  }
  const resolver = defaultResolveRequest || context.resolveRequest;
  return resolver(context, moduleName, platform);
};

module.exports = config;
