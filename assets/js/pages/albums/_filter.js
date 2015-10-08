angular.module("app").
    directive("albumsFilter", function ($rootScope, _promise, _search, _filter) {
        return {
            restrict: "E",
            replace: true,
            templateUrl: "/pages/albums/_filter.html",
            scope: {},
            link: function ($scope, $element) {
                var activeFilterType = null;

                $scope.filters = {
                    age: getItems(_filter.age()),
                    sort: getItems(_filter.sort())
                };

                $scope.close = close;

                $scope.isFilterActive = function (key) {
                    return key == activeFilterType;
                };

                $rootScope.$on("albumsFilter.do:open", function (e, type) {
                    if (activeFilterType != type) {
                        if (!$scope.isDisplayed) {
                            open(type);
                        } else {
                            $scope.isChanging = true;
                            _promise.sleep(400).
                                then(function () {
                                    open(type);
                                }).
                                then(_promise.sleepFunc(50)).
                                then(function () {
                                    $scope.isChanging = false;
                                });
                        }
                    }
                });

                $rootScope.$on("albumsFilter.do:close", close);
                $rootScope.$on("search:changed", onFilterChanged);

                function getItems(items) {
                    var answer;
                    var keys = _.keys(items);
                    var total = keys.length;
                    var width = Math.floor(100 / total);
                    var widthRest = (100 - width * total);

                    answer = _.map(keys, function (key, i) {
                        return {
                            key: key,
                            title: items[key],
                            width: ((widthRest - i > 0) ? (width + 1) : width) + "%"
                        }
                    });

                    return answer;
                }

                function onFilterChanged() {
                    //dynamic part on jquery to remove angular watchers
                    _.each($element.find(".js-filter-item"), function (item) {
                        var $item = $(item);
                        var filterType = $item.data("filter-type");
                        var itemKey = $item.data("filter-item-key");

                        //update href
                        $item
                            .children("a")
                            .attr("href", _search.getUrlForChange(filterType, itemKey));

                        //update class
                        $item.toggleClass("is-active", _search.isFilterActive(filterType, itemKey));
                    });
                }

                function open(type) {
                    activeFilterType = type;
                    $rootScope.$emit("albumsFilter:set", type);

                    if (!$scope.isDisplayed) {
                        $scope.isDisplayed = true;
                        $rootScope.$emit("albumsFilter:opened", type);
                    }
                }

                function close() {
                    if ($scope.isDisplayed) {
                        $scope.isDisplayed = false;
                        $rootScope.$emit("albumsFilter:closed");

                        _promise.sleep(200).then(function () {
                            activeFilterType = null;
                        });
                    }
                }
            }
        }
    }).
    factory("_filter", function (_i18n, _env) {
        var categories = {
            '2d': "2D",
            funny: "Funny"
        };

        var sort = _getObject(_getSortFrom(), "filter.sort");
        var age = _getObject(["all", "today", "week", "month", "half_year", "year"], "filter.age");

        var byType = {
            category: categories,
            sort: sort,
            age: age
        };

        function _getObject(items, prefix) {
            var answer = {};

            _.each(items, function (item) {
                answer[item] = _i18n(prefix + "." + item);
            });

            return answer;
        }

        function _getSortFrom() {
            var answer = ["date", "views", "votes"];

            if (_env.isDev()) {
                answer.push("favourites");
            }

            return answer;
        }

        function get(from, id) {
            if (_.isUndefined(id)) {
                return from;
            } else {
                return {
                    id: id,
                    title: from[id]
                }
            }
        }

        return {
            category: function (id) {
                return get(categories, id);
            },
            sort: function (id) {
                return get(sort, id);
            },
            age: function (id) {
                return get(age, id);
            },
            isSupported: function (type, id) {
                var collection = byType[type];
                var isSupported = (collection) ? collection[id] : false;

                return !!isSupported;
            }
        }
    }).
    controller("AlbumsFilterController", function ($rootScope, $scope, _search, _filter, _gallery, _i18n) {
        $scope.root.filterLabel = _i18n("albums.filterLabel.topPage");

        (function configureFilters() {
            $scope.filterActiveType = null;

            $scope.setFilterFrom = function (type) {
                if ($scope.filterActiveType == type) {
                    $rootScope.$emit("albumsFilter.do:close");
                } else {
                    $rootScope.$emit("albumsFilter.do:open", type);
                }
            };

            $rootScope.$on("albumsFilter:set", function (e, type) {
                $scope.filterActiveType = type;
            });

            $rootScope.$on("albumsFilter:closed", function (e) {
                $scope.filterActiveType = null;
            });
        })();

        (function configureLayouts() {
            $scope.setGalleryLayout = function (layout) {
                _gallery.layout.set(layout);
            };

            $scope.getGalleryLayout = _gallery.layout.get;
        })();
    });