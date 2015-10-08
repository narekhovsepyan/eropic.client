angular.module("common").
    factory("_visible", function($window, $document) {
        //https://github.com/Treri/me-lazyload
        var doc = $document[0],
            body = doc.body,
            win = $window;

        function getWindowOffset(){
            var t,
                pageXOffset = (typeof win.pageXOffset == 'number') ? win.pageXOffset : (((t = doc.documentElement) || (t = body.parentNode)) && typeof t.ScrollLeft == 'number' ? t : body).ScrollLeft,
                pageYOffset = (typeof win.pageYOffset == 'number') ? win.pageYOffset : (((t = doc.documentElement) || (t = body.parentNode)) && typeof t.ScrollTop == 'number' ? t : body).ScrollTop;
            return {
                offsetX: pageXOffset,
                offsetY: pageYOffset
            };
        }

        function isVisible(element){
            var elemRect = element.getBoundingClientRect(),
                windowOffset = getWindowOffset(),
                winOffsetX = windowOffset.offsetX,
                winOffsetY = windowOffset.offsetY,
                elemWidth = elemRect.width,
                elemHeight = elemRect.height,
                elemOffsetX = elemRect.left + winOffsetX,
                elemOffsetY = elemRect.top + winOffsetY,
                viewWidth = Math.max(doc.documentElement.clientWidth, win.innerWidth || 0),
                viewHeight = Math.max(doc.documentElement.clientHeight, win.innerHeight || 0),
                xVisible,
                yVisible;

            if (elemRect.width == 0 && elemRect.height == 0) {
                return false;
            }

            if(elemOffsetY <= winOffsetY){
                if(elemOffsetY + elemHeight >= winOffsetY){
                    yVisible = true;
                }
            }else if(elemOffsetY >= winOffsetY){
                if(elemOffsetY <= winOffsetY + viewHeight){
                    yVisible = true;
                }
            }

            if(elemOffsetX <= winOffsetX){
                if(elemOffsetX + elemWidth >= winOffsetX){
                    xVisible = true;
                }
            }else if(elemOffsetX >= winOffsetX){
                if(elemOffsetX <= winOffsetX + viewWidth){
                    xVisible = true;
                }
            }

            return xVisible && yVisible;
        }

        return {
            check: isVisible
        }
    });