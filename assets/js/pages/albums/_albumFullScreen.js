angular.module("app").
    factory("_albumFullState", function($rootScope, _searchStateCurrent) {
        function requestOpen(album, photoPosition) {
            _.emptyObject($rootScope.$v);

            $rootScope.$v.album = album.id;
            $rootScope.$v.photo = photoPosition || 1;
        }

        function requestClose() {
            _searchStateCurrent.restore();

            delete $rootScope.$v.album;
            delete $rootScope.$v.photo;
        }

        function has() {
            return !!getAlbumId();
        }

        function getAlbumId() {
            return $rootScope.$v.album;
        }

        return {
            getAlbumId: getAlbumId,
            has: has,
            requestOpen: requestOpen,
            requestClose: requestClose
        }
    }).
    factory('_albumFullScreen', function ($rootScope, _albumFullState, _fullScreen, _promise, _v, _albums, _screenfull, _notification) {
        function initRouting() {
            _v.onChangeAndTrigger(function openAlbum(current, prev) {
                if (!current.album) {
                    _doClose(prev.album);
                } else if (current.album != prev.album) {
                    _albums
                        .get(current.album)
                        .then(function(album) {
                            if (album) {
                                _doOpen(album, current.photo);
                            } else {
                                _notification.translateAndNotify("other.notification.albumNotFound");
                                _albumFullState.requestClose();
                            }
                        });
                }
            });
        }

        function _doOpen(album, photoPosition) {
            if (!album) return;

            _promise.chain()
                .then(_doCloseOnChange)
                .then(function () {
                    _fullScreen.open("album", {
                        album: album,
                        photoPosition: photoPosition || 1
                    });
                });
        }

        function _doClose(closingAlbumId) {
            _screenfull.exit();
            _fullScreen.close();

            $rootScope.$emit("albumFull:closed", closingAlbumId)
        }

        function _doCloseOnChange() {
            _fullScreen.close();
        }

        return {
            initRouting: initRouting
        }
    }).
    run(function(_albumFullScreen) {
        _albumFullScreen.initRouting();
    }).
    directive("cAlbumFull", function ($rootScope, $timeout, _albumFullState, _v, _screenfull, _albums, _vote, _document, _search, _searchStateCurrent, _idle) {
        return {
            restrict: "E",
            replace: true,
            templateUrl: '/pages/albums/_albumFull.html',
            controller: function($scope) {
                var _this = this;

                _this.setDoNotHideOnIdle = function(value) {
                    $scope.doNotHideOnIdle = value;
                }
            },
            link: function ($scope) {
                var isActionsHiddenByIdle = false;

                _idle.on();

                $scope.isActionsDisplayed = true;
                $scope.close = close;
                $scope.toggleActions = toggleActions;
                $scope.albumsUrl = getAlbumsUrl();
                $scope.albumOpenPrev = albumOpenPrev;
                $scope.albumOpenNext = albumOpenNext;
                $scope.autoplay = {
                    toggle: toggleAutoplay
                };
                $scope.fullScreen = (function () {
                    function toggle() {
                        $rootScope.isFullScreen = !$rootScope.isFullScreen;
                        _screenfull.toggle();
                    }

                    function isEnabled() {
                        return _screenfull.isFullscreen;
                    }

                    return {
                        supports: _screenfull.enabled,
                        toggle: toggle,
                        isEnabled: isEnabled
                    }
                })();

                $scope.onPhotoOpened = function (photoPosition) {
                    _v.replace({set: {photo: photoPosition}});
                };

                $scope.$watch("fullScreenModel.album", function (curr, prev) {
                    if (curr) {
                        onAlbumOpened(curr)
                    }
                });

                $scope.$on("$destroy", function() {
                    _idle.off();
                });

                $rootScope.$on("c-gal:autoplay-changed", function(e, autoplay) {
                    $scope.autoplay.enabled = autoplay;
                });

                $rootScope.$on("albumFull:hasNextPrevAlbum", function (e, data) {
                    if (data.albumId == $rootScope.$v.album) {
                        $scope.hasPrevAlbum = data.hasPrevAlbum;
                        $scope.hasNextAlbum = data.hasNextAlbum;
                    }
                });

                (function hideActionsOnIdle() {
                    $rootScope.$on("_idle:idle", function() {
                        if ($scope.isActionsDisplayed && !$scope.doNotHideOnIdle) {
                            $scope.isActionsDisplayed = false;
                            isActionsHiddenByIdle = true;
                            $rootScope.$safeApply();
                        }
                    });

                    $rootScope.$on("_idle:active", function() {
                        if (isActionsHiddenByIdle) {
                            $scope.isActionsDisplayed = true;
                            isActionsHiddenByIdle = false;
                            $rootScope.$safeApply();
                        }
                    });
                })();

                (function configureVoting() {
                    var vote = {
                        isVoted: function() {
                            return vote.isVotedUp || vote.isVotedDown;
                        },
                        up: function() {
                            vote.isVotedUp = true;
                            _vote.up($rootScope.$v.album);
                            $timeout(close, 1000);
                        },
                        down: function() {
                            vote.isVotedDown = true;
                            _vote.down($rootScope.$v.album);
                            $timeout(close, 1000);
                        }
                    };

                    $rootScope.$on("c-gal:try-next-after-last", function() {
                        if (_vote.can($rootScope.$v.album)) {
                            vote.isVoting = true;
                        }
                    });

                    $scope.vote = vote;
                })();

                function toggleActions() {
                    $scope.isActionsDisplayed = !$scope.isActionsDisplayed;
                    isActionsHiddenByIdle = false;

                    if ($scope.isActionsDisplayed) {
                        $timeout(function() {
                            $rootScope.$emit("c-gal.do:trigger-to-load-thumbnails");
                        });
                    }
                }

                function albumOpenNext() {
                    $rootScope.$emit("albumFull:nextAlbum")
                }

                function albumOpenPrev() {
                    $rootScope.$emit("albumFull:prevAlbum")
                }

                function close() {
                    _albumFullState.requestClose();
                }

                function toggleAutoplay() {
                    $rootScope.$emit("c-gal.do:autoplay-toggle");
                }

                function onAlbumOpened(album) {
                    $rootScope.$emit("albumFull:opened", album.id);

                    _albums.track.view(album.id);
                    _document.setTitle(album.title);
                }

                function getAlbumsUrl() {
                    return _search.getUrlFor(_searchStateCurrent.getRemembered());
                }
            }
        }
    }).
    directive("cAlbumFullDoNotHideOnIdle", function() {
        return {
            restrict: "A",
            require: "^cAlbumFull",
            link: function($scope, $element, attrs, ctrl) {
                $element.on("mouseenter", function() {
                    ctrl.setDoNotHideOnIdle(true);
                });

                $element.on("mouseleave", function() {
                    ctrl.setDoNotHideOnIdle(false);
                });
            }
        }
    }).
    directive("cVoteButton", function($timeout) {
        return {
            restrict: "A",
            scope: {
                cVoteButton: "="
            },
            link: function($scope, $element, attrs) {
                $element.click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    $element.addClass("is-shaking");
                    $timeout($scope.cVoteButton, attrs.cVoteButtonShake || 350);
                })
            }
        }
    });