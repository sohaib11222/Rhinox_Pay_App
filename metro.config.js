const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .OTF font files
config.resolver.assetExts.push('otf', 'OTF');

module.exports = config;

