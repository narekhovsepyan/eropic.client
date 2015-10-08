angular.module("app").
    constant("_apiHost", "http://dev.eropic-front.devadmin.com").
    factory("_router", function (_apiHost) {
        var mosaicTransformer = {
            mosaiced: true,
            non_mosaiced: false,
            unsorted: null
        };

        function albumAction(code, action) {
            return _apiHost + "/api/albums/" + code + "/" + action;
        }

        function getOrderParam(sort) {
            var order = [];
            var orderField;

            if (sort == "votes") {
                orderField = "votes_positive";
            } else if (sort == "views") {
                orderField = "views_counter";
            } else if (sort == "favourites") {
                orderField = "favorites_counter";
            }

            if (orderField) {
                var orderFieldObject = {};
                orderFieldObject[orderField] = "desc";
                order.push(orderFieldObject);
            }

            order.push({"activated_on": "desc"});

            return JSON.stringify(order);
        }

        function getFromAgeValue(age) {
            var minusDays;

            if (age == "today") {
                minusDays = 1;
            } else if (age == "week") {
                minusDays = 7;
            } else if (age == "month") {
                minusDays = 31;
            } else if (age == "half_year") {
                minusDays = 182;
            } else if (age == "year") {
                minusDays = 365;
            } else {
                minusDays = 0;
            }

            var from = new Date(new Date().getTime() - minusDays * 1000 * 60 * 60 * 24);
            var fromString = from.format("yyyy-mm-dd HH:MM");

            return fromString;
        }

        function getFilterParam(filter) {
            var answer = {};

            if (filter.age) {
                answer.activated_on = {
                    from: getFromAgeValue(filter.age)
                }
            }

            return JSON.stringify(answer);
        }

        return {
            search: function (query) {
                return _apiHost + "/api/q"
            },
            track: {
                view: function (code) {
                    return albumAction(code, "views_counter");
                },
                votePositive: function (code) {
                    return albumAction(code, "votes_positive");
                },
                voteNegative: function (code) {
                    return albumAction(code, "votes_negative");
                },
                favorites: function (code) {
                    return albumAction(code, "favorites_counter");
                }
            },
            albums: function (filter) {
                if (filter) {
                    if (filter.id) {
                        return _apiHost + "/api/albums?" + $.param({filter: JSON.stringify({code: filter.id})});
                    } else {
                        var f = filter.f || {};

                        var params = {
                            offset: filter.from || 0,
                            limit: filter.limit || 20,
                            order: getOrderParam(f.sort),
                            filter: getFilterParam(f)
                        };

                        if (filter.r) params.r = filter.r;
                        if (filter.q) params.q = filter.q;

                        return _apiHost + "/api/albums?" + $.param(params)
                    }
                } else {
                    return _apiHost + "/api/albums"
                }
            },
            album: function(code, photo) {
                return "/album:" + code + "/photo:" + (photo || "1");
            },
            site: function(){
                return _apiHost + "/api/sites";
            },
            ad: {
                flightsForPlatform: function (platform) {
                    var filter = {
                        platform: (platform == "pc") ? 1 : 2 //it's a kind of magic
                    };

                    var params = {
                        filter: JSON.stringify(filter)
                    };

                    return _apiHost + "/api/flights?" + $.param(params);
                },
                flight: function (key) {
                    return _apiHost + "/api/flights/" + key + "/html"
                }
            }
        }
    }).
    factory("_albumTransformer", function (_weed, _window, _i18n) {
        var windowDimension = Math.max(_window.getWidth(), _window.getHeight());
        var blogNameStub = _i18n("album.blogNameStub");

        function getLargePositionByScreenDimension(dimensions) {
            var largeIndex = _.findIndex(dimensions, function (dimension) {
                return dimension[0] >= windowDimension || dimension[1] >= windowDimension;
            });

            return (largeIndex == -1) ? dimensions.length : largeIndex + 1;
        }

        function getLargePositionByPresenceInStorage(largePosition, photoWeed) {
            while(largePosition > 3 && ((photoWeed & Math.pow(2, largePosition - 1)) == 0)) {
                largePosition--;
            }

            return largePosition;
        }

        function getPhotoPositions(dimensions, photosWeed, index) {
            var large;

            large = getLargePositionByScreenDimension(dimensions);
            large = (photosWeed) ? getLargePositionByPresenceInStorage(large, photosWeed[index]) : large;

            return {
                mini: 1,
                medium: 2,
                large: large
            }
        }

        function getWeedVersion(photoPosition, dimensionPosition) {
            return photoPosition * 10 + dimensionPosition;
        }

        function getPhotoType(photoTypes, index) {
            var id = (photoTypes && photoTypes.length > index) ? photoTypes[index] : "j";

            if (id == "g") {
                return "gif";
            } else {
                return "jpg";
            }
        }

        function transform(album) {
            var weedData = album.images;

            return {
                id: album.code,
                title: album.name,
                sourceUrl: album.promo_url,
                blogName: album.promo_title || blogNameStub,
                description: album.description,
                votesUp: album.votes_positive,
                votesDown: album.votes_negative,
                views: album.views_counter,
                photos: _.map(album.photo_sizes, function (photo, i) {
                    var photoType = getPhotoType(album.photo_types, i);
                    var photoPositions = getPhotoPositions(album.dimensions, album.photo_weed, i);

                    return {
                        thumb: {
                            url: _weed.getUrl(weedData, photoType, getWeedVersion(i, photoPositions.mini)) //detail -> thumbnail
                        },
                        mediumUrl: _weed.getUrl(weedData, photoType, getWeedVersion(i, photoPositions.medium)), //list
                        largeUrl: _weed.getUrl(weedData, photoType, getWeedVersion(i, photoPositions.large)), //detail -> full
                        width: photo[0],
                        height: photo[1],
                        type: photoType
                    }
                })
            }
        }

        return {
            transform: transform
        }
    }).
    factory("_flightTransformer", function (_router) {
        function transform(flight) {
            return {
                key: flight.flight_name,
                width: flight.width,
                height: flight.height,
                url: _router.ad.flight(flight.flight_name)
            }
        }

        return {
            transform: transform
        }
    });
