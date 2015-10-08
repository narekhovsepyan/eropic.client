//www.eccesignum.org/blog/solving-display-refreshredrawrepaint-issues-in-webkit-browsers
(function ($) {
    $.fn.repaint = function () {
        this.hide();
        this.get(0).offsetHeight; // no need to store this anywhere, the reference is enough
        this.show();
    }
})(jQuery);