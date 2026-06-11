const appJson = require("./app.json");

const googleMapsApiKey = String(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      config: {
        ...(appJson.expo.android?.config || {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...appJson.expo.ios,
      config: {
        ...(appJson.expo.ios?.config || {}),
        googleMapsApiKey,
      },
    },
    extra: {
      ...(appJson.expo.extra || {}),
      googleMapsApiKey,
    },
  },
};
