angular.module("app").
    factory("_pageConfig", function() {
        return {

        }
    }).
    directive("cLinkAlbums", function ($rootScope, _search, _page, _v) {
        return {
            restrict: "A",
            link: function ($scope, $element, attrs) {
                var pageCurrent = -1;
                var isNext = (attrs.cLinkAlbums == "next");

                $rootScope.$on("search:changed", function (e, data) {
                    var albumsCount = data.totalCount;
                    var page = _search.getPage();

                    if (isNext) {
                        if (_page.hasMoreItems(page, albumsCount)) page++;
                    } else {
                        page--;
                    }

                    if (page != pageCurrent && page > 0) {
                        $element
                            .attr("rel", attrs.cLinkAlbums)
                            .attr("href", _v.getUrl({v: {page: page}}));
                    } else {
                        $element
                            .attr("rel", "")
                            .attr("href", "");
                    }
                });
            }
        }
    }).
    directive("albumItem", function($rootScope, _header) {
       return {
           restrict: "A",
           scope: {
                album: "=albumItem"
           },
           link: function($scope, $element) {
               var onScrollListener = $rootScope.$on("album-item:scroll-to", scrollTo);

               $scope.$on("$destroy", offListeners);

               function scrollTo(e, albumId) {
                   if ($scope.album.id == albumId) {
                       $(window).scrollTop(Math.max(0, $element.offset().top - _header.getMaxHeight()));
                   }
               }

               function offListeners() {
                   onScrollListener();
               }
           }
       }
    }).
    directive("albumTriggerOnClick", function ($rootScope) {
        return {
            restrict: "A",
            link: function ($scope, $element, attrs) {
                $element.on("click", function (e) {
                    var $target = $(e.target);

                    if ($target.data("movie-link") || $target.parent().data("movie-link")) {
                        $rootScope.$safeApply(function () {
                            $rootScope.$emit(attrs.albumTriggerOnClick);
                        });
                    }
                });
            }
        }
    }).
    directive("albumHref", function (_router) {
        return {
            restrict: "A",
            link: function ($scope, $element, attrs) {
                $element
                    .attr("href", _router.album(attrs.albumHref, attrs.albumHrefPhoto))
                    .attr("data-movie-link", "1");
            }
        }
    }).
    factory("_albumsListPage", function(_albumFullState, _searchActive, _window, _gallery) {
        function isListPage() {
            return !_albumFullState.has();
        }

        function isListPageDisplayed() {
            return isListPage() && !_searchActive.isOpened()
        }

        return {
            isListPage: isListPage,
            isListPageDisplayed: isListPageDisplayed
        }
    }).
    controller("AlbumsController", function ($scope, $rootScope, $timeout, _albums, _gallery, _ad, _search, _searchStateCurrent, _albumFullState, _promise, _fullScreen, _header, _document, _page, _i18n, _albumsListPage) {
        var albumsById = {}; //skip already added albums to prevent track by id error
        var MAX_PAGES_TO_STORE = 3;
        var isLoadedOnce = false;

        $scope.albums = [];
        $scope.albumsCount = 0;
        $scope.pageOnStart = 0;
        $scope.loadOneMoreBatch = loadNextPage;
        $scope.isInfiniteDisabled = _.negate(isInfiniteEnabled);
        $scope.loadThumbnails = _gallery.album.loadThumbnails;
        $scope.hasMoreItems = hasMoreItems;
        $scope.isDisplayAd = _ad.list.isDisplay;
        $scope.resetAlbumsAndLoadOneMoreBatch = resetAlbumsAndLoadOneMoreBatch;

        $rootScope.$watch(_search.isQuerying, function(curr) {
            if (curr != $scope.isLoadingAlbums) {
                if (curr) {
                    $scope.isLoadingAlbums = true;
                } else {
                    //we need it to disable infinite-scroll on first load
                    $timeout(function() {
                        $scope.isLoadingAlbums = false;
                    });
                }
            }
        });

        $rootScope.$watch(_search.getPage, function(curr) {
            updatePrevNextPages(curr);
        });

        $rootScope.$on("search:changed", function updateAlbumsOnSearchChange(e, data) {
            isLoadedOnce = true;

            var currentPage = _search.getPage();

            $scope.albumsCount = data.totalCount;
            $scope.root.filterLabel = _i18n("albums.filterLabel.albumsFound", {count: $scope.albumsCount});

            if (_search.isFirstPage()) {
                _resetAlbums();
                _navigateTop();
            }

            if ($scope.albums.length == 0) {
                $scope.pageOnStart = currentPage;
            }

            _.each(data.albums, _addAlbum);

            updatePrevNextPages(currentPage);
        });

        $rootScope.$on("albums:beforeAlbumOpen", function() {
           _searchStateCurrent.remember();
        });

        $rootScope.$onMany(["albumFull:closed", "search:changed"], updateTitle);
        $rootScope.$on("search:changed", _header.timeoutAndRecalculateHeight);

        $rootScope.$on("albumFull:nextAlbum", function() {
            _tryToOpenNextAlbum(_albumFullState.getAlbumId());
        });

        $rootScope.$on("albumFull:prevAlbum", function () {
            _tryToOpenPrevAlbum(_albumFullState.getAlbumId());
        });

        $rootScope.$on("albumFull:opened", function(e, albumId) {
            var albumPosition = getAlbumPosition(albumId);

            $rootScope.$emit("albumFull:hasNextPrevAlbum", {
                albumId: albumId,
                hasPrevAlbum: _hasPrevAlbum(albumPosition),
                hasNextAlbum: _hasNextAlbum(albumPosition)
            })
        });

        $rootScope.$on("albumFull:closed", function(e, albumId) {
            $rootScope.$emit("album-item:scroll-to", albumId);
        });

        function _tryToOpenNextAlbum(currentAlbum, isRepeat) {
            var positionNext;

            if (isRepeat) {
                //loaded next portion of images and open next album
                //since search state was change we need to remember it again
                _searchStateCurrent.remember();
            }

            if (!isLoadedOnce) {
                positionNext = 0;
            } else {
                positionNext = getAlbumPosition(currentAlbum) + 1;
            }

            if (positionNext < $scope.albums.length) {
                //just open next album
                _albumFullState.requestOpen($scope.albums[positionNext]);
            } else {
                //don't have enough albums to load -> load more or close
                _albumFullState.requestClose();

                if (!isRepeat && hasMoreItems()) {
                    loadNextPage().then(function() {
                        _tryToOpenNextAlbum(currentAlbum, true);
                    });
                }
            }
        }

        function _tryToOpenPrevAlbum(currentAlbum) {
            var position = getAlbumPosition(currentAlbum);

            if (_hasPrevAlbum(position)) {
                _albumFullState.requestOpen($scope.albums[position - 1]);
            } else {
                _albumFullState.requestClose();
            }
        }

        function _resetAlbums() {
            $scope.albums.length = 0;
            albumsById = {};
        }

        function _addAlbum(album) {
            if (album.id && !albumsById[album.id]) {
                $scope.albums.push(album);
                albumsById[album.id] = true;
            }
        }

        function _canLoadOneMorePage() {
            return (_search.getPage() - $scope.pageOnStart) < (MAX_PAGES_TO_STORE - 1);
        }

        function _navigateTop() {
            $('html,body').scrollTop(0);
        }

        function isInfiniteEnabled() {
            return isLoadedOnce && _albumsListPage.isListPageDisplayed() && hasMoreItems() && _canLoadOneMorePage();
        }

        function hasMoreItems(page) {
            return !isLoadedOnce || _page.hasMoreItems(page || _search.getPage(), $scope.albumsCount);
        }

        function resetAlbumsAndLoadOneMoreBatch(e) {
            if (e) e.preventDefault();

            _resetAlbums();
            loadNextPage();
        }

        function loadNextPage() {
            if (hasMoreItems() && !$scope.isLoadingAlbums) {
                return _search.setNextPage();
            } else {
                return _promise.stubFail;
            }
        }

        function getAlbumPosition(albumId) {
            return _.findIndex($scope.albums, function(item) {
                return item.id == albumId;
            });
        }

        function updateTitle() {
            _document.setTitle("ero-pic.net")
        }

        function updatePrevNextPages(currentPage) {
            $scope.pagePrev = (currentPage > 1) ? currentPage - 1 : 1;
            $scope.pageNext = (hasMoreItems(currentPage)) ? currentPage + 1 : currentPage;
        }

        function _hasPrevAlbum(position) {
            var positionPrev = position - 1;
            var answer = positionPrev >= 0 && positionPrev < $scope.albums.length;

            return answer;
        }

        function _hasNextAlbum(position) {
            var positionNext = position + 1;

            if (!isLoadedOnce) {
                return true;
            } else {
                return positionNext < $scope.albums.length || hasMoreItems();
            }
        }
    });