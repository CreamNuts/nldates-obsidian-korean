# Natural Language Dates in Obsidian
원본: https://github.com/argenos/nldates-obsidian

원본에 한글 처리 기능 추가한 버전입니다.

## 한글 자연어 날짜 지원

이 플러그인은 한글로 입력된 자연어 날짜를 영어로 번역하여 Obsidian의 날짜 인식 기능과 호환되도록 지원합니다.

### 지원 예시
- 오늘, 내일, 어제, 모레, 그저께 등 기본 날짜 표현
- 월요일~일요일, 1월~12월 등 요일/월 표현
- 이번 주/다음 주/지난 주, 이번 달/다음 달/지난 달, 올해/내년/작년 등 기간 표현
- 오전/오후/아침/저녁/밤/자정 등 시간 표현
- 한/두/세/네/다섯 등 한글 숫자
- "3일 후", "2주 전", "5개월 뒤", "1년 전" 등 상대적 날짜 표현
- "다음 화요일", "지난 금요일" 등 복합 패턴
- "3시 30분" → "3:30" 등 시간 표현

### 예시 입력 및 변환
- "오늘" → "today"
- "다음 주 금요일" → "next friday"
- "3일 후" → "in 3 days"
- "지난 월요일" → "last monday"
- "오전 10시" → "10 am"
- "한 달 전" → "1 months ago"

자세한 변환 로직은 `src/korean-translator.ts` 파일을 참고하세요.

## 설치 방법
1.Community Plugin에서 BRAT 플러그인을 설치합니다.
2.BRAT 플러그인을 활성화합니다.
3.`BRAT: Plugins: Add a beta plugin for testing (with or without version)` 명령어를 실행합니다.
4. `Github repository for beta plugin`에 `https://github.com/Creamnuts/nldates-obsidian-korean` 를 입력합니다.
5. `Enable after installing the plugin`을 체크한 후 `Add plugin`을 클릭합니다.