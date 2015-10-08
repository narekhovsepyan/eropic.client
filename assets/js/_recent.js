angular.module("app").
    factory("_recent", function($rootScope, _appStorage) {
        var recent = null;
        var maxItemsToRemember = 5;

        function has() {
            return !_.isEmpty(get());
        }

        function get() {
            if (!recent) {
                recent = _appStorage.get("recent");

                if (!recent) {
                    recent = [];
                }
            }

            return recent;
        }

        function add(search) {
            if (!search) return;

            recent.remove(search);
            recent.unshift(search);

            if (recent.length > maxItemsToRemember) {
                recent.length = maxItemsToRemember;
            }

            _save();
        }

        function _save() {
            _appStorage.set("recent", recent);
        }

        return {
            has: has,
            get: get,
            add: add
        }
    }).
    run(function($rootScope, _recent) {
        $rootScope.$on("search:before-query", function(e, query) {
            _recent.add(query);
        });
    });