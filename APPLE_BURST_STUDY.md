# 사과 팡팡 코드 공부 노트

이 문서는 `index.html` 안에 들어있는 주요 코드를 기능별로 쪼개서 공부하기 위한 노트입니다.

실제 게임은 한 파일 안에 HTML, CSS, JavaScript가 모두 들어있는 구조입니다.

```txt
index.html
├─ <head>
│  ├─ Firebase SDK 로드
│  └─ CSS 스타일
├─ <body>
│  ├─ 모바일 세로 안내 화면
│  ├─ 게임 HUD
│  ├─ canvas 게임판
│  ├─ 시작 화면
│  ├─ 결과 화면
│  └─ 토스트 메시지
└─ <script>
   ├─ Firebase 설정
   ├─ 게임 상수
   └─ Game 객체
```

---

## 1. Firebase 연결

```html
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
```

Firebase 기능을 브라우저에서 쓰기 위해 SDK를 불러옵니다.

```js
const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    databaseURL: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "...",
    measurementId: "...",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
```

역할:

- `firebaseConfig`: 내 Firebase 프로젝트 정보
- `firebase.initializeApp(...)`: 웹페이지와 Firebase 프로젝트 연결
- `db`: Realtime Database를 읽고 쓰기 위한 변수

---

## 2. 게임 기본 상수

```js
const ROWS = 10;
const COLS = 17;
const CELL = 52;
const PAD = 25;
const DEFAULT_TIME = 120;
const MAX_NICK = 12;
const LOW_APPLE_LIMIT = 18;

const MAX_RANK_SCORE = 999999;
const SAVE_COOLDOWN_MS = 8000;
```

역할:

- `ROWS`, `COLS`: 사과판 행/열 개수
- `CELL`: 사과 하나가 차지하는 칸 크기
- `PAD`: 캔버스 안쪽 여백
- `DEFAULT_TIME`: 기본 제한 시간
- `MAX_NICK`: 닉네임 최대 길이
- `LOW_APPLE_LIMIT`: 남은 사과가 이 개수 이하이면 자동 리셔플
- `MAX_RANK_SCORE`: 랭킹 저장 허용 최대 점수
- `SAVE_COOLDOWN_MS`: 너무 잦은 저장을 막는 시간

---

## 3. Game 객체 구조

```js
const Game = {
    canvas: document.getElementById('stage'),
    ctx: document.getElementById('stage').getContext('2d'),
    active: false,
    dragging: false,
    score: 0,
    time: DEFAULT_TIME,
    mode: "classic",
    modeTime: DEFAULT_TIME,
    scoreMultiplier: 1,
    grid: [],
    effects: [],
    particles: [],

    init() {
        ...
    },

    start() {
        ...
    },

    check() {
        ...
    },

    loop() {
        ...
    }
};
```

`Game` 객체는 게임 전체 상태와 기능을 모아둔 중심 객체입니다.

대표 상태:

- `score`: 현재 점수
- `time`: 남은 시간
- `mode`: `rush` 또는 `classic`
- `grid`: 사과판 데이터
- `effects`: 점수 텍스트 이펙트
- `particles`: 터지는 파티클 효과

---

## 4. 초기화 init

```js
init() {
    this.canvas.width = (COLS * CELL + PAD * 2) * dpr;
    this.canvas.height = (ROWS * CELL + PAD * 2) * dpr;
    this.ctx.scale(dpr, dpr);

    this.nick = this.cleanNick(localStorage.getItem('apple_nick') || "") || "PLAYER";
    this.playerKey = this.getPlayerKey(this.nick);

    const nickInput = document.getElementById('nick-input');
    nickInput.value = this.nick === "PLAYER" ? "" : this.nick;

    this.setMode(localStorage.getItem('apple_mode') || "classic");
    this.loadChallenge();
    this.updateHud();
    this.watchRanks();
    this.bindEvents();
    this.layout();
    this.loop();
}
```

역할:

1. 캔버스 크기 설정
2. 고해상도 화면 대응
3. 저장된 닉네임 불러오기
4. 저장된 게임 모드 불러오기
5. 공유 링크 도전 정보 확인
6. 랭킹 감시 시작
7. 마우스/터치 이벤트 연결
8. 게임 루프 시작

---

## 5. 닉네임 정리

```js
cleanNick(value) {
    return String(value || "")
        .normalize("NFKC")
        .replace(/[^\p{L}\p{N}_ -]/gu, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_NICK)
        .toUpperCase();
}
```

역할:

- 한글, 영어, 숫자 허용
- 이상한 특수문자 제거
- 공백 정리
- 12글자 제한
- 대문자로 통일

중요 포인트:

```js
/[^\p{L}\p{N}_ -]/gu
```

- `\p{L}`: 모든 언어의 글자
- `\p{N}`: 숫자
- `_`, 공백, `-` 허용
- 그 외 문자는 제거

---

## 6. 한글 입력 처리

```js
nickInput.addEventListener('compositionstart', () => {
    this.composingNick = true;
});

nickInput.addEventListener('compositionend', () => {
    this.composingNick = false;
    this.syncNickInput(nickInput);
});

nickInput.addEventListener('input', (e) => {
    if(this.composingNick || e.isComposing) return;
    this.syncNickInput(nickInput);
});
```

한글은 입력 중에 글자가 조합됩니다.

예를 들어 `승`은 한 번에 들어가는 게 아니라:

```txt
ㅅ → 스 → 승
```

처럼 조합됩니다.

그래서 조합 중에는 닉네임 정리를 잠시 멈추고, 조합이 끝난 뒤 정리합니다.

---

## 7. 60초 / 120초 모드

```js
setMode(mode) {
    this.mode = mode === "rush" ? "rush" : "classic";
    this.modeTime = this.mode === "rush" ? 60 : 120;
    this.scoreMultiplier = this.mode === "rush" ? 2 : 1;
    this.time = this.active ? this.time : this.modeTime;

    localStorage.setItem('apple_mode', this.mode);

    document.getElementById('mode-rush')?.classList.toggle('active', this.mode === "rush");
    document.getElementById('mode-classic')?.classList.toggle('active', this.mode === "classic");

    this.updateHud();
    this.renderRanks(this.latestRanks);
}
```

역할:

- `rush`: 60초, 점수 2배
- `classic`: 120초, 점수 기본
- 선택한 모드를 저장
- 모드 버튼 UI 갱신
- 모드별 랭킹 다시 표시

---

## 8. 랭킹 키 분리

```js
getRankKey(mode = this.mode) {
    return `${mode}_${this.playerKey}`;
}
```

예시:

```txt
rush_유저명
classic_유저명
```

이렇게 저장하면 60초 랭킹과 120초 랭킹이 섞이지 않습니다.

Firebase 구조는 그대로:

```txt
ranks/
  rush_player
  classic_player
```

---

## 9. 랭킹 읽기

```js
watchRanks() {
    db.ref('ranks').orderByChild('score').on('value', (snapshot) => {
        const rows = this.rowsFromSnapshot(snapshot);
        this.latestRanks = rows;
        this.renderRanks(rows);
    });
}
```

역할:

- Firebase `ranks` 데이터를 실시간 감시
- 데이터가 바뀌면 자동으로 다시 그림
- `rowsFromSnapshot`으로 데이터 정리
- `renderRanks`로 화면 출력

---

## 10. Firebase 데이터 정리

```js
rowsFromSnapshot(snapshot) {
    const rows = [];

    snapshot.forEach((child) => {
        const data = child.val() || {};
        const score = Number(data.score);
        if(!Number.isFinite(score) || score <= 0) return;

        rows.push({
            key: child.key,
            mode: this.getModeFromRankKey(child.key),
            nick: this.cleanNick(data.nick) || "PLAYER",
            score: Math.max(0, Math.round(score)),
            updatedAt: Number(data.updatedAt) || 0,
        });
    });

    rows.sort((a, b) => b.score - a.score);
    return rows;
}
```

역할:

- Firebase 데이터를 배열로 변환
- 이상한 점수 제거
- 닉네임 정리
- 모드 추출
- 점수 높은 순으로 정렬

---

## 11. 랭킹 표시

```js
renderRanks(rows = []) {
    const modeRows = rows
        .filter(row => row.mode === this.mode)
        .slice()
        .sort((a, b) => b.score - a.score);

    const scopedRows = this.rankMode === "today"
        ? modeRows.filter(row => row.updatedAt >= start && row.updatedAt < end)
        : modeRows;

    const topRows = scopedRows.slice(0, 10);
}
```

역할:

1. 현재 모드의 랭킹만 필터링
2. `TODAY` 탭이면 오늘 기록만 필터링
3. 상위 10명만 표시

---

## 12. 랭킹 저장

```js
db.ref(`ranks/${this.getRankKey()}`).transaction((current) => {
    if(current && Number(current.score) >= payload.score) return;
    return payload;
});
```

`transaction`은 안전하게 데이터를 업데이트하는 방식입니다.

역할:

- 기존 점수가 더 높으면 저장하지 않음
- 새 점수가 더 높을 때만 교체
- 닉네임별 최고점만 유지

예시:

```txt
기존 점수: 3000
새 점수: 2500
→ 저장 안 함

기존 점수: 3000
새 점수: 4200
→ 새 점수 저장
```

---

## 13. 저장 전 최소 치팅 방지

```js
validateRankSave() {
    if(!Number.isFinite(this.score) || this.score <= 0 || this.score > MAX_RANK_SCORE) {
        return this.score <= 0 ? "NO_SCORE" : "BAD_SCORE";
    }

    const elapsed = Date.now() - this.playStartedAt;
    const minElapsed = Math.max(45000, this.modeTime * 1000 - 2500);
    if(!this.playStartedAt || elapsed < minElapsed) return "TOO_FAST";

    const lastSave = Number(localStorage.getItem(this.getSaveCooldownKey()) || 0);
    if(Date.now() - lastSave < SAVE_COOLDOWN_MS) return "COOLDOWN";

    return "OK";
}
```

역할:

- 0점 저장 차단
- 너무 높은 점수 차단
- 게임 시작 직후 바로 저장하는 것 차단
- 너무 자주 저장하는 것 차단

주의:

이건 클라이언트 방어라 완벽한 보안은 아닙니다.
진짜 치팅 방지는 나중에 Firebase Auth + Cloud Function이 필요합니다.

---

## 14. 사과판 만들기

```js
makeApple() {
    return {
        val: Math.floor(Math.random() * 9) + 1,
        scale: 0,
        removed: false
    };
}

newBoard() {
    return Array.from({length: ROWS}, () =>
        Array.from({length: COLS}, () => this.makeApple())
    );
}
```

역할:

- `val`: 사과 숫자 1~9
- `scale`: 등장 애니메이션용
- `removed`: 제거 여부

---

## 15. 막힌 판 검사

```js
hasAnyTen() {
    const sums = Array.from({length: ROWS + 1}, () => Array(COLS + 1).fill(0));

    for(let r = 0; r < ROWS; r++) {
        for(let c = 0; c < COLS; c++) {
            const apple = this.grid[r]?.[c];
            const value = apple && !apple.removed ? apple.val : 0;
            sums[r + 1][c + 1] = value + sums[r][c + 1] + sums[r + 1][c] - sums[r][c];
        }
    }

    for(let r1 = 0; r1 < ROWS; r1++) {
        for(let c1 = 0; c1 < COLS; c1++) {
            for(let r2 = r1; r2 < ROWS; r2++) {
                for(let c2 = c1; c2 < COLS; c2++) {
                    const sum = sums[r2 + 1][c2 + 1]
                        - sums[r1][c2 + 1]
                        - sums[r2 + 1][c1]
                        + sums[r1][c1];

                    if(sum === 10) return true;
                }
            }
        }
    }

    return false;
}
```

역할:

- 현재 판에 합이 10이 되는 사각형이 있는지 검사
- 하나라도 있으면 `true`
- 없으면 `false`

이 코드는 `누적합` 방식입니다.

---

## 16. 자동 리셔플

```js
ensureBoard() {
    if(!this.active) return;

    const remaining = this.activeCount();

    if(remaining <= LOW_APPLE_LIMIT) {
        this.refreshBoard("RESHUFFLE");
    } else if(!this.hasAnyTen()) {
        this.refreshBoard("NO MOVES");
    }
}
```

언제 리셔플되나:

- 남은 사과가 18개 이하
- 더 이상 합이 10인 선택지가 없음

---

## 17. 드래그 선택

```js
getSel() {
    const x1 = Math.min(this.mStart.x, this.mCurrent.x) - PAD;
    const y1 = Math.min(this.mStart.y, this.mCurrent.y) - PAD;
    const x2 = Math.max(this.mStart.x, this.mCurrent.x) - PAD;
    const y2 = Math.max(this.mStart.y, this.mCurrent.y) - PAD;

    const cs = Math.floor(x1 / CELL);
    const ce = Math.floor(x2 / CELL);
    const rs = Math.floor(y1 / CELL);
    const re = Math.floor(y2 / CELL);

    let sum = 0;
    let items = [];

    for(let r = Math.max(0, rs); r <= Math.min(ROWS - 1, re); r++) {
        for(let c = Math.max(0, cs); c <= Math.min(COLS - 1, ce); c++) {
            if(this.grid[r] && !this.grid[r][c].removed) {
                sum += this.grid[r][c].val;
                items.push({r, c});
            }
        }
    }

    return { sum, items, center };
}
```

역할:

- 드래그 시작점과 끝점으로 사각형 범위 계산
- 범위 안의 사과 숫자를 합산
- 선택된 사과 목록 반환

---

## 18. 정답 체크

```js
check() {
    const sel = this.getSel();

    if(sel.sum === 10 && sel.items.length) {
        const feverOn = this.fever >= 100;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        const points = sel.items.length * 10 * this.combo * this.scoreMultiplier * (feverOn ? 3 : 1);
        this.score += points;
        this.cleared += sel.items.length;
        this.fever = Math.min(100, this.fever + 12);

        sel.items.forEach(p => this.grid[p.r][p.c].removed = true);
    } else {
        this.combo = 0;
        this.fever = Math.max(0, this.fever - 5);
    }

    this.updateHud();
}
```

정답이면:

- 점수 증가
- 콤보 증가
- 피버 게이지 증가
- 선택한 사과 제거

실패하면:

- 콤보 초기화
- 피버 감소

---

## 19. 점수 공식

```js
const points = sel.items.length
    * 10
    * this.combo
    * this.scoreMultiplier
    * (feverOn ? 3 : 1);
```

뜻:

```txt
선택한 사과 개수
× 기본 점수 10
× 콤보 배율
× 모드 배율
× 피버 배율
```

예시:

```txt
사과 3개 선택
콤보 x4
60초 모드 x2
피버 중 x3

3 × 10 × 4 × 2 × 3 = 720점
```

---

## 20. 모바일 레이아웃

```css
@media (orientation: landscape) and (pointer: coarse) {
    #game-container {
        width: 100vw;
        max-width: none;
        padding: 6px 8px 0;
    }

    canvas {
        max-width: none;
        max-height: none;
        border-radius: 9px;
    }
}
```

뜻:

- `orientation: landscape`: 가로 화면
- `pointer: coarse`: 손가락 터치 기기

즉, 휴대폰 가로 화면에서만 적용됩니다.

---

## 21. 모바일 세로 안내

```css
@media (orientation: portrait) and (pointer: coarse) and (max-width: 760px) {
    #rotate-notice {
        display: flex;
    }

    #game-container {
        display: none;
    }
}
```

휴대폰 세로 화면에서는 게임을 숨기고 안내만 보여줍니다.

---

## 22. PC 화면 최적화

```css
@media (min-width: 1100px) and (pointer: fine) {
    #game-container {
        width: min(94vw, 1320px);
    }

    h1 {
        font-size: clamp(54px, 4.8vw, 78px);
    }

    #rank-container {
        width: min(62%, 560px);
    }
}
```

뜻:

- 큰 화면
- 마우스/트랙패드 사용하는 기기

즉, PC 웹 화면에서만 더 크게 보이도록 합니다.

---

## 23. 캔버스 크기 자동 조정

```js
layout() {
    const baseW = COLS * CELL + PAD * 2;
    const baseH = ROWS * CELL + PAD * 2;

    if(this.isDesktopWide()) {
        const viewport = window.visualViewport || {
            width: window.innerWidth,
            height: window.innerHeight
        };

        const availableW = Math.max(760, Math.min(1220, viewport.width - 80));
        const availableH = Math.max(460, viewport.height - headerH - 112);
        const scale = Math.min(availableW / baseW, availableH / baseH, 1.28);

        this.canvas.style.width = `${Math.floor(baseW * scale)}px`;
        return;
    }
}
```

역할:

- PC에서는 화면 크기에 맞춰 캔버스 확대
- 너무 커지지 않게 최대 배율 제한
- 높이가 낮은 노트북에서는 자동으로 줄어듦

---

## 24. 공유 링크 만들기

```js
buildShareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('challenge', '1');
    url.searchParams.set('mode', this.mode);
    url.searchParams.set('score', Math.max(0, Math.round(this.score)));
    url.searchParams.set('nick', this.nick);
    return url.toString();
}
```

공유 링크 예시:

```txt
https://example.netlify.app/?challenge=1&mode=rush&score=12345&nick=PLAYER
```

---

## 25. 공유 링크로 들어온 사람에게 도전 표시

```js
loadChallenge() {
    const params = new URLSearchParams(window.location.search);
    if(params.get('challenge') !== '1') return;

    const mode = params.get('mode') === "rush" ? "rush" : "classic";
    const score = Math.max(0, Math.min(999999, Math.round(Number(params.get('score')) || 0)));
    const nick = this.cleanNick(params.get('nick') || "FRIEND") || "FRIEND";

    if(!score) return;

    this.setMode(mode);

    const banner = document.getElementById('challenge-banner');
    banner.classList.remove('hidden');
    banner.innerHTML = `<strong>${this.escapeHTML(nick)}</strong>님의 ${this.getModeLabel(mode)} 기록 <strong>${score.toLocaleString()}점</strong>에 도전!`;
}
```

역할:

- URL에서 점수, 모드, 닉네임을 읽음
- 해당 모드로 자동 선택
- 시작 화면에 도전 문구 표시

---

## 26. 게임 루프

```js
loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const fevering = this.fever >= 100;

    // 사과 그리기
    // 드래그 박스 그리기
    // 피버 문구 그리기
    // 이펙트 그리기
    // 파티클 그리기

    requestAnimationFrame(() => this.loop());
}
```

`requestAnimationFrame`은 브라우저가 화면을 다시 그릴 타이밍에 맞춰 실행됩니다.

게임에서는 보통:

```txt
상태 업데이트
→ 화면 지우기
→ 새 화면 그리기
→ 다음 프레임 예약
```

순서로 동작합니다.

---

## 27. 배포 체크리스트

GitHub Pages에 올릴 때는 현재 구조 기준으로:

```txt
index.html
docs/images/apple-burst-home.png
.github/workflows/deploy-pages.yml
```

`main` 브랜치에 푸시하면 GitHub Actions가 `_site` 폴더를 만들고 Pages에 배포합니다.

저장소 설정 확인:

```txt
Settings > Pages > Build and deployment > Source: GitHub Actions
```

공유 링크 테스트:

```txt
https://seung-won-yu.github.io/apple-burst/?challenge=1&mode=rush&score=12345&nick=유승원
```

Firebase 확인:

```txt
Realtime Database
└─ ranks
   ├─ rush_닉네임
   └─ classic_닉네임
```

---

## 28. 다음에 더 공부하면 좋은 주제

- HTML 구조
- CSS 미디어쿼리
- Canvas 2D API
- JavaScript 객체
- 이벤트 처리
- Firebase Realtime Database
- transaction 저장 방식
- 누적합 알고리즘
- 모바일 터치 이벤트
- 클라이언트 보안의 한계
