angular.module("app").
    factory("_adApi", function ($http, _router) {
        function listFlightsForPlatform(platform) {
            return $http.get(_router.ad.flightsForPlatform(platform));
        }

        return {
            listFlightsForPlatform: listFlightsForPlatform
        }
    }).
    factory("_ad", function (_adApi, _gallery, _flightTransformer, _platform) {
        var listRowsPerAd = 3;
        var flightsForCurrentPlatform = null;

        function isDisplayListAd(index) {
            return index % (_gallery.getAlbumsPerRow() * listRowsPerAd) == 0 && index != 0;
        }

        function selectFlightsForWidth(startsWith, width) {
            return _listFlightsForCurrentPlatform().then(function (flights) {
                return _.filter(flights, function (flight) {
                    return flight.key.startsWith(startsWith) && _isFlightFits(flight, width);
                });
            });
        }

        function _listFlightsForCurrentPlatform() {
            if (!flightsForCurrentPlatform) {
                flightsForCurrentPlatform = _adApi.listFlightsForPlatform(_platform.get()).then(function (response) {
                    return _.map(response.data.data, _flightTransformer.transform);
                });
            }

            return flightsForCurrentPlatform;
        }

        function _isFlightFits(flight, width) {
            return !flight.width || flight.width <= width;
        }

        return {
            selectFlightsForWidth: selectFlightsForWidth,
            list: {
                isDisplay: isDisplayListAd
            }
        }
    }).
    directive("cAdList", function ($rootScope, _ad, _gallery, _window) {
        var containerWidth;
        var flights = null;
        var flightsTotal = 0;
        var i = 0;

        _updateContainerWidthAndRefreshFlights();

        _window.on("resize", _updateContainerWidthAndLoadFlights);
        _window.on("orientationchange", _updateContainerWidthAndRefreshFlights);

        function _updateContainerWidth() {
            containerWidth = _gallery.getRowWidth();
        }

        function _loadFlights() {
            return _ad
                .selectFlightsForWidth("albums.list", containerWidth)
                .then(function (_flights) {
                    flights = _flights;
                    flightsTotal = flights.length;
                });
        }

        function _refreshFlights() {
            $rootScope.$emit("cAdList:refresh")
        }

        function _loadFlightsAndRefreshCurrent() {
            _loadFlights().then(_refreshFlights);
        }

        function _updateContainerWidthAndLoadFlights() {
            _updateContainerWidth();
            _loadFlights();
        }

        function _updateContainerWidthAndRefreshFlights() {
            _updateContainerWidth();
            _loadFlightsAndRefreshCurrent();
        }

        return {
            restrict: "E",
            replace: true,
            template: '<div class="m-ad ng-hide">' +
            '<iframe class="m-ad--item" scrolling="no" marginheight="0" marginwidth="0" frameborder="0" allowTransparency="true"></iframe>' +
            '</div>',
            link: function ($scope, $element) {
                var j = i++;

                updateFlights();

                $rootScope.$on("cAdList:refresh", updateFlights);

                function updateFlights() {
                    if (flightsTotal > 0) {
                        var flight = flights[j % flightsTotal];
                        var $iframe = $element.children("iframe");

                        $element.removeClass("ng-hide");

                        $iframe.css({
                            width: flight.width + "px",
                            height: flight.height + "px"
                        });

                        $iframe.attr("src", flight.url);
                    }
                }
            }
        }
    });