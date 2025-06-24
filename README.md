# Natural Language Dates (Korean Support)

[원본 플러그인](https://github.com/argenos/nldates-obsidian)에 **한국어 지원**을 추가한 버전입니다.

한글로 입력된 자연어 날짜를 영어로 번역하여 Obsidian의 날짜 인식 기능과 호환되도록 합니다.

## ✨ 지원하는 한국어 표현

### 기본 날짜
```
오늘, 내일, 어제, 모레, 그저께
```

### 요일 & 기간
```
다음 주 월요일, 이번주 금요일, 지난 수요일
이번 달, 다음달, 지난 주, 올해, 내년, 작년
```

### 상대적 날짜 (숫자 + 한자어 지원)
```
3일 후, 삼일 후, 사일 뒤
2주 전, 이주 전, 한 달 뒤
5개월 후, 오개월 전, 1년 뒤
```

### 시간 표현
```
오후 3시, 오전 구시, 삼시 삼십분
오늘 저녁, 내일 아침, 자정, 정오
```

### 띄어쓰기 유연성
```
"이번 주" = "이번주"
"다음 달" = "다음달" 
"삼일 후" = "삼 일 후"
```

## 📦 설치 방법

### BRAT 플러그인 사용 (권장)
1. BRAT 플러그인을 설치하고 활성화
2. `Ctrl+P` → "BRAT: Add a beta plugin" 실행
3. 저장소 URL 입력: `https://github.com/Creamnuts/nldates-obsidian-korean`
4. `Enable after installing` 체크 후 설치

### 수동 설치
1. [릴리즈 페이지](https://github.com/Creamnuts/nldates-obsidian-korean/releases)에서 최신 버전 다운로드
2. `.obsidian/plugins/nldates-korean/` 폴더에 압축 해제
3. 플러그인 설정에서 활성화

## 🚀 사용법

### 명령어로 변환
1. 한글 날짜 텍스트 선택
2. `Ctrl+P` → "Parse natural language date" 실행
3. 자동으로 `[[2024-06-24]]` 형식으로 변환

### 자동완성
- `@오늘` 입력 후 Enter
- `@삼일후` 입력 후 Enter
- `@다음주월요일` 입력 후 Enter

### 실제 사용 예시
```markdown
# 할 일 목록
- [ ] 내일 회의 참석
- [ ] 삼일 후 프로젝트 완료  
- [ ] 다음 주 월요일 새 업무 시작
- [ ] 오후 세시 고객 미팅
- [ ] 이번주 금요일까지 보고서 작성
```

## ⚙️ 설정

`Settings` → `Natural Language Dates (Korean)`에서:
- 날짜 형식 변경 (YYYY-MM-DD, DD/MM/YYYY 등)
- 자동완성 트리거 문자 변경 (`@` → 다른 문자)
- 링크 생성 방식 설정

> [!WARNING]
> 원본 Natural Language Dates 플러그인을 사용하면 충돌이 발생할 수 있습니다.

## 🐛 문제 해결

**한글이 인식되지 않는 경우:**
1. 플러그인이 활성화되어 있는지 확인
2. 개발자 도구(F12)에서 오류 메시지 확인
3. [이슈 페이지](https://github.com/Creamnuts/nldates-obsidian-korean/issues)에 문제 신고

## 📄 라이선스

MIT License

- Original: Argentina Ortega Sáinz
- Korean Support: Creamnuts

---

> 💡 새로운 한국어 표현 추가 요청이나 버그 신고는 [GitHub Issues](https://github.com/Creamnuts/nldates-obsidian-korean/issues)로 부탁드립니다!