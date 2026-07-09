# 사과 팡팡

합이 10이 되는 사과를 드래그해서 터뜨리는 캐주얼 브라우저 게임입니다. GitHub Pages로 정적 파일을 배포하고, Firebase Realtime Database에 랭킹을 저장합니다.

운영 주소: https://seung-won-yu.github.io/apple-burst/

![사과 팡팡 시작 화면](docs/images/apple-burst-home.png)

## 기능

- 캔버스 기반 사과 퍼즐 게임
- 60초 스피드 / 120초 클래식 모드
- 닉네임별 최고점 랭킹 저장
- 전체 / 오늘 랭킹 탭
- 공유 링크로 친구 기록에 도전
- GitHub Actions 기반 GitHub Pages 자동 배포

## 구조

```txt
GitHub push
→ GitHub Actions
→ GitHub Pages 배포
→ 플레이어 브라우저에서 게임 실행
→ Firebase Realtime Database에 랭킹 저장
```

GitHub Pages는 정적 파일만 호스팅합니다. 점수 저장은 Firebase가 담당합니다.

## 로컬 실행

```sh
python3 -m http.server 4173
```

브라우저에서 `http://localhost:4173`을 열면 됩니다. 로컬에서 Firebase 랭킹까지 테스트하려면 `firebase-config.example.js`를 복사해 `firebase-config.js`를 만들고 실제 Firebase 웹 앱 설정을 넣습니다.

```sh
cp firebase-config.example.js firebase-config.js
```

`firebase-config.js`는 Git에 올리지 않습니다.

## 배포

`main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 자동으로 GitHub Pages에 배포합니다.

GitHub 저장소 설정:

1. `Settings > Pages`로 이동
2. `Build and deployment > Source`를 `GitHub Actions`로 설정
3. Actions 실행 완료 후 운영 주소 접속

Firebase 설정은 GitHub Actions Secret으로 주입합니다.

- Secret 이름: `FIREBASE_CONFIG_JSON`
- Secret 값: Firebase 웹 앱 설정 JSON

배포 중 Secret이 있으면 `firebase-config.js`가 생성되고, 없으면 랭킹 저장 없이 로컬 최고점만 동작합니다.

## Firebase

사용 중인 Firebase 프로젝트:

- Project ID: `apple-game-d1038`
- Realtime Database: `apple-game-d1038-default-rtdb`
- Database URL: `https://apple-game-d1038-default-rtdb.asia-southeast1.firebasedatabase.app`

Realtime Database rules 배포:

```sh
npx firebase-tools deploy --only database --project apple-game-d1038
```

랭킹 데이터는 `ranks` 아래에 저장됩니다. 닉네임별 최고점만 갱신되며, 더 낮은 점수로는 기존 기록을 덮어쓰지 않습니다.
