angular.module("common").
    factory("_ga", function(_gaEventsPercentage, _log) {
        var isLoaded = false;
        var ga = window.ga || function() {};

        ga(function() {
           isLoaded = true;
        });

        function _isLoaded() {
            return isLoaded;
        }

        function _isProcessEvent(forced) {
            return forced || _gaEventsPercentage >= (Math.random()*100)
        }

        function trackPageView() {
            _log.trace("ga page view: " + window.location.href);

            ga('send', 'pageview');
        }

        function event(category, action, label, value, force) {
            _log.debug("ga event: ", arguments);

            if (_isProcessEvent(force)) {
                ga('send', 'event', category, action, label, value);
            }
        }

        function eventWithCallback(category, action, label, callback, force) {
            _log.debug("ga event: ", arguments);

            if (_isLoaded && _isProcessEvent(force)) {
                //http://stackoverflow.com/questions/4086587/track-event-in-google-analytics-upon-clicking-form-submit
                ga('send', 'event', category, action, label, {
                    'hitCallback': function() {
                        callback();
                    }
                });
            } else {
                callback();
            }
        }

        function eventAndProcessLink(e, target, category, action, label, force) {
            e.preventDefault();

            eventWithCallback(category, action, label, function() {
                window.location.href = (target || e.target).href;
            }, force);
        }

        return {
            trackPageView: trackPageView,
            event: event,
            eventWithCallback: eventWithCallback,
            eventAndProcessLink: eventAndProcessLink
        }
    });