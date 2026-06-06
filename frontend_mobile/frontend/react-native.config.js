const expoConfig = require("expo/react-native.config.js");

module.exports = {
  ...expoConfig,
  project: {
    android: {
      sourceDir: "./android",
    },
    ios: {
      sourceDir: "./ios",
    },
  },
};
