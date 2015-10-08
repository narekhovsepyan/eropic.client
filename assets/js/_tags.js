angular.module("app").
    factory("_tags", function () {
        var tags = {};

        function remember(obj) {
            if (obj) {
                _.each(_.toArray(obj), function (tag) {
                    if (tag.id) tags[tag.id] = tag;
                });
            }
        }

        function get(id) {
            return tags[id];
        }

        return {
            remember: remember,
            get: get
        }
    });