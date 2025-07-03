# 개발 견적 산출 Agent

React로 구현된 개발 견적 산출 웹 애플리케이션입니다. 사용자의 개발 요청사항을 입력받아 GPT API를 통해 상세한 개발 견적서를 생성합니다.

## 주요 기능

- **상/좌/우 분할 레이아웃**: 직관적인 사용자 인터페이스
- **개발 요청사항 입력**: 필수 입력 필드로 구성
- **예산 입력**: 선택적 입력 필드
- **실시간 견적 생성**: GPT API를 활용한 자동 견적서 작성
- **반응형 디자인**: 모바일 및 태블릿 지원

## 시작하기

### 필수 요구사항

- Node.js 16.0 이상
- npm 또는 yarn

### 설치 및 실행

1. 의존성 설치
```bash
npm install
```

2. 환경 변수 설정
```bash
cp .env.example .env
```
`.env` 파일에서 `REACT_APP_OPENAI_API_KEY`에 실제 OpenAI API 키를 입력하세요.

3. 개발 서버 실행
```bash
npm start
```

4. 브라우저에서 `http://localhost:3000`으로 접속

### 프로덕션 빌드

```bash
npm run build
```

## Vercel 배포

1. Vercel 계정 연결 및 프로젝트 배포
```bash
vercel --prod
```

2. 환경 변수 설정
   - Vercel 대시보드에서 프로젝트 설정
   - Environment Variables에 `REACT_APP_OPENAI_API_KEY` 추가

## 프로젝트 구조

```
estimate/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # 메인 컴포넌트
│   ├── App.css         # 스타일링
│   ├── index.js        # React 진입점
│   └── index.css       # 전역 스타일
├── package.json
├── vercel.json         # Vercel 배포 설정
└── README.md
```

## 사용법

1. **개발 요청사항 입력**: 왼쪽 영역에 개발하고자 하는 내용을 상세히 입력
2. **견적 금액 입력**: 예상 예산이 있다면 입력 (선택사항)
3. **견적 산출**: "개발 견적 산출" 버튼 클릭
4. **결과 확인**: 오른쪽 영역에서 생성된 견적서 확인

## 기술 스택

- **Frontend**: React 18, CSS3
- **API**: OpenAI GPT API
- **HTTP Client**: Axios
- **Build Tool**: Create React App
- **Deployment**: Vercel

## 라이선스

MIT License 