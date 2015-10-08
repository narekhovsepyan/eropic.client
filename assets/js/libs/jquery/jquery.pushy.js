/*! Pushy - v0.9.1 - 2013-9-16
 * Pushy is a responsive off-canvas navigation menu using CSS transforms & transitions.
 * https://github.com/christophery/pushy/
 * by Christopher Yee */

$.pushy = function (options) {

    options = $.extend({
        onOpen: function() {},
        onClose: function() {}
    }, options);

    var pushy = $('.pushy-nav'), //menu css class
        doc = $(document),
        html = $('html'),
        body = $('body'),
        container = $('.pushy-body'), //container css class
        push = $('.push'), //css class to add pushy capability
        siteOverlay = $('.pushy-cloak'), //site overlay
        pushyClass = "pushy-left pushy-open", //menu position & menu open class
        pushyActiveClass = "pushy-active", //css class to toggle site overlay
        containerClass = "container-push", //container open class
        pushClass = "push-push", //css class to add pushy capability
        menuSpeed = 200, //jQuery fallback menu speed
        menuWidth = pushy.width() + "px", //jQuery fallback menu width
        isOpen = html.hasClass('pushy-active');

    var documentPreventContentScroll = function(e){
        e.preventDefault();
    };

    var pushyPreventContentScroll = function(e) {
        e.stopPropagation();
    };

    function togglePushy(){
        isOpen = !isOpen;
        html.toggleClass(pushyActiveClass); //toggle site overlay
        pushy.toggleClass(pushyClass);
        container.toggleClass(containerClass);
        push.toggleClass(pushClass); //css class to add pushy capability

        if (isOpen) {
            options.onOpen(pushy);

            //fix iphone landscape bug
            html.css('overflow-x', 'hidden');
            html.css('overflow-y', 'hidden');

            doc.on('touchmove', documentPreventContentScroll);
            pushy.on('touchmove', pushyPreventContentScroll);
        } else {
            options.onClose(pushy);

            //fix iphone landscape bug
            html.css('overflow-x', '');
            html.css('overflow-y', '');

            doc.off('touchmove', documentPreventContentScroll);
            pushy.off('touchmove', pushyPreventContentScroll);

            //fix horizontal scroll
            setTimeout(function() {
                body.repaint();
            }, menuSpeed);
        }
    }

    function open() {
        if (!isOpen) togglePushy();
    }

    function openPushyFallback(){
        html.addClass(pushyActiveClass);
        pushy.animate({left: "0px"}, menuSpeed);
        container.animate({left: menuWidth}, menuSpeed);
        push.animate({left: menuWidth}, menuSpeed); //css class to add pushy capability
    }

    function closePushyFallback(){
        html.removeClass(pushyActiveClass);
        pushy.animate({left: "-" + menuWidth}, menuSpeed);
        container.animate({left: "0px"}, menuSpeed);
        push.animate({left: "0px"}, menuSpeed); //css class to add pushy capability
    }

    if (Modernizr.csstransforms3d) {
        //close menu when clicking site overlay
        siteOverlay.click(function () {
            togglePushy();
        });
    }

    return {
        open: open,
        toggle: togglePushy,
        isOpen: function() {
            return isOpen;
        }
    }
};