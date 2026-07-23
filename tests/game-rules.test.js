const test = require('node:test');
const assert = require('node:assert/strict');

const { SCORE_VERSION, scoreForApples } = require('../game-rules.js');

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
