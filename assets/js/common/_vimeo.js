angular.module("common").
    config(function($locationProvider) {
        $locationProvider
            .html5Mode(true)
            .hashPrefix('!');
    }).
    provider("_v", function () {
        var mapperParams = null;
        var routerRoutes = null;
        var forceRefreshOnExternalUrlChange = false;
        var paramTransformers = {};
        var vimeoDefaultValues = {};
        var __v = window._v;
        var __vUtils = __v.utils;
        var replaceLocation = false;

        var _v = function (_log, _vMapper, _vRouter, $rootScope, $location, $timeout) {
            var initializing = true;
            var _route, _path;

            var _this = {};
            var _listeners = [];
            var _urlChangeState = {};

            (function onVimeoChange() {
                $rootScope.$watch("$v", function (current, prev) {
                    _this.$v = current;

                    if (initializing) {
                        initializing = false;
                    } else {
                        if (prev) {
                            var urlChangeEvent;
                            var pathAndQuery = getUrlFromVimeo(_route, $rootScope.$v);

                            _urlChangeState.oldUrl = $location.absUrl();
                            _urlChangeState.pathAndQuery = pathAndQuery;

                            $location.url(pathAndQuery);

                            if (replaceLocation) {
                                $location.replace();
                                replaceLocation = false;

                                urlChangeEvent = "_v.url:replace";
                            } else {
                                urlChangeEvent = "_v.url:set";
                            }

                            $timeout(function() {
                                $rootScope.$emit(urlChangeEvent, pathAndQuery);
                            })
                        }

                        _listeners.forEach(function (listener) {
                            listener(current, prev);
                        });
                    }
                }, true);
            })();

            (function onLocationChange() {
                $rootScope.$on('$locationChangeSuccess', function(e, newUrl, oldUrl) {
                    //slightly dirty way to detect source of $locationChangeSuccess event
                    //it may be result of onVimeoChange or external change (back/forward button)
                    if (newUrl == oldUrl) {
                        //skip
                    } else if (oldUrl == _urlChangeState.oldUrl && __vUtils.parseURL(newUrl).pathAndQuery == _urlChangeState.pathAndQuery) {
                        //do nothing - this is result of $location.path change
                    } else {
                        //update state
                        _this.change({href: newUrl});
                    }
                });
            })();

            (function getInitialParams(href) {
                _route = _vRouter.recognize(href);

                if (!_route) {
                    _log.warn("Unable to detect route for url " + href);
                    _route = {};
                }

                _path = __vUtils.url.getPath(href);
                setV(getVimeoFromUrl(href));
            })(window.location.href);


            //(function updateStateOrOpenPage() {
            //    History.Adapter.bind(window, 'statechange', function () { // Note: We are using statechange instead of popstate
            //        var State = History.getState(); // Note: We are using History.getState() instead of event.state
            //    });
            //})();

            _this.onChangeAndTrigger = function (listener) {
                _listeners.push(listener);
                listener($rootScope.$v, {});
            };

            _this.change = function (changes) {
                var href =  _this.getUrl(changes);

                if (forceRefreshOnExternalUrlChange || __vUtils.url.getPath(href) != _path) {
                    window.location.href = href; //another route
                    window.location.reload(true); //force refresh on hash only change
                } else {
                    setV(getVimeoFromUrl(href));
                }
            };

            _this.replace = function(changes) {
                replaceLocation = true;

                _this.change(changes);

                $timeout(function() {
                    //set to false since $v may not changed
                    replaceLocation = false;
                });
            };

            _this.getUrl = function (changes) {
                if (changes.href) {
                    return changes.href;
                } else {
                    return getUrlFromVimeo(changes.route, getChangedVimeo(changes))
                }
            };

            _this.$watch = function(callback) {
                $rootScope.$watch("$v", callback, true);
            };

            _this.getRoute = function() {
                return _route;
            };

            _this.getParam = function(key) {
                if (_route.params) {
                    return _route.params[key];
                } else {
                    return undefined;
                }
            };

            function setV($v) {
                $rootScope.$v = $v;
                _this.$v = $v;
            }

            function getChangedVimeo(changes) {
                var current = $rootScope.$v;

                if (changes.v) {
                    return changes.v;
                } else if (changes.set) {
                    return angular.extend({}, current, angular.copy(changes.set));
                } else {
                    return null;
                }
            }

            function getVimeoFromUrl(url) {
                var answer;
                var route = _vRouter.recognize(url);
                var params = _vMapper.urlToObject(url);
                var defaults = getDefaultVimeoValuesForUrl(route);
                var paramTransformer = getParamTransformer(route);

                answer = angular.extend({}, angular.copy(defaults), params);
                answer = paramTransformer(answer);

                return answer;
            }

            function getUrlFromVimeo(route, vimeo) {
                if (!route) route = _route;

                return _vRouter.getUrl(route.path, route.params, vimeo);
            }

            function getDefaultVimeoValuesForUrl(route) {
                var defaults = null;

                if (route) {
                    defaults = vimeoDefaultValues[route.path];
                }

                return defaults || {};
            }

            function getParamTransformer(route) {
                var transformer = (route) ? paramTransformers[route.path] : null;

                if (_.isFunction(transformer)) {
                    return transformer;
                } else {
                    return _defaultParamTransformer;
                }
            }

            function _defaultParamTransformer($v) {
                return $v;
            }

            return _this;
        };

        var _this = {
            setMapperParams: function (params) {
                mapperParams = params;
            },
            setRoutes: function (routes) {
                routerRoutes = routes;
            },
            setParamTransformers: function(transformers) {
                paramTransformers = transformers || {};
            },
            setForceRefreshOnExternalUrlChange: function(refreshOnExternalUrlChange) {
                forceRefreshOnExternalUrlChange = refreshOnExternalUrlChange;
            },
            setVimeoDefaultValues: function (defaultValues) {
                angular.extend(vimeoDefaultValues, defaultValues);
            },
            $get: function (_log, $rootScope, $location, $timeout) {
                var mapper = new __v.Mapper(mapperParams);
                var router = new __v.Router(mapper, routerRoutes);

                return new _v(_log, mapper, router, $rootScope, $location, $timeout);
            }
        };

        return _this;
    }).
    directive('vHref', function (_v, $rootScope, $location) {
        return {
            restrict: 'A',
            scope: {
                vHref: "="
            },
            link: function ($scope, $element, attrs) {
                $element.on('click', function (e) {
                    e.preventDefault();

                    if (attrs.vHrefBeforeClickEvent) {
                        $rootScope.$emit(attrs.vHrefBeforeClickEvent);
                    }

                    $rootScope.$safeApply(function () {
                        $location.url($element.attr('href'));
                    })
                });

                if (!_.isUndefined(attrs.vHrefWatch)) {
                    $scope.$watch("vHref", updateUrl);
                }

                _v.$watch(updateUrl);

                function updateUrl() {
                    $element.attr('href', _v.getUrl($scope.vHref));
                }
            }
        }
    });