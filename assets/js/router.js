angular.module("app").
    constant("_vRoutes", {
        albums: {
            list: "/"
        },
        sites: {
            list: "/pages/sites.html"
        },
        api: {
            list: "/api/sites"
        }
    }).
    constant("_vParamTransformers", (function () {
        function listParamTransformer($v) {
            var f = $v.f;

            if (f) {
                var tags = f.tags;

                if (tags) {
                    if (_.isArray(tags)) {
                        f.tags = _.map(f.tags, function (tag) {
                            return parseInt(tag)
                        });
                    } else {
                        f.tags = [parseInt(tags)]
                    }
                }
            }

            return $v;
        }

        return {
            "albums.list": listParamTransformer
        }
    })()).
    config(function (_vProvider, _vParamTransformers, _vRoutes) {
        //_vProvider.setForceRefreshOnExternalUrlChange(true);
        _vProvider.setRoutes(_vRoutes);
        _vProvider.setParamTransformers(_vParamTransformers);
    }).
    run(function (_v) {
        //inject _v to init $rootScope.$v
    });