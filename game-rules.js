(function(root) {
    const SCORE_VERSION = 8;

    function scoreForApples(count) {
        if(!Number.isFinite(count) || count <= 0) return 0;
        return Math.floor(count);
    }

    const AppleBurstRules = Object.freeze({ SCORE_VERSION, scoreForApples });

    if(root) root.AppleBurstRules = AppleBurstRules;
    if(typeof module !== 'undefined' && module.exports) module.exports = AppleBurstRules;
})(typeof window !== 'undefined' ? window : null);
