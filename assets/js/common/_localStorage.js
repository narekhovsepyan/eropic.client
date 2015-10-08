angular.module("common").
    factory("_localStorage", function(_modernizr) {
        if (_modernizr.localstorage) {
            return {
                get: function (key) {
                    var answer = localStorage[key];

                    if (!answer) {
                        return answer;
                    } else {
                        return JSON.parse(answer);
                    }
                },
                set: function (key, value) {
                    localStorage[key] = JSON.stringify(value);
                }
            }
        } else {
            var data = {};

            return {
                get: function (key) {
                    return data[key];
                },
                set: function (key, value) {
                    data[key] = value;
                }
            };
        }
    });