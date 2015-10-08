angular.module("app").
    factory("_oldBrowser", function(_notification, _appStorage, _modernizr) {
        function isOldBrowser() {
            return !_modernizr.history;
        }

        function checkBrowserAndDisplayNotification() {
            if (isOldBrowser() && !_appStorage.get("old-browser-notification")) {
                _notification.translateAndNotify("other.notification.oldBrowser");
                _appStorage.set("old-browser-notification", "1");
            }
        }

        return {
            checkBrowserAndDisplayNotification: checkBrowserAndDisplayNotification
        }
    }).
    run(function(_oldBrowser) {
        _oldBrowser.checkBrowserAndDisplayNotification();
    });