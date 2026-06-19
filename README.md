# 지하철 로케이션

서울 열린데이터광장 실시간 지하철 위치 API를 사용하는 웹앱 프로토타입입니다.

## 실행

`index.html`을 브라우저로 열면 바로 실행됩니다. 로컬 서버로 확인하려면 다음처럼 실행할 수 있습니다.

```powershell
python -m http.server 8080
```

브라우저에서 `http://localhost:8080`을 열면 됩니다.

## 데이터

- 로컬에서는 브라우저에 저장된 인증키가 있으면 자동으로 사용하고, 없으면 공식 샘플 인증키 `sample`을 사용합니다.
- Cloudflare Pages에서는 `SEOUL_SUBWAY_API_KEY` 환경변수에 서울 열린데이터광장 인증키를 저장하면 앱 화면이나 프론트 JS에 키를 노출하지 않고 실시간 위치를 호출합니다.
- 공공데이터포털 TAGO 지하철정보 키는 `TAGO_SUBWAY_API_KEY` 환경변수에 저장합니다. 이 키는 역 검색, 출구별 버스노선, 출구별 주변시설, 역별 시간표 조회용이며 실시간 열차 위치 API는 아닙니다.
- 샘플 키는 API 제한 때문에 노선별 최대 5건만 표시됩니다.
- 현재 앱에 포함한 지원 노선: 1-9호선, 경의중앙선, 공항철도, 경춘선, 수인분당선, 신분당선, 우이신설선, 서해선, 신림선, 경강선, GTX-A, 용인 에버라인.
- 용인 에버라인은 앱 탭에 포함되어 있지만, 서울 열린데이터광장 실시간 위치 API에서는 현재 0건으로 응답될 수 있습니다.
- `편성`은 공식 실시간 위치 API의 열차번호에 노선별 통상 차량 수를 붙여 표시합니다. 실제 차량 편성 ID가 필요한 경우 별도 차량 데이터가 필요합니다.

공식 API: [서울시 지하철 실시간 열차 위치정보](http://swopenapi.seoul.go.kr/api/subway/sample/json/realtimePosition/0/5/2%ED%98%B8%EC%84%A0)

## Cloudflare Pages 연결

- Production URL: `https://train-6yt.pages.dev/`
- Framework preset: `None`
- Build command: 비워두기
- Build output directory: `/` 또는 `.`
- Environment variables:
  - `SEOUL_SUBWAY_API_KEY`: 서울 열린데이터광장 지하철 실시간 열차 위치정보 인증키
  - `TAGO_SUBWAY_API_KEY`: 공공데이터포털 국토교통부_(TAGO)_지하철정보 인증키
- `functions/api/subway/[[path]].js`가 서울 열린데이터광장 HTTP API를 프록시하고 서버에서 인증키를 붙이므로 HTTPS 배포에서도 키가 화면에 보이지 않습니다.
- `functions/api/tago/subway/[[path]].js`가 TAGO 지하철정보 API를 프록시합니다. 예: `/api/tago/subway/GetKwrdFndSubwaySttnList?subwayStationName=강남`
