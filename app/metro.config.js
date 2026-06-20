const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// zustand's ESM build contains a bare `import.meta` reference that breaks
// non-module <script> bundles on web. Force its package.json "exports" map
// to resolve through the "require" condition (CJS, no import.meta) instead
// of "import" (ESM) for every platform.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    return context.resolveRequest({ ...context, isESMImport: false }, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
