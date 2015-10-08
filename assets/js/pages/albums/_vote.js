angular.module("app").
    factory("_vote", function(_albums) {
        function canVote(code) {
            return true; //todo
        }

        function voteUp(code) {
            return _albums.track.vote(code, true);
        }

        function voteDown(code) {
            return _albums.track.vote(code, false);
        }

        return {
            can: canVote,
            up: voteUp,
            down: voteDown
        }
    });