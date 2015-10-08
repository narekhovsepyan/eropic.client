angular.module('common').
    factory("_log", function(_logLevel) {
        var _logTrace = _logLevel == "trace";
        var _logDebug = _logTrace || _logLevel == "debug";

        function debug () {
            if (_logDebug) {
                console.log(arguments);
            }
        }

        function trace() {
            if (_logTrace) {
                console.log(arguments);
            }
        }

        return {
            debug: debug,
            trace: trace,
            warn: function() {
                console.warn(arguments)
            }
        }
    });