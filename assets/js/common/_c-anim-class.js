angular.module("common")
    .directive('cAnimClass', function($timeout, _promise) {
        return {
            restrict: 'A',
            link: function($scope, $element, attr) {
                var initialized = false;
                var chains = {};

                $scope.$watch(attr.cAnimClass, function(curr, prev) {
                    if (curr) {
                        var keys = _.keys(curr);

                        _.each(keys, function(key) {
                            var valueCurr = curr[key];
                            var valuePrev = prev[key];

                            if (valueCurr != valuePrev || !initialized) {
                                if (valueCurr) {
                                    enable(key, !initialized);
                                } else {
                                    if (initialized) disable(key);
                                }
                            }
                        });

                        initialized = true;
                    }
                }, true);

                function enable(clazz, disableAnimation) {
                    getChainFor(clazz).then(function() {
                        var promise = null;

                        $element.addClass(clazz);

                        if (disableAnimation) {
                            $element.addClass(clazz + '-active');
                        } else {
                            promise = $timeout(function() {
                                $element.addClass(clazz + '-active');
                            }, 16);
                        }

                        return promise;
                    });
                }

                function disable(clazz) {
                    getChainFor(clazz).then(function() {
                        $element.removeClass(clazz + '-active');

                        return $timeout(function() {
                            $element.removeClass(clazz);
                        }, 300);
                    });
                }

                function getChainFor(clazz) {
                    var chain = chains[clazz];

                    if (!chain) {
                        chain = _promise.chain();
                        chains[clazz] = chain;
                    }

                    return chain;
                }
            }
        }
    });