angular.module("app").
    factory("_albumsApi", function ($http, _router, _log) {
        function query(searchParams) {
            _log.debug("Query", searchParams);

            return $http.get(_router.albums(searchParams))
        }

        function queryAndParse(query) {
            _log.debug("Query and parse", query);

            return $http.get(_router.albums({q: query}))
        }

        function get(id) {
            return $http.get(_router.albums({id: id}))
        }

        function track(code, routerKey) {
            return $http.post(_router.track[routerKey](code));
        }

        return {
            get: get,
            query: query,
            queryAndParse: queryAndParse,
            track: track
        };
    }).
    factory("_albums", function (_albumTransformer, _albumsApi, _promise) {
        var cache = {};

        var transform = function (album) {
            album = _albumTransformer.transform(album);

            cache[album.id] = album;

            return album;
        };

        function transformAlbumsAndReturnData(response) {
            response.data.albums = _.map(response.data.data, transform);
            response.data.data = null;

            return response.data;
        }

        function track(code, routerKey) {
            return _albumsApi.track(code, routerKey)
        }

        return {
            query: function (searchParams) {
                return _albumsApi.query(searchParams).then(transformAlbumsAndReturnData);
            },
            queryAndParse: function (query) {
                return _albumsApi.queryAndParse(query).then(transformAlbumsAndReturnData);
            },
            get: function (id) {
                var cached = cache[id];

                if (cached) {
                    return _promise.wrap(cached);
                } else {
                    return _albumsApi.get(id).then(function (response) {
                        return transformAlbumsAndReturnData(response).albums[0];
                    })
                }
            },
            track: {
                view: function (code) {
                    return track(code, "view");
                },
                vote: function (code, positive) {
                    return track(code, (positive) ? "votePositive" : "voteNegative");
                },
                favorites: function (code) {
                    return track(code, "favorites");
                }
            }
        }
    });