angular.module("app").
    directive("search", function ($rootScope, _search, _searchUi, _searchActive) {
        return {
            restrict: "E",
            templateUrl: "/common/_search.input.html",
            replace: true,
            link: function ($scope, $element) {
                $scope.search = {
                    open: _searchActive.open,
                    isEmpty: _search.isEmpty
                };

                $scope.remove = function (e, item) {
                    e.stopPropagation();

                    _search.remove(item.type, item.originalItem);
                };

                $rootScope.$on("search.ui:changed", function updateSearchUi() {
                    var search = _searchUi.get();

                    $scope.items = search.items;
                    $scope.q = search.q;
                });
            }
        }
    }).
    directive("searchSpinner", function (_search) {
        return {
            restrict: "A",
            link: function ($scope, $element) {
                $scope.$watch(_search.isQuerying, function (current, prev) {
                    if (current != prev) {
                        $element.toggleClass('is-loading', (function () {
                            return current && _search.getChanges() != "page";
                        })());
                    }
                });
            }
        }
    }).
    factory("_SearchState", function(_utils) {
        function SearchState(_scope) {
            function remove(type, item) {
                _utils.ref(_scope.$v, type, function (obj, property) {
                    if (_.isArray(obj[property])) {
                        obj[property].remove(item);
                    } else {
                        delete obj[property];
                    }
                });

                _onFilterChange(type);
            }

            function changeFilter(type, item) {
                var $v = _scope.$v;

                if (_isDefaultFilterValue(type, item)) {
                    if ($v.f) {
                        delete $v.f[type];
                    }
                } else {
                    $v.f = $v.f || {};
                    $v.f[type] = item;
                }

                _onFilterChange(type);
            }

            function get() {
                return {
                    f: _getF(),
                    page: getPage(),
                    _q: getQ()
                };
            }

            function set(state) {
                if (state.page) {
                    _scope.$v.page = state.page;
                }

                if (state.f) {
                    _scope.$v.f = state.f;
                }

                if (state._q) {
                    _scope.$v._q = state._q;
                }
            }

            function getPage() {
                return parseInt(_scope.$v.page) || 1
            }

            function toQuery() {
                return getQ(); //todo implement
            }

            function setPage(page) {
                _scope.$v.page = page;
            }

            function isFirstPage() {
                return getPage() == 1;
            }

            function _resetPage() {
                delete _scope.$v.page;
            }

            function isEmpty() {
                return !getQ() && _.isEmpty(_scope.$v.f);
            }

            function isFilterActive(type, item) {
                var activeValue = _getF()[type];

                if (_isDefaultFilterValue(type, item)) {
                    return !activeValue;
                } else {
                    return activeValue == item;
                }
            }

            function _getDefaultValueFor(type) {
                if (type == "f.sort") {
                    return "date";
                } else {
                    return "all";
                }
            }

            function getSearchKey() {
                var obj = {
                    q: getQ(),
                    page: getPage()
                };

                _.each(_getF(), function (value, key) {
                    obj["f." + key] = value;
                });

                return JSON.stringify(obj);
            }

            function getQ() {
                return _scope.$v._q;
            }

            function setQ(q) {
                if (q) {
                    _scope.$v._q = q;
                } else {
                    delete _scope.$v._q;
                }

                _onFilterChange("q");
            }

            function _getF() {
                return _scope.$v.f || {};
            }

            function _isDefaultValue(type, item) {
                return item == _getDefaultValueFor(type);
            }

            function _isDefaultFilterValue(type, item) {
                return _isDefaultValue("f." + type, item);
            }

            function _onFilterChange(type) {
                if (type != "page") {
                    delete _scope.$v.page;
                }
            }

            function copy() {
                return new SearchState({$v: angular.copy(_scope.$v)});
            }

            return {
                isFilterActive: isFilterActive,
                isEmpty: isEmpty,
                isFirstPage: isFirstPage,
                get: get,
                getPage: getPage,
                getQ: getQ,
                getSearchKey: getSearchKey,
                toQuery: toQuery,
                copy: copy,
                set: set,
                setPage: setPage,
                setQ: setQ,
                changeFilter: changeFilter,
                remove: remove
            }
        }

        return SearchState;
    }).
    factory("_searchStateCurrent", function($rootScope, _SearchState) {
        var remembered = null;
        var searchState = new _SearchState($rootScope);

        function get() {
            return searchState;
        }

        function remember() {
            remembered = searchState.get();
        }

        function getRemembered() {
            return remembered;
        }

        function restore() {
            if (remembered) {
                searchState.set(remembered);
                remembered = null;
            }
        }

        return {
            get: get,
            remember: remember,
            getRemembered: getRemembered,
            restore: restore
        }
    }).
    factory("_search", function ($rootScope, _searchStateCurrent, _promise, _albums, _albumFullState, _tags, _filter, _v, _page, _log) {
        var _isQuerying = 0;
        var _changes = null;
        var _lastSearchKey = null;
        var _searchState = _searchStateCurrent.get();

        function getUrlFor(params) {
            var url;

            if (!params) {
                url = "/";
            } else {
                url = _v.getUrl({v: params});
            }

            return url;
        }

        function getUrlForChange(type, item) {
            var _changedState = _searchState.copy();

            _changedState.changeFilter(type, item);

            return getUrlFor(_changedState.get());
        }

        function initRouting() {
            var chain = _promise.chain();

            _v.onChangeAndTrigger(function(current, prev) {
                chain.then(function() {
                    return _processSearchChange("$v");
                });
            });
        }

        function query(query) {
            _changes = "q";

            $rootScope.$emit("search:before-query", query);

            return _queryAndProcessResponse({r: query}, true);
        }

        function _processSearchChange(change) {
            if (_albumFullState.has()) {
                //special case - disable list page when album full is opened
            } else {
                var keyLast = _lastSearchKey;
                var keyCurrent = _searchState.getSearchKey();

                if (keyLast != keyCurrent) {
                    _log.debug("Last key (" + keyLast + ") != current key (" + keyCurrent + "). Processing " + change + " change", keyLast, keyCurrent);

                    _changes = change;
                    _lastSearchKey = keyCurrent;
                    _remembered = null;

                    return _queryAndProcessResponse(_getParamsToQuery());
                }
            }
        }

        function _queryAndProcessResponse(params, setSearchFromResponse) {
            _isQuerying++;

            params.limit = _page.getAlbumsPerPage();
            params.q = params._q;

            return _albums.query(params).then(function (data) {
                if (setSearchFromResponse) {
                    _setSearchFromResponse(data.search);
                }

                _onSearchResponse(data);

                _isQuerying--;

                return data;
            });
        }

        function _setSearchFromResponse(search) {
            var isLoadFilterDataFromResponse = false; //todo

            if (search) {
                var filter = search.filter;

                if (filter) {
                    _searchState.setQ(filter.q);
                }

                (function loadFilterDataFromResponse() {
                    if (isLoadFilterDataFromResponse) {
                        var f = {};
                        var page;

                        if (filter) {
                            page = _page.getPage(search.from);

                            var addParam = function(name) {
                                if (filter[name]) f[name] = filter[name];
                            };

                            _.each(["category", "age", "tags"], addParam);
                        }

                        (function extractSortParam() {
                            if (_.isArray(search.sort) && search.sort.length) {
                                var obj = search.sort[0];
                                var sort = (obj) ? _.keys(obj)[0] : null;

                                if (sort && _filter.isSupported("sort", sort)) {
                                    f.sort = sort;
                                }
                            }
                        })();

                        //todo replace it with searchState
                        $rootScope.$v = {
                            f: f,
                            page: page
                        };
                    }
                })();

                _lastSearchKey = _searchState.getSearchKey();
            }
        }

        function _getParamsToQuery() {
            var params = _searchState.get();

            params.album = _albumFullState.getAlbumId();
            params.from = _page.getFrom(params.page);

            return params;
        }

        function _onSearchResponse(data) {
            _tags.remember(data.tags);

            $rootScope.$broadcast("search:changed", data);
        }

        function isQuerying() {
            return !!_isQuerying;
        }

        function getChanges() {
            return _changes;
        }

        function setNextPage() {
            return _setPage(_searchState.getPage() + 1);
        }

        function _setPage(page) {
            _searchState.setPage(page);

            return _processSearchChange("page");
        }

        return {
            get: _searchState.get,
            getPage: _searchState.getPage,
            getChanges: getChanges,
            getUrlFor: getUrlFor,
            getUrlForChange: getUrlForChange,

            isQuerying: isQuerying,
            isEmpty: _searchState.isEmpty,
            isFilterActive: _searchState.isFilterActive,
            isFirstPage: _searchState.isFirstPage,

            toQuery: _searchState.toQuery,
            remove: _searchState.remove,
            query: query,
            changeFilter: _searchState.changeFilter,
            setNextPage: setNextPage,
            initRouting: initRouting
        }
    }).
    run(function (_search) {
        _search.initRouting();
    }).
    factory("_searchUi", function ($rootScope, _search, _filter, _tags, _log) {
        var _ui = {};

        var classesByType = {
            "f.category": "category",
            "f.sort": "filter",
            "f.age": "filter",
            "f.mosaic": "filter"
        };

        var iconsByType = {
            "f.category": "fa fa-bookmark",
            "f.sort": "fa fa-sort",
            "f.age": "fa fa-clock-o",
            "f.mosaic": "fa fa-qrcode"
        };

        function _updateUi() {
            var search = _search.get();
            var f = search.f;
            var items = [];

            var add = function (type, originalItem, displayItem) {
                if (!originalItem) {
                    _log.warn("Undefined search item of type " + type);
                } else {
                    var icon = iconsByType[type];
                    var clazz = classesByType[type];

                    items.push({
                        type: type,
                        icon: icon,
                        class: clazz,
                        originalItem: originalItem,
                        displayItem: displayItem || originalItem
                    });
                }
            };

            if (f.category) add("f.category", f.category, _filter.category(f.category));
            if (f.tags) {
                _.each(f.tags, function (tag) {
                    add("f.tags", tag, _tags.get(tag));
                });
            }

            if (f.sort) add("f.sort", f.sort, _filter.sort(f.sort));
            if (f.age) add("f.age", f.age, _filter.age(f.age));

            _ui = {
                q: search._q,
                items: items
            };

            $rootScope.$emit("search.ui:changed", _ui);
        }

        (function updateOnSearchChange() {
            $rootScope.$on("search:changed", _updateUi);
        })();

        return {
            get: function () {
                return _ui;
            }
        }
    }).
    factory("_searchActive", function (_fullScreen) {
        function open() {
            _fullScreen.open("search");
        }

        function close() {
            _fullScreen.close();
        }

        function isOpened() {
            return _fullScreen.isEnabled("search");
        }

        return {
            open: open,
            close: close,
            isOpened: isOpened
        }
    }).
    directive("searchActive", function ($rootScope, _searchActive) {
        return {
            restrict: "E",
            templateUrl: "/common/_search.active.html",
            replace: true,
            link: function ($scope, $element) {
                $scope.isOpened = _searchActive.isOpened;
            }
        }
    }).
    controller("SearchActiveController", function ($scope, _search, _searchActive, _recent) {
        $scope.query = _search.toQuery();
        $scope.isOpened = _searchActive.isOpened;
        $scope.close = _searchActive.close;

        $scope.reset = function () {
            $scope.query = '';
            $scope.$broadcast("search-active:focus");
        };

        $scope.recent = {
            has: _recent.has(),
            items: _recent.get()
        };

        $scope.submit = function () {
            searchAndClose($scope.query);
        };

        $scope.submitQuery = function(query) {
            searchAndClose(query);
        };

        function searchAndClose(query) {
            _search.query(query);
            _searchActive.close();
        }
    });