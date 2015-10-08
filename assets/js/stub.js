angular.module('app')
    .config(function ($provide) {
        $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
    })
    .factory("_stub", function (_utils) {
        var albums = [
            {
                title: Math.random().toString(36).slice(2),
                votes: {
                    up: _utils.getRandomInt(0, 100),
                    down: _utils.getRandomInt(0, 100)
                },
                views: _utils.getRandomInt(0, 5000),
                code: "sjzf2ws8kdxz85mi asd asd asdas dasd asdas dasdasdasd",
                photo_sizes: [[500, 375], [1704, 2560], [2560, 1707], [500, 726], [500, 536], [500, 716], [500, 721], [500, 667], [1707, 2560], [1707, 2560], [1707, 2560], [2560, 1707], [1920, 1080], [1920, 1080], [2037, 2560], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [2560, 1707], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [2560, 1705], [2560, 1705], [1920, 1080], [2560, 1707], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [1920, 1080], [2560, 1705], [1920, 1080], [1920, 1080], [500, 714]]
            },
            {
                title: Math.random().toString(36).slice(2),
                votes: {
                    up: _utils.getRandomInt(0, 100),
                    down: _utils.getRandomInt(0, 100)
                },
                views: _utils.getRandomInt(0, 5000),
                code: "OHhkwhbBga0F8hLImKIpcsvxYzNodmbr",
                photo_sizes: [[500, 500], [800, 1005], [1280, 820], [960, 1160], [600, 900], [600, 900], [825, 1024], [690, 900], [455, 437], [500, 500], [643, 800], [832, 1109], [805, 1000], [990, 675], [600, 902], [630, 910], [600, 900], [710, 935]]
            },
            {
                title: Math.random().toString(36).slice(2),
                votes: {
                    up: _utils.getRandomInt(0, 100),
                    down: _utils.getRandomInt(0, 100)
                },
                views: _utils.getRandomInt(0, 5000),
                code: "251Ad2TiYMQX1fZyTo1JqO19FLJUbdrS",
                photo_sizes: [[990, 1237], [994, 1243], [853, 1280], [799, 1200], [853, 1280], [600, 800], [1280, 845], [931, 1280], [667, 1000], [800, 1244], [887, 1280], [1846, 1365], [1280, 816], [848, 1178], [480, 640], [1920, 1080], [853, 1220], [1000, 660], [853, 1280], [600, 800], [1080, 1540], [1000, 720], [867, 1280], [1320, 876], [1320, 876], [636, 795], [716, 1024], [570, 760], [1024, 682], [850, 1220]]
            }
        ];

        var search = {
            f: {
                category: "2d",
                sort: "views",
                age: "today",
                tags: [1, 2]
            },
            q: "Hello custom search as asd asdas dasd asds ad"
        };

        var tags = [
            {
                id: 1,
                title: "Boobs"
            },
            {
                id: 2,
                title: "Anal"
            }
        ];

        var ads = [
            {
                width: 376,
                height: 250,
                weight: 2
            },
            {
                width: 376,
                height: 152,
                weight: 3
            },
            {
                width: 183,
                height: 152,
                weight: 1
            },
            {
                width: 728,
                height: 90,
                weight: 3
            },
            {
                width: 1006,
                height: 125,
                weight: 1
            },
            {
                width: 500,
                height: 125,
                weight: 1
            }
        ];

        _.each(ads, function(ad) {
            ad.code = '<img src="http://placehold.it/' + ad.width + 'x' + ad.height + '">'
        });

        return {
            albums: albums,
            search: search,
            tags: tags,
            ads: ads
        }
    }).
    factory("_router", function() {
        return {
            search: function (query) {
                return "/api/q"
            },
            albums: function (filter) {
                if (filter) {
                    if (filter.id) {
                        return "/api/albums/1"; //+ filter.id
                    } else {
                        return "/api/albums"
                    }
                } else {
                    return "/api/albums"
                }
            },
            ads: function(adflight) {
                return "/ads/" + adflight;
            }
        }
    }).
    factory("_albumTransformer", function() {
        var id = 1;

        return {
            transform: function(album) {
                album.photos = _.map(album.photo_sizes, function(photo, i) {
                    return {
                        //img: "http://pfile12.asg.to/view/" + code + "?p=" + i + "&s=700x0",
                        img: "http://placehold.it/" + photo[0] + "x" + photo[1],
                        thumb: {
                            //url: "http://pfile12.asg.to/view/" + code + "?p=" + i + "&s=700x0"
                            url: "http://placehold.it/" + photo[0] + "x" + photo[1]
                        },
                        width: photo[0],
                        height: photo[1]
                    }
                });

                if (!album.id) {
                    album.id = id;
                    id++;
                }

                return album;
            }
        }
    }).
    config(function($provide) {
        //https://endlessindirection.wordpress.com/2013/05/18/angularjs-delay-response-from-httpbackend/
        $provide.decorator('$httpBackend', function($delegate) {
            var proxy = function(method, url, data, callback, headers) {
                var interceptor = function() {
                    var _this = this,
                        _arguments = arguments;
                    setTimeout(function() {
                        callback.apply(_this, _arguments);
                    }, 700);
                };
                return $delegate.call(this, method, url, data, interceptor, headers);
            };
            for(var key in $delegate) {
                proxy[key] = $delegate[key];
            }
            return proxy;
        });
    })
    .run(function ($httpBackend, _router, _stub) {
        $httpBackend.whenGET(_router.albums()).respond({
            data: _stub.albums,
            totalCount: 15
        });
        $httpBackend.whenGET(_router.albums({id: 1})).respond(_stub.albums[0]);
        $httpBackend.whenGET(_router.search()).respond({
            albums: _stub.albums,
            search: _stub.search,
            tags: _stub.tags,
            total: 12555
        });
        $httpBackend.whenGET(_router.ads("list")).respond(_stub.ads);
        $httpBackend.whenGET(/(.*)\.html/).passThrough();
    });