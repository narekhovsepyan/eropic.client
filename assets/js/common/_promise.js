angular.module('common').
    factory("_promise", function($timeout, $q, $rootScope) {
        var functionStub = function() {
        };

        (function () {
            var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
            window.requestAnimationFrame = requestAnimationFrame;
        })();

        var wrap = function() {
            var deferred = $q.defer();
            deferred.resolve.apply(this, arguments);
            return deferred.promise;
        };

        var stub = wrap();
        var stubFail = (function() {
            var deferred = $q.defer();
            deferred.reject();
            return deferred.promise;
        })();

        var EMPTY_STUB = function() {
            return wrap();
        };

        var sleep = function(timeout) {
            var deferred = $q.defer();

            setTimeout(function() {
                deferred.resolve();
            }, timeout || 0);

            return deferred.promise;
        };

        var sleepFunc = function(timeout) {
            return function() {
                return sleep(timeout);
            };
        };

        var tick = function(callback) {
            return $timeout(callback || functionStub);
            //window.requestAnimationFrame(function() {
            //    window.requestAnimationFrame(function() {
            //        $rootScope.$safeApply(callback);
            //    })
            //})
        };

        var chain = function(delay) {
            var chain = wrap();

            var _this = {
                then: function(promise) {
                    chain = chain.then(promise);

                    if (!_.isUndefined(delay)) {
                        chain = chain.then(sleepFunc(delay));
                    }

                    return _this;
                }
            };

            return _this;
        };

        var withDurationAtLeast = function(duration, promise) {
            if (promise) {
                return $q.all([promise, sleep(duration)]).then(function(answer) {
                    return answer[0]
                });
            } else {
                return sleep(duration);
            }
        };

        return {
            wrap: wrap,
            stub: stub,
            stubFail: stubFail,
            sleep: sleep,
            sleepFunc: sleepFunc,
            tick: tick,
            chain: chain,
            withDurationAtLeast: withDurationAtLeast,
            EMPTY_STUB: EMPTY_STUB
        }
    });