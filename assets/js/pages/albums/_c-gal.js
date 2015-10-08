angular.module("app").
    constant('_cGalThumbHeight', 70).
    constant('_cGalWindowWidthToDisplayThumb', 740).
    directive('cGalClick', function ($rootScope) {
        return {
            restrict: 'A',
            scope: {
                cGalClick: "&"
            },
            link: function ($scope, $element, attrs) {
                $element.on('mousedown', function (evt) {
                    var click = true;
                    $element.on('mouseup mousemove', function handler(evt) {
                        if (evt.type === 'mouseup') {
                            $rootScope.$safeApply($scope.cGalClick);
                        } else {
                            click = false;
                        }

                        $element.off('mouseup mousemove', handler);
                    });
                });
            }
        }
    }).
    directive('cGal', function ($timeout, $rootScope, _cGalThumbHeight, _cGalWindowWidthToDisplayThumb, _window, _visible, _visibility, _lazyVisible) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                photos: "=",
                photoPosition: "=",
                photoClick: "&",
                photoOpened: "=",
                photoPreloadCount: "=",
                do: "=",
                isFullScreen: "="
            },
            templateUrl: '/pages/albums/_gal.html',
            link: function ($scope, $element, attrs) {
                $rootScope.$watch('isFullScreen', function(data) {
                    $scope.isFullScreen = data;
                });
                var isDestroyed = false;
                var renderer = 0;
                var isDisplayed = false;
                var $cGalFull = $element.children('.js-c-gal-full');
                var $full = null;
                var $thumbs = null;
                var funcStub = function () {
                };
                var lightSliderStub = {
                    isStub: true,
                    goToSlide: funcStub,
                    goToNextSlide: funcStub,
                    goToPrevSlide: funcStub,
                    refresh: funcStub,
                    touchDisable: funcStub,
                    touchEnable: funcStub
                };
                var thumbs = lightSliderStub;
                var full = lightSliderStub;
                var photoPreloadCount = $scope.photoPreloadCount || 0;
                var zoomed = false;

                $scope.$on("$destroy", function() {
                    isDestroyed = true;
                });

                var autoplay = (function () {
                    var wasDisabledByVisibility = false;
                    var autoplayDelay = 5000;
                    var debounceNextPhoto = _.debounce(autoplayTryNextPhoto, autoplayDelay);

                    function autoplayTryNextPhoto() {
                        if (autoplay.enabled && !isDestroyed) {
                            openPhotoNext();
                        }
                    }

                    function toggle() {
                        if (!autoplay.enabled) {
                            enable();
                        } else {
                            disable();
                        }
                    }

                    function disable() {
                        if (autoplay.enabled) {
                            autoplay.enabled = false;
                            _onChange();
                        }
                    }

                    function enable() {
                        if (!autoplay.enabled) {
                            autoplay.enabled = true;
                            autoplay.debounceNextPhoto();
                            _onChange();
                        }
                    }

                    function _onChange() {
                        wasDisabledByVisibility = false;

                        $rootScope.$emit("c-gal:autoplay-changed", autoplay.enabled);
                    }

                    (function listenForAutoplayEvents() {
                        $rootScope.$on("c-gal.do:autoplay-toggle", toggle);

                        $rootScope.$on("c-gal.do:autoplay-disable", disable);

                        $rootScope.$on("c-gal.do:trigger-to-load-thumbnails", triggerToLoadThumbnails);
                    })();

                    (function configureVisibilityChange() {
                        var listenerId = _visibility.changeSafeApply(function(e, state) {
                            if (state == "hidden") {
                                if (autoplay.enabled) {
                                    disable();

                                    wasDisabledByVisibility = true;
                                }
                            } else if (state == "visible") {
                                if (wasDisabledByVisibility) {
                                    enable();
                                }
                            }
                        });

                        $scope.$on("$destroy", function() {
                            _visibility.unbind(listenerId);
                        });
                    })();

                    return {
                        enabled: false,
                        debounceNextPhoto: debounceNextPhoto
                    }
                })();

                (function resizeGalOnWindowResize() {
                    _window.onAndOffOnDestroy("resize", $scope, function() {
                        if (isDisplayed) {
                            resizeFull();
                            updateIsThumbsDisplayed();
                            updateFitFullClassForPhoto($scope.photoActive);
                        }
                    });
                })();

                (function fitFullPhotos() {
                    _.each($scope.photos, updateFitFullClassForPhoto)
                })();

                (function disableTouchOnZoom() {
                    $rootScope.$on("c-gal-pan-zoom:zoom-changed", function() {
                        zoomed = true;
                        full.touchDisable();
                    });
                    $rootScope.$on("c-gal-pan-zoom:zoom-initial", function () {
                        $timeout(function () {
                            zoomed = false;
                            full.touchEnable(); //enable with delay to prevent lighslider actions on touch event
                        }, 100);
                    });
                })();

                //
                //(function () {
                //    $rootScope.$on("panzoomstart", function () {
                //        full.touchDisable();
                //    });
                //
                //    $rootScope.$on("panzoomend", function (e, matrix) {
                //        $timeout(function(){
                //            if (matrix[0] == 1 && matrix[3] == 1) {
                //                full.touchEnable();
                //            }
                //        }, 100);
                //    });
                //})();

                $scope.openPhoto = function (photo) {
                    openPhotoByPosition(_.indexOf($scope.photos, photo) + 1);
                };

                $scope.full = {
                    goToNext: function () {
                        full.goToNextSlide();
                    },
                    goToPrev: function () {
                        full.goToPrevSlide();
                    }
                };

                $scope.thumbs = {
                    goToNext: function () {
                        goToVisibleSlide(thumbs, $thumbs, true);
                    },
                    goToPrev: function () {
                        goToVisibleSlide(thumbs, $thumbs, false);
                    }
                };

                $scope.loadThumbnail = function(photo) {
                    photo.thumb.loadUrl = photo.thumb.url;
                };

                $scope.$watch("photos", function (current, prev) {
                    if (current) {
                        initializeOrRefresh();
                    } else {
                        close();
                    }
                });

                function resizeFull() {
                    $full.height($cGalFull.height());
                }

                function updateFitFullClassForPhoto(photo) {
                    if (photo) {
                        var galHeight = $cGalFull.height();
                        var containerRatio = $cGalFull.width() / galHeight;
                        var imgRatio = photo.width / photo.height;

                        photo.fit = (imgRatio > containerRatio) ? 'width' : 'height';
                        photo.maxHeight = galHeight;
                    }
                }

                function openPhotoByPosition(photoPosition, options) {
                    full.goToSlide(photoPosition - 1, options);
                    thumbs.goToSlide(photoPosition - 1, options);
                }

                function openPhotoNext() {
                    full.goToNextSlide();
                }

                function onBeforeFullSlide(currentSlide, direction) {
                    var photos = $scope.photos;
                    $scope.photoActive = photos[currentSlide];

                    updateFitFullClassForPhoto($scope.photoActive);
                    loadFullPhotos(currentSlide, direction);
                    resetPanZoom();
                }

                function loadFullPhotos(currentSlide, direction) {
                    var photos = $scope.photos;
                    var photosToLoadCount = photoPreloadCount + 1;
                    var photosToLoad;

                    if (direction == "forward") {
                        photosToLoad = _.first(_.rest(photos, currentSlide), photosToLoadCount);
                    } else {
                        photosToLoad = _.last(_.first(photos, currentSlide + 1), photosToLoadCount);
                    }

                    _.each(photosToLoad, loadFullPhoto);
                }

                function loadFullPhoto(photo) {
                    if (photo) photo.full = photo.largeUrl;
                }

                function resetPanZoom() {
                    if (zoomed) {
                        $rootScope.$emit("c-gal-pan-zoom.do:reset");
                        full.touchEnable();
                    }
                }

                function updateThumbnailSizes(photos) {
                    _.each(photos, function (photo) {
                        photo.thumb.height = _cGalThumbHeight;
                        photo.thumb.width = Math.floor(photo.width * _cGalThumbHeight / photo.height);
                    });
                }

                function updatePrevNextStatuses(slider, currentSlide, obj) {
                    obj.prevActive = currentSlide > 0;
                    obj.nextActive = currentSlide < (slider.getTotalSlideCount() - 1);
                }

                function initializeOrRefresh() {
                    isDisplayed = true;

                    $scope.renderer = [renderer++];

                    updateThumbnailSizes($scope.photos);
                    updateIsThumbsDisplayed(true);

                    $timeout(function () {
                        $full = $element.find('.js-gal-full');
                        full = $full.lightSlider({
                            item: 1,
                            loop: false,
                            controls: false,
                            pager: false,
                            keyPress: true,
                            slideEndAnimation: false,
                            onBeforeSlide: function (el, currentSlide) {
                                $rootScope.$safeApply(function () {
                                    onBeforeFullSlide(currentSlide, getDirection(full.currentSlide, currentSlide));
                                });
                            },
                            onAfterSlide: function (el, currentSlide) {
                                $rootScope.$emit("c-gal:slide-opened", currentSlide);

                                full.currentSlide = currentSlide;

                                var photoPosition = currentSlide + 1;

                                $rootScope.$safeApply(function () {
                                    updatePrevNextStatuses(full, currentSlide, $scope.full);
                                    //updateActivePhoto();
                                    thumbs.goToSlide(currentSlide);
                                    autoplay.debounceNextPhoto();

                                    if ($scope.photoOpened) $scope.photoOpened(photoPosition, $scope.full);
                                });
                            }
                        });

                        full.on("lightslider:try-next-after-last", openVoting);

                        full.refresh();

                        openPhotoByPosition($scope.photoPosition, {disableAnimation: true});
                    });
                }

                function openVoting() {
                    $rootScope.$safeApply(function() {
                        $rootScope.$emit("c-gal:try-next-after-last");
                    });
                }

                function close() {
                    isDisplayed = false;
                }

                function thumbsInit() {
                    $thumbs = $element.find('.js-gal-thumb');

                    thumbs = $thumbs.lightSlider({
                        slideMargin: 2,
                        slideEndAnimation: false,
                        autoWidth: true,
                        pager: false,
                        controls: false,
                        onBeforeSlide: function (el, slideNumber) {

                        },
                        onAfterSlide: function (el, currentSlide) {
                            $rootScope.$safeApply(function () {
                                updatePrevNextStatuses(thumbs, currentSlide, $scope.thumbs);
                                triggerToLoadThumbnails();
                            });
                        }
                    });

                    thumbs.on("lightslider:touch-end-with-delay", function() {
                        $rootScope.$safeApply(triggerToLoadThumbnails);
                    });

                    thumbs.refresh();
                }

                function thumbsDestroy() {
                    thumbs = lightSliderStub;
                }

                function updateIsThumbsDisplayed(force) {
                    if ($scope.thumbs) {
                        var prev = $scope.thumbs.isDisplayed;
                        var current = _window.getWidth() > _cGalWindowWidthToDisplayThumb;

                        if (force || current != prev) {
                            $scope.thumbs.isDisplayed = current;

                            if (current) {
                                $timeout(thumbsInit);
                            } else {
                                thumbsDestroy();
                            }
                        }
                    }
                }

                function getVisibleSlidePositions(slides) {
                    var answer = [];

                    _.each(slides, function(slide, i) {
                        if (_visible.check(slide)) {
                            answer.push(i);
                        }
                    });

                    return answer;
                }

                function goToVisibleSlide(slider, $sliderElement, forward) {
                    if (slider.isStub) return;

                    var nextSlide;
                    var visible = getVisibleSlidePositions($sliderElement.children());
                    var currentSlide = slider.getCurrentSlideCount();

                    if (visible.length) {
                        //forward - next visible slide
                        //backward - first visible - total visible count
                        //backward - this is just an assumption that current screen contains same amount of thumbnails as previous one
                        nextSlide = (forward) ? _.last(visible) : (_.first(visible) - visible.length);
                    } else {
                        nextSlide = currentSlide - 1 + (forward ? 1 : -1);
                    }

                    slider.goToSlide(Math.max(0, nextSlide));
                }

                function goToNextSlideOr(slider, callback) {
                    var currentSlide = slider.getCurrentSlideCount();
                    var slides = slider.getTotalSlideCount();

                    if (currentSlide >= slides) {
                        callback();
                    } else {
                        slider.goToNextSlide();
                    }
                }

                function getDirection(currentSlide, nextSlide) {
                    if (_.isUndefined(currentSlide) || nextSlide > currentSlide) {
                        return "forward";
                    } else {
                        return "backward";
                    }
                }

                function triggerToLoadThumbnails() {
                    _lazyVisible.triggerToCheck($scope);
                }
            }
        }
    });