cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-statusbar.statusbar",
      "file": "plugins/cordova-plugin-statusbar/www/statusbar.js",
      "pluginId": "cordova-plugin-statusbar",
      "clobbers": [
        "window.StatusBar"
      ]
    },
    {
      "id": "cordova-plugin-inappbrowser.inappbrowser",
      "file": "plugins/cordova-plugin-inappbrowser/www/inappbrowser.js",
      "pluginId": "cordova-plugin-inappbrowser",
      "clobbers": [
        "cordova.InAppBrowser.open"
      ]
    },
    {
      "id": "cordova-plugin-network-information.network",
      "file": "plugins/cordova-plugin-network-information/www/network.js",
      "pluginId": "cordova-plugin-network-information",
      "clobbers": [
        "navigator.connection"
      ]
    },
    {
      "id": "cordova-plugin-network-information.Connection",
      "file": "plugins/cordova-plugin-network-information/www/Connection.js",
      "pluginId": "cordova-plugin-network-information",
      "clobbers": [
        "Connection"
      ]
    },
    {
      "id": "@havesource/cordova-plugin-push.PushNotification",
      "file": "plugins/@havesource/cordova-plugin-push/www/push.js",
      "pluginId": "@havesource/cordova-plugin-push",
      "clobbers": [
        "PushNotification"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-statusbar": "4.0.0",
    "cordova-plugin-inappbrowser": "6.0.0",
    "cordova-plugin-network-information": "3.0.0",
    "@havesource/cordova-plugin-push": "4.0.1",
    "cordova-plugin-vibration": "3.1.1"
  };
});