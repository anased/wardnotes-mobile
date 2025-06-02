// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'expo-crypto',
  stream: 'stream-browserify',
  http: 'stream-http',
  https: 'https-browserify',
  util: 'util',
  url: 'url',
  buffer: 'buffer',
  process: 'process/browser',
  events: 'events',
  assert: 'assert',
  querystring: 'querystring-es3',
  path: 'path-browserify',
  // Block problematic modules
  fs: false,
  net: false,
  tls: false,
  child_process: false,
  dgram: false,
  dns: false,
  'react-native-tcp': false,
  ws: false,
  // Block the realtime module entirely
  '@supabase/realtime-js': false,
};

// Block specific modules from being bundled
config.resolver.blockList = [
  /node_modules\/ws\/.*/,
  /node_modules\/@supabase\/realtime-js\/.*/,
];

// Add source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;