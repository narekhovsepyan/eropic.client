angular.module("app").
    factory("_appStorage", function(_localStorage) {
        return {
            get: function (key) {
                return _localStorage.get("pix." + key);
            },
            set: function (key, value) {
                _localStorage.set("pix." + key, value);
            }
        }
    });