# 지하철 로케이션

서울 열린데이터광장 실시간 지하철 위치 API를 사용하는 웹앱 프로토타입입니다.

## 실행

`index.html`을 브라우저로 열면 바로 실행됩니다. 로컬 서버로 확인하려면 다음처럼 실행할 수 있습니다.

```powershell
python -m http.server 8080
```

브라우저에서 `http://localhost:8080`을 열면 됩니다.

## 데이터

- 기본값은 공식 샘플 인증키 `sample`입니다.
- 샘플 키는 API 제한 때문에 노선별 최대 5건만 표시됩니다.
- 전체 열차를 보려면 서울 열린데이터광장 인증키를 앱 상단 `API 인증키`에 저장하세요.
- 현재 앱에 포함한 지원 노선: 1-9호선, 경의중앙선, 공항철도, 경춘선, 수인분당선, 신분당선, 우이신설선, 서해선, 신림선, 경강선, GTX-A, 용인 에버라인.
- 용인 에버라인은 앱 탭에 포함되어 있지만, 서울 열린데이터광장 실시간 위치 API에서는 현재 0건으로 응답될 수 있습니다.
- `편성`은 공식 실시간 위치 API의 열차번호에 노선별 통상 차량 수를 붙여 표시합니다. 실제 차량 편성 ID가 필요한 경우 별도 차량 데이터가 필요합니다.

공식 API: [서울시 지하철 실시간 열차 위치정보](http://swopenapi.seoul.go.kr/api/subway/sample/json/realtimePosition/0/5/2%ED%98%B8%EC%84%A0)

## Cloudflare Pages 연결

- Framework preset: `None`
- Build command: 비워두기
- Build output directory: `/` 또는 `.`
- `functions/api/subway/[[path]].js`가 서울 열린데이터광장 HTTP API를 프록시하므로 HTTPS 배포에서도 실시간 위치 호출이 동작합니다.
- 배포 후 앱 상단 `API 인증키`에 서울 열린데이터광장 인증키를 저장하면 샘플 제한 없이 더 많은 열차를 볼 수 있습니다.
