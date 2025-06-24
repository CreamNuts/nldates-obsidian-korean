// 한글 자연어 날짜를 영어로 번역하는 함수

interface KoreanTranslationMap {
    [key: string]: string;
}

// 기본 날짜 표현
const basicDateMap: KoreanTranslationMap = {
    '오늘': 'today',
    '내일': 'tomorrow',
    '어제': 'yesterday',
    '모레': 'day after tomorrow',
    '그저께': 'day before yesterday',
};

// 요일 표현
const weekdayMap: KoreanTranslationMap = {
    '월요일': 'monday',
    '화요일': 'tuesday',
    '수요일': 'wednesday',
    '목요일': 'thursday',
    '금요일': 'friday',
    '토요일': 'saturday',
    '일요일': 'sunday',
    '월': 'monday',
    '화': 'tuesday',
    '수': 'wednesday',
    '목': 'thursday',
    '금': 'friday',
    '토': 'saturday',
    '일': 'sunday',
};

// 월 표현
const monthMap: KoreanTranslationMap = {
    '1월': 'january',
    '2월': 'february',
    '3월': 'march',
    '4월': 'april',
    '5월': 'may',
    '6월': 'june',
    '7월': 'july',
    '8월': 'august',
    '9월': 'september',
    '10월': 'october',
    '11월': 'november',
    '12월': 'december',
};

// 기간 표현 
const periodMap: KoreanTranslationMap = {
    '이번 주': 'this week',
    '다음 주': 'next week',
    '지난 주': 'last week',
    '이번 달': 'this month',
    '다음 달': 'next month',
    '지난 달': 'last month',
    '올해': 'this year',
    '내년': 'next year',
    '작년': 'last year',
    '이번 년': 'this year',
};

// 시간 표현
const timeMap: KoreanTranslationMap = {
    '오전': 'am',
    '오후': 'pm',
    '저녁': 'evening',
    '아침': 'morning',
    '점심': 'noon',
    '밤': 'night',
    '자정': 'midnight',
    '정오': 'noon',
};

// 숫자 한글 → 영어
const numberMap: KoreanTranslationMap = {
    '한': '1',
    '하나': '1',
    '둘': '2',
    '두': '2',
    '셋': '3',
    '세': '3',
    '넷': '4',
    '네': '4',
    '다섯': '5',
    '여섯': '6',
    '일곱': '7',
    '여덟': '8',
    '아홉': '9',
    '열': '10',
};

export function translateKoreanToEnglish(koreanText: string): string {
    let translatedText = koreanText.toLowerCase().trim();

    // 1. 기본 날짜 표현 번역
    Object.entries(basicDateMap).forEach(([korean, english]) => {
        translatedText = translatedText.replace(new RegExp(korean, 'g'), english);
    });

    // 2. 요일 번역
    Object.entries(weekdayMap).forEach(([korean, english]) => {
        translatedText = translatedText.replace(new RegExp(korean, 'g'), english);
    });

    // 3. 월 번역
    Object.entries(monthMap).forEach(([korean, english]) => {
        translatedText = translatedText.replace(new RegExp(korean, 'g'), english);
    });

    // 4. 기간 표현 번역
    Object.entries(periodMap).forEach(([korean, english]) => {
        translatedText = translatedText.replace(new RegExp(korean, 'g'), english);
    });

    // 5. 시간 표현 번역
    Object.entries(timeMap).forEach(([korean, english]) => {
        translatedText = translatedText.replace(new RegExp(korean, 'g'), english);
    });

    // 6. 숫자 한글 번역
    Object.entries(numberMap).forEach(([korean, english]) => {
        translatedText = translatedText.replace(new RegExp(korean, 'g'), english);
    });

    // 7. 복합 패턴 처리
    translatedText = handleComplexPatterns(translatedText);

    return translatedText;
}

function handleComplexPatterns(text: string): string {
    let result = text;

    // "X일 후" → "in X days"
    result = result.replace(/(\d+)일\s*후/g, 'in $1 days');
    result = result.replace(/(\d+)일\s*뒤/g, 'in $1 days');

    // "X일 전" → "X days ago"  
    result = result.replace(/(\d+)일\s*전/g, '$1 days ago');
    result = result.replace(/(\d+)일\s*앞/g, '$1 days ago');

    // "X주 후/전"
    result = result.replace(/(\d+)주\s*후/g, 'in $1 weeks');
    result = result.replace(/(\d+)주\s*뒤/g, 'in $1 weeks');
    result = result.replace(/(\d+)주\s*전/g, '$1 weeks ago');

    // "X달 후/전", "X개월 후/전"
    result = result.replace(/(\d+)(달|개월)\s*후/g, 'in $1 months');
    result = result.replace(/(\d+)(달|개월)\s*뒤/g, 'in $1 months');
    result = result.replace(/(\d+)(달|개월)\s*전/g, '$1 months ago');

    // "X년 후/전"
    result = result.replace(/(\d+)년\s*후/g, 'in $1 years');
    result = result.replace(/(\d+)년\s*뒤/g, 'in $1 years');
    result = result.replace(/(\d+)년\s*전/g, '$1 years ago');

    // "다음 X요일" → "next X"
    result = result.replace(/다음\s+(월|화|수|목|금|토|일)요일/g, 'next $1');
    result = result.replace(/다음\s+(월|화|수|목|금|토|일)/g, 'next $1');

    // "지난 X요일" → "last X" 
    result = result.replace(/지난\s+(월|화|수|목|금|토|일)요일/g, 'last $1');
    result = result.replace(/지난\s+(월|화|수|목|금|토|일)/g, 'last $1');

    // 시간 표현 "X시" → "X o'clock"
    result = result.replace(/(\d+)시/g, '$1 o\'clock');

    // "X시 Y분" → "X:Y"
    result = result.replace(/(\d+)시\s*(\d+)분/g, '$1:$2');

    return result;
}

// 한글이 포함되어 있는지 확인
export function containsKorean(text: string): boolean {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    return koreanRegex.test(text);
}