# API 키 보안 관리 가이드

## 현재 상황 분석

현재 프로젝트는 **클라이언트 사이드**에서 직접 OpenAI API를 호출하고 있습니다. 이는 개발/테스트 목적으로는 편리하지만, **프로덕션 환경에서는 보안상 권장되지 않습니다**.

## 문제점

1. **API 키 노출**: 브라우저에서 API 키가 노출됩니다
2. **CORS 이슈**: 브라우저에서 직접 API 호출 시 CORS 문제 발생 가능
3. **사용량 제어 어려움**: 클라이언트에서 API 사용량 제어가 어렵습니다

## 해결 방법

### 방법 1: 현재 구조 유지 (개발/테스트용)

`.env.local` 파일 설정:
```bash
REACT_APP_OPENAI_API_KEY=sk-your-api-key-here
```

### 방법 2: 백엔드 API 서버 구성 (프로덕션 권장)

#### 2-1. Express 서버 생성
```javascript
// server.js
const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');

const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // 서버 환경변수
});

app.use(cors());
app.use(express.json());

app.post('/api/estimate', async (req, res) => {
  try {
    const { requirements, budget } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: req.body.prompt }],
      max_tokens: 2000,
    });
    
    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

#### 2-2. React 앱에서 백엔드 호출
```javascript
// React 컴포넌트에서
const response = await axios.post('/api/estimate', {
  requirements,
  budget,
  prompt
});
setEstimateResult(response.data.result);
```

### 방법 3: Vercel Serverless Functions 사용

#### 3-1. API 라우트 생성
```javascript
// api/estimate.js
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });
    
    res.status(200).json({ result: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## 권장사항

1. **개발/테스트**: 방법 1 사용 (`REACT_APP_OPENAI_API_KEY`)
2. **프로덕션**: 방법 2 또는 3 사용 (서버 사이드 API 호출)
3. **Vercel 배포**: 방법 3이 가장 적합 (Serverless Functions)

## Vercel 환경 변수 설정

Vercel에 배포할 때는 대시보드에서 환경 변수를 설정:
- `OPENAI_API_KEY` (서버 사이드용, REACT_APP_ 접두사 없음)
- 또는 `REACT_APP_OPENAI_API_KEY` (클라이언트 사이드용) 