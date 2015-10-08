angular.module("common").
    factory("_screenfull", function() {
        var s = window.screenfull;
        var stub = function() {

        };

        if (s.enabled) {
            return s;
        } else {
            return {
                enabled: false,
                exit: stub,
                toggle: stub
            }
        }
    });