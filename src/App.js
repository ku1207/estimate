import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

// 견적서 문서 컴포넌트
function EstimateDocument({ data }) {
  // 오늘 날짜 생성
  const today = new Date().toISOString().split('T')[0];
  
  // 단가 테이블 정의 (기존 값 × 20.6)
  const unitPrices = {
    'IT기획자': { '초급': 7884897, '중급': 11597658, '고급': 17754460 },
    'IT컨설턴트': { '초급': 5065664, '중급': 9706020, '고급': 11055752 },
    '업무분석가': { '초급': 8101774, '중급': 8997359, '고급': 9980721 },
    '데이터분석가': { '초급': 5899099, '중급': 7751183, '고급': 9753338 },
    'PM': { '초급': 6711398, '중급': 9145473, '고급': 12277662 },
    'IT아키텍트': { '초급': 7267515, '중급': 10147745, '고급': 11881297 },
    '개발자': { '초급': 4183820, '중급': 6727260, '고급': 8497109 },
    'UX디자이너': { '초급': 3430847, '중급': 5176204, '고급': 8396848 },
    '응용SW개발자': { '초급': 4513192, '중급': 6943456, '고급': 9249894 },
    '시스템SW개발자': { '초급': 4081911, '중급': 6099042, '고급': 7227798 },
    '정보시스템운용자': { '초급': 5845847, '중급': 10154626, '고급': 16133323 },
    'IT지원기술자': { '초급': 3533806, '중급': 5058021, '고급': 5827060 },
    'IT마케터': { '초급': 7125458, '중급': 11056618, '고급': 15837404 },
    'IT품질관리자': { '초급': 7015165, '중급': 9692094, '고급': 12603554 },
    'IT테스터': { '초급': 2890983, '중급': 3570557, '고급': 3910107 },
    'IT감리': { '초급': 9048467, '중급': 10351376, '고급': 11370005 },
    '정보보안전문가': { '초급': 6945826, '중급': 9857100, '고급': 11088382 }
  };
  
  // role 매핑 테이블 (허용 목록 → 단가 테이블 키)
  const roleMapping = {
    'IT PM': 'PM',
    'UI/UX 기획/개발': 'UX디자이너',
    'UI/UX 디자인': 'UX디자이너',
    '정보시스템 운용자': '정보시스템운용자'
  };
  
  // 단가 조회 함수
  const getUnitPrice = (role, grade) => {
    const mappedRole = roleMapping[role] || role;
    return unitPrices[mappedRole]?.[grade] || 0;
  };
  
  // 인력 투입 계획 데이터 생성
  const generateStaffRows = () => {
    if (!data.team?.members) return [];
    
    const rows = [];
    data.team.members.forEach((member) => {
      if (member.staff && Array.isArray(member.staff)) {
        member.staff.forEach((staff) => {
          const unitPrice = getUnitPrice(member.role, staff.grade);
          const rate = staff.rate || 100; // 기본값 100%
          const totalAmount = Math.round(staff.count * (rate / 100) * staff.months * unitPrice);
          
          rows.push({
            role: member.role,
            grade: staff.grade,
            count: staff.count,
            rate: rate,
            months: staff.months,
            unitPrice: unitPrice,
            totalAmount: totalAmount
          });
        });
      }
    });
    
    return rows;
  };
  
  const staffRows = generateStaffRows();
  
  // 총 견적금액 계산
  const totalEstimate = staffRows.reduce((sum, row) => sum + row.totalAmount, 0);
  
  // 3번째 테이블 계산
  const directLaborCost = totalEstimate; // 직접 인건비 합계
  const overheadCost = Math.round(directLaborCost * 1.10); // 제경비
  const technicalFee = Math.round((directLaborCost + overheadCost) * 0.20); // 기술료
  const totalDevelopmentCost = directLaborCost + overheadCost + technicalFee; // 개발 비용 합계
  
  // 4번째 테이블 계산
  const supplyPrice = totalDevelopmentCost; // 공급가
  const truncatedAmount = supplyPrice % 100000; // 절사금액 (10만 단위 이하)
  const adjustedSupplyPrice = supplyPrice - truncatedAmount; // 절사된 공급가
  const vat = Math.round(adjustedSupplyPrice * 0.10); // 부가가치세 (10%)
  const totalPrice = supplyPrice - truncatedAmount + vat; // 총금액 (공급가 - 절사금액 + 부가가치세)
  
  return (
    <div className="estimate-document">
      <h1 className="estimate-title">견적서</h1>
      
      <table className="estimate-info-table">
        <tbody>
          <tr>
            <td className="label-cell">견적명</td>
            <td className="value-cell">{data.title || '-'}</td>
            <td className="label-cell">견적일</td>
            <td className="value-cell">{today}</td>
          </tr>
          <tr>
            <td className="label-cell">유효기간</td>
            <td className="value-cell">견적일로부터 1개월</td>
            <td className="label-cell">개발기간</td>
            <td className="value-cell">{data.overview?.duration || '-'}</td>
          </tr>
          <tr>
            <td className="label-cell">무상보수</td>
            <td className="value-cell">검수 완료 후 3개월</td>
            <td className="label-cell">견적금액</td>
            <td className="value-cell estimate-amount">{totalPrice.toLocaleString()}원</td>
          </tr>
        </tbody>
      </table>
      
      <div className="vat-notice">(부가세 미포함)</div>
      
      <table className="staff-table">
        <thead>
          <tr>
            <th>항목</th>
            <th>기술등급</th>
            <th>투입인원</th>
            <th>업무 투입률</th>
            <th>작업기간</th>
            <th>단가</th>
            <th>금액</th>
          </tr>
        </thead>
        <tbody>
          {staffRows.length > 0 ? (
            staffRows.map((row, index) => (
              <tr key={index}>
                <td>{row.role}</td>
                <td>{row.grade}</td>
                <td>{row.count}명</td>
                <td>{row.rate}%</td>
                <td>{row.months}개월</td>
                <td>{row.unitPrice.toLocaleString()}원</td>
                <td>{row.totalAmount.toLocaleString()}원</td>
              </tr>
            ))
                     ) : (
             <tr>
               <td colSpan="7" className="no-data">데이터가 없습니다.</td>
             </tr>
           )}
           {staffRows.length > 0 && (
             <tr className="total-row">
               <td colSpan="6" className="total-label">인건비 합계</td>
               <td className="total-amount">{totalEstimate.toLocaleString()}원</td>
             </tr>
                      )}
         </tbody>
       </table>
       
       <table className="cost-breakdown-table">
         <tbody>
           <tr>
             <td className="cost-label">1. 직업 인건비 합계</td>
             <td className="cost-amount">{directLaborCost.toLocaleString()}원</td>
           </tr>
           <tr>
             <td className="cost-label">2. 제경비 ( 직업 인건비 합계 X 110% )</td>
             <td className="cost-amount">{overheadCost.toLocaleString()}원</td>
           </tr>
           <tr>
             <td className="cost-label">3. 기술료 ( 직업 인건비 + 제경비 ) X 20%</td>
             <td className="cost-amount">{technicalFee.toLocaleString()}원</td>
           </tr>
           <tr>
             <td className="cost-label">4. 직접경비 ( 외부 기술 도입시 발생한 실비 )</td>
             <td className="cost-amount-right">-</td>
           </tr>
           <tr className="total-cost-row">
             <td className="total-cost-label">개발 비용 합계</td>
             <td className="total-cost-amount">{totalDevelopmentCost.toLocaleString()}원</td>
           </tr>
         </tbody>
       </table>
       
       <table className="final-price-table">
         <tbody>
           <tr>
             <td className="price-label">공급가</td>
             <td className="price-amount">{supplyPrice.toLocaleString()}원</td>
           </tr>
           <tr>
             <td className="price-label">절사금액</td>
             <td className="price-amount">{truncatedAmount.toLocaleString()}원</td>
           </tr>
           <tr>
             <td className="price-label">부가가치세</td>
             <td className="price-amount">{vat.toLocaleString()}원</td>
           </tr>
           <tr className="final-total-row">
             <td className="final-total-label">총금액</td>
             <td className="final-total-amount">{totalPrice.toLocaleString()}원</td>
           </tr>
         </tbody>
       </table>
       
       <table className="scope-table">
         <thead>
           <tr>
             <th className="scope-header">견적 포함 사항</th>
             <th className="scope-header">견적 미포함 사항</th>
           </tr>
         </thead>
         <tbody>
           <tr>
             <td className="scope-content">
               <ul className="scope-list">
                 {data.scope?.included ? (
                   data.scope.included.map((item, index) => (
                     <li key={index}>{item}</li>
                   ))
                 ) : (
                   <li>-</li>
                 )}
               </ul>
             </td>
             <td className="scope-content">
               <ul className="scope-list">
                 {data.scope?.excluded ? (
                   data.scope.excluded.map((item, index) => (
                     <li key={index}>{item}</li>
                   ))
                 ) : (
                   <li>-</li>
                 )}
               </ul>
             </td>
           </tr>
         </tbody>
       </table>
       
       <div className="reference-title">참고사항</div>
       
       <table className="reference-table">
         <tbody>
           <tr>
             <td className="reference-content">
               <ul className="reference-list">
                 <li>개발용역비 산출 근거: 2025년 적용 SW기술자 평균임금 단가</li>
                 <li>SW기술자 평균임금은 소프트웨어진흥법 제46조(적정 대가 지급 등) 4항 '소프트웨어기술자의 인건비 기준'을 지칭함</li>
               </ul>
             </td>
           </tr>
         </tbody>
       </table>
     </div>
   );
 }

function App() {
  const [requirements, setRequirements] = useState('');
  const [estimateResult, setEstimateResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);

  // PDF 저장 함수
  const handlePdfDownload = async () => {
    if (!estimateResult || typeof estimateResult !== 'object') {
      alert('견적서 데이터가 없습니다. 먼저 견적서를 생성해주세요.');
      return;
    }

    try {
      const element = document.querySelector('.estimate-result');
      if (!element) {
        alert('견적서 영역을 찾을 수 없습니다.');
        return;
      }

      // 스크롤 영역 전체 캡처를 위한 임시 스타일 변경
      const originalStyle = {
        height: element.style.height,
        overflow: element.style.overflow,
        maxHeight: element.style.maxHeight
      };

      // 전체 내용을 보이도록 임시 스타일 적용
      element.style.height = 'auto';
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';

      // 잠시 대기하여 스타일 변경이 적용되도록 함
      await new Promise(resolve => setTimeout(resolve, 100));

      // 5번째 테이블 (scope-table) 위치 확인
      const scopeTable = element.querySelector('.scope-table');
      let scopeTableTop = 0;
      
      if (scopeTable) {
        // 5번째 테이블의 상단 위치를 픽셀로 가져오기
        const elementRect = element.getBoundingClientRect();
        const scopeTableRect = scopeTable.getBoundingClientRect();
        scopeTableTop = scopeTableRect.top - elementRect.top;
      }

      // HTML을 캔버스로 변환
      const canvas = await html2canvas(element, {
        scale: 2, // 해상도 개선
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: element.scrollHeight, // 전체 높이 사용
        width: element.scrollWidth,   // 전체 너비 사용
        scrollX: 0,
        scrollY: 0
      });

      // 원래 스타일로 복원
      element.style.height = originalStyle.height;
      element.style.overflow = originalStyle.overflow;
      element.style.maxHeight = originalStyle.maxHeight;

      // PDF 생성
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 이미지 크기 계산
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 5번째 테이블 시작점을 픽셀에서 mm로 변환 (canvas의 scale factor 고려)
      const scopeTableTopPx = scopeTableTop * 2; // scale factor 적용
      const scopeTableTopMm = (scopeTableTopPx * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // 5번째 테이블 위치가 유효한 경우에만 페이지 분할
      if (scopeTableTopMm > 20 && scopeTableTopMm < pageHeight * 0.95) {
        // 첫 번째 페이지: 5번째 테이블 이전까지
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // 두 번째 페이지: 5번째 테이블부터 시작
        if (heightLeft > 0) {
          pdf.addPage();
          position = heightLeft - imgHeight;
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          
          // 나머지 페이지들 처리
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }
        }
      } else {
        // 5번째 테이블 위치를 찾지 못한 경우 기본 동작
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // 여러 페이지 처리
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      // 파일 저장
      const fileName = `견적서_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  // 워드 파일 생성 함수
  const handleWordDownload = async () => {
    if (!estimateResult || typeof estimateResult !== 'object') {
      alert('견적서 데이터가 없습니다. 먼저 견적서를 생성해주세요.');
      return;
    }

    setIsGeneratingWord(true);
    try {
      // GPT API 호출하여 견적서 설명서 생성
      const prompt = `###지시사항
주어진 견적서 JSON을 해석하여 견적서 설명서를 작성하십시오. 설명서는 영업자가 내용을 쉽게 이해하도록 전문 용어 등은 풀어서 설명하고 한글로 작성하십시오. **견적서의 내용을 절대 변경하지마십시오.**

###작성지침
1. 출력 형식
 - 결과는 순수 JSON(UTF-8) 만 출력합니다.
 - 최상위 키는 ["projectOverview", "scopeOfWork", "keyFeaturesList", "timelineAndMajorMilestones", "teamCompositionAndRoles", "paymentScheduleAndTerms", "assumptionsAndExclusions", "internalDevelopmentTeamActionItems" ] 의 8개이며 순서 고정입니다.
 - 모든 키와 하위 필드는 반드시 출력하며, 값이 없거나 파악 불가한 경우 단일 문자열 "-" 로 기재합니다.
 - 날짜는 YYYY-MM-DD, 금액은 따옴표 없는 숫자(원화 기준)를 사용합니다.

2. 필수 필드 및 값 규칙
(1) projectOverview
 - 프로젝트명·목표·기간·주요 산출물을 한눈에 이해할 수 있도록 2~3줄로 요약
 - 목표는 "무엇을 해결/달성하려는가"를 비즈니스 관점에서 기술
 - 기간은 전체 일정(예: "2025-01-01 ~ 2025-06-30", "6 개월") 둘 다 제시하면 가장 친절
 - 주요 산출물은 유형(웹서비스, 관리자 콘솔 등)만 간결히 나열
(2) scopeOfWork
 - 문장 대신 리스트 형태 권장
  (1) 실제로 개발·제공할 항목으로 기입하십시오.
  (2) 고객이 오해하기 쉬운 항목을 명시적으로 제외하십시오.
 - 각 항목은 줄글 형태로 기입하십시오.(예: "데이터 수집 자동화")
(3) keyFeaturesList
 - scope.included 중 기능성 요소를 세분화해 나열
 - 우선순위(필수/선택)나 릴리스 단계(MVP, v2) 표기가 있으면 함께 기재
 - 기술 스택이 직관적이면 괄호로 덧붙여도 무방. 예) 실시간 대시보드(React + D3.js)
(4) timelineAndMajorMilestones
 - 각 마일스톤을 "단계명: 시작 ~ 종료 — 산출물" 형식으로 정렬
 - 날짜가 확정되지 않았으면 상대 기간('T + 3 주')을 사용
(5) teamCompositionAndRoles
 - 역할별로 등급·인원·투입 인월·업무 비중(%) 을 서술. 예) IT PM — 고급 1명 × 6M (10 %)
(6) paymentScheduleAndTerm
 - "착수금 30 % / 중도금 40 % / 잔금 30 %" 형식으로 나열
 - 납부 시점(계약일, MVP 완료 후 등) 기재 시 가독성 ↑
(7) assumptionsAndExclusions
 - 전제(Assumptions)와 제외(Exclusions)를 두 구역으로 분리
 - 전제: "디자인 시안은 고객 제공" 등 견적이 성립되는 전제조건
 - 제외: "오프라인 POS 교체는 별도 비용" 등 견적에 성립되지 않은 조건
(8) internalDevelopmentTeamActionItems
 - 일정 초과 위험, 비허용 역할, 결제 비율 오류 등 검토 결과를 항목별로 명시
 - 가급적 짧은 액션 아이템 형식
 - 특이 리스크가 없으면 "특이 리스크 없음" 한 줄로 대체

###출력형태
{
  "projectOverview": [
    "-"
  ],
  "scopeOfWork": [
    "-"
  ],
  "keyFeaturesList": [
    "-"
  ],
  "timelineAndMajorMilestones": [
    "-"
  ],
  "teamCompositionAndRoles": [
    "-"
  ],
  "paymentScheduleAndTerms": [
    "-"
  ],
  "assumptionsAndExclusions": [{"assumptions":["-"]},{"exclusions":["-"]}],
  "internalDevelopmentTeamActionItems": [
    "-"
  ]
}

###견적서
${JSON.stringify(estimateResult, null, 2)}`;

      // GPT API 호출
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        alert('OpenAI API 키가 설정되지 않았습니다. .env.local 파일에 REACT_APP_OPENAI_API_KEY를 설정해주세요.');
        return;
      }

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4.1",
        messages: [{ 
          role: "user", 
          content: prompt 
        }],
        max_tokens: 9000,
        temperature: 0.4
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const gptResponse = response.data.choices[0].message.content;
      console.log('GPT 원본 응답:', gptResponse);
      
      // JSON 응답 정리 (```json``` 마크다운 제거)
      let cleanedResponse = gptResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('정리된 응답:', cleanedResponse);
      
      // JSON 응답 파싱
      let explanationData;
      try {
        explanationData = JSON.parse(cleanedResponse);
        console.log('파싱된 데이터:', explanationData);
      } catch (parseError) {
        console.error('GPT 응답 JSON 파싱 실패:', parseError);
        console.error('파싱 시도한 텍스트:', cleanedResponse);
        alert('견적서 설명서 생성 중 JSON 파싱 오류가 발생했습니다.\n\n브라우저 콘솔을 확인해주세요.');
        return;
      }

      console.log('워드 문서 생성 시작...');
      
      // 워드 문서 생성
      const children = [
        new Paragraph({
          children: [
            new TextRun({
              text: "견적서 설명",
              bold: true,
              size: 40  // 20pt
            }),
          ],
          alignment: "center",
          spacing: { after: 600 }  // 3줄 공백
        }),
      ];

      // 1. 프로젝트 개요
      console.log('1. 프로젝트 개요 섹션 생성 중...');
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "1.프로젝트 개요",
              bold: true,
              size: 24  // 12pt
            }),
          ],
          spacing: { after: 100 }
        })
      );

      if (explanationData.projectOverview && Array.isArray(explanationData.projectOverview)) {
        console.log('프로젝트 개요 데이터:', explanationData.projectOverview);
        explanationData.projectOverview.forEach(item => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${item}`,
                  size: 20  // 10pt
                }),
              ],
              spacing: { after: 50 }
            })
          );
        });
      } else {
        console.warn('projectOverview 데이터가 없거나 배열이 아닙니다:', explanationData.projectOverview);
      }

      // 2줄 공백
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 20 })],
          spacing: { after: 400 }
        })
      );

      // 2. 작업 범위
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "2. 작업 범위",
              bold: true,
              size: 24  // 12pt
            }),
          ],
          spacing: { after: 100 }
        })
      );

      if (explanationData.scopeOfWork && Array.isArray(explanationData.scopeOfWork)) {
        explanationData.scopeOfWork.forEach(item => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${item}`,
                  size: 20  // 10pt
                }),
              ],
              spacing: { after: 50 }
            })
          );
        });
      }

      // 2줄 공백
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 20 })],
          spacing: { after: 400 }
        })
      );

      // 3. 주요 기능 목록
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "3. 주요 기능 목록",
              bold: true,
              size: 24  // 12pt
            }),
          ],
          spacing: { after: 100 }
        })
      );

      if (explanationData.keyFeaturesList && Array.isArray(explanationData.keyFeaturesList)) {
        explanationData.keyFeaturesList.forEach(item => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${item}`,
                  size: 20  // 10pt
                }),
              ],
              spacing: { after: 50 }
            })
          );
        });
      }

      // 2줄 공백
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 20 })],
          spacing: { after: 400 }
        })
      );

      // 4. 일정(타임라인) 및 주요 마일스톤
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "4. 일정(타임라인) 및 주요 마일스톤",
              bold: true,
              size: 24  // 12pt
            }),
          ],
          spacing: { after: 100 }
        })
      );

      if (explanationData.timelineAndMajorMilestones && Array.isArray(explanationData.timelineAndMajorMilestones)) {
        explanationData.timelineAndMajorMilestones.forEach(item => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${item}`,
                  size: 20  // 10pt
                }),
              ],
              spacing: { after: 50 }
            })
          );
        });
      }

      // 2줄 공백
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 20 })],
          spacing: { after: 400 }
        })
      );

      // 5. 인력 구성과 역할
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "5. 인력 구성과 역할",
              bold: true,
              size: 24  // 12pt
            }),
          ],
          spacing: { after: 100 }
        })
      );

      if (explanationData.teamCompositionAndRoles && Array.isArray(explanationData.teamCompositionAndRoles)) {
        explanationData.teamCompositionAndRoles.forEach(item => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${item}`,
                  size: 20  // 10pt
                }),
              ],
              spacing: { after: 50 }
            })
          );
        });
      }

      // 2줄 공백
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 20 })],
          spacing: { after: 400 }
        })
      );

      // 6. 결제(납부) 일정·조건
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "6. 결제(납부) 일정·조건",
              bold: true,
              size: 24  // 12pt
            }),
          ],
          spacing: { after: 100 }
        })
      );

      if (explanationData.paymentScheduleAndTerms && Array.isArray(explanationData.paymentScheduleAndTerms)) {
        explanationData.paymentScheduleAndTerms.forEach(item => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${item}`,
                  size: 20  // 10pt
                }),
              ],
              spacing: { after: 50 }
            })
          );
        });
      }

      // 2줄 공백
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 20 })],
          spacing: { after: 400 }
        })
      );

      // 7. 가정사항과 제외사항
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "7. 가정사항과 제외사항",
              bold: true,
              size: 24  // 12pt
            }),
          ],
          spacing: { after: 100 }
        })
      );

      console.log('7. 가정사항과 제외사항 섹션 생성 중...');
      console.log('assumptionsAndExclusions 데이터:', explanationData.assumptionsAndExclusions);
      
      if (explanationData.assumptionsAndExclusions && Array.isArray(explanationData.assumptionsAndExclusions)) {
        explanationData.assumptionsAndExclusions.forEach((section, index) => {
          console.log(`섹션 ${index + 1} 처리 중:`, section);
          
          if (section && typeof section === 'object' && section.assumptions && Array.isArray(section.assumptions)) {
            console.log('견적 포함사항 처리 중:', section.assumptions);
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "[견적 포함사항]",
                    bold: true,
                    size: 22  // 11pt
                  }),
                ],
                spacing: { after: 50 }
              })
            );
            section.assumptions.forEach(assumption => {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${assumption}`,
                      size: 20  // 10pt
                    }),
                  ],
                  spacing: { after: 50 }
                })
              );
            });
            
            // 1줄 공백
            children.push(
              new Paragraph({
                children: [new TextRun({ text: "", size: 20 })],
                spacing: { after: 200 }
              })
            );
          }
          
          if (section && typeof section === 'object' && section.exclusions && Array.isArray(section.exclusions)) {
            console.log('견적 제외사항 처리 중:', section.exclusions);
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "[견적 제외사항]",
                    bold: true,
                    size: 22  // 11pt
                  }),
                ],
                spacing: { after: 50 }
              })
            );
            section.exclusions.forEach(exclusion => {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${exclusion}`,
                      size: 20  // 10pt
                    }),
                  ],
                  spacing: { after: 50 }
                })
              );
            });
          }
        });
      } else {
        console.warn('assumptionsAndExclusions 데이터가 없거나 배열이 아닙니다:', explanationData.assumptionsAndExclusions);
      }

      // 2줄 공백
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 20 })],
          spacing: { after: 400 }
        })
      );

      // 8. 내부 개발팀 확인 필요사항
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "8. 내부 개발팀 확인 필요사항",
              bold: true,
              size: 24  // 12pt
            }),
          ],
          spacing: { after: 100 }
        })
      );

      if (explanationData.internalDevelopmentTeamActionItems && Array.isArray(explanationData.internalDevelopmentTeamActionItems)) {
        explanationData.internalDevelopmentTeamActionItems.forEach(item => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${item}`,
                  size: 20  // 10pt
                }),
              ],
              spacing: { after: 50 }
            })
          );
        });
      }

      // 2줄 공백 (마지막 섹션)
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "", size: 20 })],
          spacing: { after: 400 }
        })
      );

      console.log('워드 문서 객체 생성 중...');
      
      // 워드 문서 생성
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: children,
          },
        ],
      });

      console.log('워드 파일 블롭 생성 중...');
      
      // 워드 파일 생성 및 저장 (브라우저 환경에서는 toBlob 사용)
      const blob = await Packer.toBlob(doc);
      const fileName = `견적서_설명서_${new Date().toISOString().split('T')[0]}.docx`;
      
      console.log('파일 다운로드 시작:', fileName);
      saveAs(blob, fileName);
      
      console.log('워드 파일 생성 완료!');

    } catch (error) {
      console.error('견적서 설명서 생성 중 오류 발생:', error);
      console.error('에러 스택:', error.stack);
      
      let errorMessage = '견적서 설명서 생성 중 오류가 발생했습니다.';
      if (error.response) {
        // API 응답 에러
        const status = error.response.status;
        if (status === 401) {
          errorMessage = 'OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요.';
        } else if (status === 429) {
          errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else {
          errorMessage = `API 오류가 발생했습니다. (상태 코드: ${status})`;
        }
      } else if (error.name === 'SyntaxError') {
        // JSON 파싱 에러
        errorMessage = 'GPT 응답을 처리하는 중 오류가 발생했습니다. JSON 형식이 올바르지 않습니다.';
      } else {
        // 기타 에러 (워드 파일 생성 에러 등)
        errorMessage = `워드 파일 생성 중 오류가 발생했습니다: ${error.message}`;
      }
      
      alert(`${errorMessage}\n\n자세한 정보는 브라우저 콘솔을 확인해주세요.`);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const handleSubmit = async () => {
    if (!requirements.trim()) {
      alert('개발 요청 사항을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      // GPT API 호출 (실제 구현 시 환경변수 또는 백엔드를 통해 API 키 관리)
      const prompt = `###지시사항
아래 출력 규격에 맞추어 개발 견적서를 JSON 형태로 생성하십시오.

###작성지침
1. 전체 구조
 - 결과는 순수 JSON(UTF-8) 만 출력합니다.
 - 최상위 키는 title, overview, scope, basis, schedule, team, payment 의 7개이며 순서 고정입니다.
 - 모든 키와 하위 필드는 반드시 출력하며, 값이 없거나 파악 불가한 경우 단일 문자열 "-" 로 기재합니다.
 - 날짜는 YYYY-MM-DD, 금액은 따옴표 없는 숫자(원화 기준)를 사용합니다.

2. 필수 필드 및 값 규칙
 (1) title: 프로젝트명과 목적을 30자 이내로 요약한 문자열
 (2) overview
   - goal: 사업‧시스템이 달성할 핵심 목표
   - duration: 총 기간(예: "6개월", "24주")
   - deliverables: 주요 산출물 요약
 (3) scope
   - included: 포함 기능 배열
   - excluded: 제외 기능 배열
   - assumptions: 산정 전제 배열
 (4) basis
   - rationale: 배열. 각 요소는 다음 네 필드를 모두 포함
   - requirement: 사용자 요구 사항
   - technology: 대응 기술
   - resources: 기술 구현에 필요한 리소스
   - explanation: 위 세 항목을 한 문장으로 설명
 (5) schedule
   - milestones: 배열. 각 요소는 name, start, end, deliverable 필드를 포함
 (6) team
   - members: 배열. 각 요소는 다음 네 필드를 모두 포함
   - role: 아래 허용 목록 중 하나
   - staff: 배열. 각 요소는 다음 세 필드를 포함
    - grade: 초급 | 중급 | 고급 중 하나
    - count: 인원수(정수)
    - months: 투입 인월(정수)
    - rate: 업무 비중(%)
 (7) payment
   - terms: 배열. 각 요소는 stage(지불 단계)와 percentage(총액 대비 비율) 필드를 포함하며 모든 요소의 percentage 합이 100이어야 함

3. 검증 규칙
 - payment.terms 의 percentage 합계는 반드시 100이어야 합니다.
 - schedule.milestones 의 모든 날짜는 overview.duration 범위 내에 위치해야 합니다.

###허용 role 목록
 - IT기획자, IT컨설턴트, 업무분석가, 데이터분석가, IT PM, IT아키텍트, UI/UX 기획/개발, UI/UX 디자인, 응용SW개발자, 시스템SW개발자, 정보시스템 운용자, IT지원기술자, IT마케터, IT품질관리자, IT테스터, IT감리, 정보보안전문가

###출력형태
{
  "title": "-",
  "overview": {
    "goal": "-",
    "duration": "-",
    "deliverables": "-"
  },
  "scope": {
    "included": ["-"],
    "excluded": ["-"],
    "assumptions": ["-"]
  },
  "basis": {
    "rationale": [
      {
        "requirement": "-",
        "technology": "-",
        "resources": "-",
        "explanation": "-"
      }
    ]
  },
  "schedule": {
    "milestones": [
      {
        "name": "-",
        "start": "-",
        "end": "-",
        "deliverable": "-"
      }
    ]
  },
  "team": {
    "members": [
      {
        "role": "-",
        "staff": [
          {
            "grade": "-",
            "count": "-",
            "months": "-",
            "rate": "-"
          }
        ]
      }
    ]
  },
  "payment": {
    "terms": [
      { "stage": "-", "percentage": "-" }
    ]
  }
}

###개발요청사항
${requirements}`;

      // 실제 GPT API 호출
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        setEstimateResult('⚠️ OpenAI API 키가 설정되지 않았습니다.\n\n.env.local 파일에 REACT_APP_OPENAI_API_KEY를 설정해주세요.\n\n⚠️ 주의: React에서는 REACT_APP_ 접두사가 필요합니다.');
        return;
      }

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4.1",
        messages: [{ 
          role: "user", 
          content: prompt 
        }],
        max_tokens: 5000,
        temperature: 0.4
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const gptResponse = response.data.choices[0].message.content;
      console.log('GPT 원본 응답:', gptResponse);
      
      // JSON 응답 정리 (```json``` 마크다운 제거)
      let cleanedResponse = gptResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('정리된 응답:', cleanedResponse);
      
      // JSON 응답 파싱 시도
      try {
        const jsonResponse = JSON.parse(cleanedResponse);
        setEstimateResult(jsonResponse);
      } catch (parseError) {
        console.warn('JSON 파싱 실패, 원본 텍스트로 표시:', parseError);
        console.warn('파싱 시도한 텍스트:', cleanedResponse);
        setEstimateResult(gptResponse);
      }
    } catch (error) {
      console.error('Error calling GPT API:', error);
      
      let errorMessage = '견적 산출 중 오류가 발생했습니다.';
      
      if (error.response) {
        // API 응답 에러
        const status = error.response.status;
        if (status === 401) {
          errorMessage = '❌ API 키가 유효하지 않습니다.\n\n올바른 OpenAI API 키를 .env.local 파일에 설정해주세요.';
        } else if (status === 429) {
          errorMessage = '⏱️ API 사용량 한도를 초과했습니다.\n\n잠시 후 다시 시도하거나 OpenAI 계정의 사용량을 확인해주세요.';
        } else if (status === 403) {
          errorMessage = '🚫 API 접근이 거부되었습니다.\n\nOpenAI 계정 상태를 확인해주세요.';
        } else {
          errorMessage = `⚠️ API 오류가 발생했습니다. (상태 코드: ${status})\n\n잠시 후 다시 시도해주세요.`;
        }
      } else if (error.request) {
        // 네트워크 에러
        errorMessage = '🌐 네트워크 연결 오류가 발생했습니다.\n\n인터넷 연결을 확인하고 다시 시도해주세요.';
      }
      
      setEstimateResult(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      {/* 상단 영역 */}
      <header className="header">
        <h1>개발 견적 산출 Agent</h1>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="main-content">
        {/* 왼쪽 입력 영역 */}
        <section className="input-section">
          <div className="input-container">
            <h2>견적 요청 정보</h2>
            
                         <div className="form-group">
               <label htmlFor="requirements">
                 개발 요청 사항 <span className="required">*</span>
               </label>
               <textarea
                 id="requirements"
                 value={requirements}
                 onChange={(e) => setRequirements(e.target.value)}
                 placeholder="개발하고자 하는 서비스나 기능에 대해 상세히 설명해주세요..."
                 rows={10}
                 required
               />
             </div>

            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={!requirements.trim() || isLoading}
            >
              {isLoading ? '견적 산출 중...' : '개발 견적 산출'}
            </button>
          </div>
        </section>

        {/* 오른쪽 결과 출력 영역 */}
        <section className="output-section">
          <div className="output-container">
            <div className="output-header">
              <h2>견적서 결과</h2>
              <div className="action-buttons">
                <button 
                  className="action-button pdf-button"
                  onClick={handlePdfDownload}
                  disabled={!estimateResult || typeof estimateResult !== 'object' || isGeneratingWord}
                >
                  📄 PDF 저장
                </button>
                <button 
                  className={`action-button word-button ${isGeneratingWord ? 'generating' : ''}`}
                  onClick={handleWordDownload}
                  disabled={!estimateResult || typeof estimateResult !== 'object' || isGeneratingWord}
                >
                  {isGeneratingWord ? '📝 설명서 생성 중...' : '📝 견적서 설명'}
                </button>
              </div>
            </div>
            <div className="estimate-result">
              {estimateResult ? (
                <div className="result-content">
                  {typeof estimateResult === 'object' ? (
                    <EstimateDocument data={estimateResult} />
                  ) : (
                    <pre>{estimateResult}</pre>
                  )}
                </div>
              ) : (
                <div className="placeholder">
                  <p>개발 요청 사항을 입력하고 "개발 견적 산출" 버튼을 클릭하면</p>
                  <p>상세한 견적서가 이곳에 표시됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App; 