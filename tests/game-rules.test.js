const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    SCORE_VERSION,
    COMBO_WINDOW_MS,
    BIG_POP_MIN_APPLES,
    scoreForApples,
    nextCombo,
    isBigPop,
} = require('../game-rules.js');

test('사과는 제거한 개수만큼 1점씩 계산한다', () => {
    assert.equal(scoreForApples(1), 1);
    assert.equal(scoreForApples(4), 4);
    assert.equal(scoreForApples(9), 9);
});

test('잘못된 사과 개수는 점수에 반영하지 않는다', () => {
    assert.equal(scoreForApples(0), 0);
    assert.equal(scoreForApples(-3), 0);
    assert.equal(scoreForApples(Number.NaN), 0);
});

test('반응형 대형 사과 게임판은 점수 버전 8을 사용한다', () => {
    assert.equal(SCORE_VERSION, 8);
});

test('제한 시간 안의 연속 정답만 콤보로 이어진다', () => {
    assert.equal(COMBO_WINDOW_MS, 2800);
    assert.equal(nextCombo(1, 1000, 1000 + COMBO_WINDOW_MS), 2);
    assert.equal(nextCombo(4, 1000, 1000 + COMBO_WINDOW_MS + 1), 1);
    assert.equal(nextCombo(3, Number.NaN, 2000), 1);
});

test('사과 3개 이상 제거하면 BIG POP으로 판정한다', () => {
    assert.equal(BIG_POP_MIN_APPLES, 3);
    assert.equal(isBigPop(2), false);
    assert.equal(isBigPop(3), true);
    assert.equal(isBigPop(6), true);
    assert.equal(isBigPop(Number.NaN), false);
});

test('공개 게임은 행사 전용 문구 없이 하나의 기본 주소를 사용한다', () => {
    const root = path.join(__dirname, '..');
    const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
    const publicText = `${index}\n${readme}`;

    assert.doesNotMatch(publicText, /ais7|인공지능사관학교|멘토매칭데이/);
    assert.equal(manifest.start_url, './');
    assert.equal(
        (readme.match(/https:\/\/seung-won-yu\.github\.io\/apple-burst\//g) || []).length,
        1,
    );
});
