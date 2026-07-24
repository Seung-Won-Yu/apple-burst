(function(root) {
    const SCORE_VERSION = 8;
    const COMBO_WINDOW_MS = 2800;
    const BIG_POP_MIN_APPLES = 3;

    function scoreForApples(count) {
        if(!Number.isFinite(count) || count <= 0) return 0;
        return Math.floor(count);
    }

    function nextCombo(currentCombo, lastHitAt, now, windowMs = COMBO_WINDOW_MS) {
        const current = Number.isFinite(currentCombo) && currentCombo > 0
            ? Math.floor(currentCombo)
            : 0;
        const isContinuous = Number.isFinite(lastHitAt)
            && Number.isFinite(now)
            && now >= lastHitAt
            && now - lastHitAt <= windowMs;
        return isContinuous ? current + 1 : 1;
    }

    function isBigPop(count) {
        return Number.isFinite(count) && Math.floor(count) >= BIG_POP_MIN_APPLES;
    }

    const AppleBurstRules = Object.freeze({
        SCORE_VERSION,
        COMBO_WINDOW_MS,
        BIG_POP_MIN_APPLES,
        scoreForApples,
        nextCombo,
        isBigPop,
    });

    if(root) root.AppleBurstRules = AppleBurstRules;
    if(typeof module !== 'undefined' && module.exports) module.exports = AppleBurstRules;
})(typeof window !== 'undefined' ? window : null);
