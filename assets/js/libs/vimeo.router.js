(function (_v) {
    _v.Router = function (mapper, routes) {
        var router = new RouteRecognizer();
        var _routes = _v.utils.flatten(routes);

        _v.utils.forEach(_routes, function (route, url) {
            router.add([{path: url, handler: route}]);
        });

        return {
            getUrl: function (path, params, vimeo) {
                var url = _routes[path];

                if (url) {
                    if (params) {
                        _v.utils.forEach(params, function(param, value) {
                            url = url.replace(":" + param, encodeURIComponent(value));
                        })
                    }

                    if (vimeo) {
                        url = ((_v.utils.endsWith(url, "/")) ? url : (url + "/")) + mapper.objectToUrl(vimeo);
                    }

                    return url;
                } else {
                    throw new Error("Unknown route with path " + path);
                }
            },
            recognize: function (url) {
                var answer = router.recognize(_v.utils.url.getPath(url));

                if (answer && answer.length) {
                    return {path: answer[0].handler, params: answer[0].params};
                } else {
                    return null;
                }
            }
        }
    }
})(window._v);