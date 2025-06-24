// 한글 자연어 날짜를 영어로 번역하는 함수 (개선된 버전)

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
    '그제': 'day before yesterday',
};

// 요일 표현 (줄임 포함)
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

// 시간 표현 (확장됨)
const timeMap: KoreanTranslationMap = {
    '오전': 'am',
    '오후': 'pm',
    '저녁': 'evening',
    '아침': 'morning',
    '점심': 'noon',
    '밤': 'night',
    '자정': 'midnight',
    '정오': 'noon',

    // 🆕 추가된 시간 관련 표현
    '지금': 'now',
    '현재': 'now',
    '즉시': 'now',
    '새벽': 'dawn',
    '낮': 'noon',
    '일몰': 'sunset',
    '해질녘': 'sunset',
    '늦은밤': 'late night',
};

// 🆕 기간/주기 표현 추가
const periodMap: KoreanTranslationMap = {
    '주중': 'weekday',
    '주말': 'weekend',
    '평일': 'weekday',
    '휴일': 'holiday',
    '공휴일': 'holiday',
    '연휴': 'holiday',
    '방학': 'vacation',
    '학기': 'semester',
    '분기': 'quarter',
    '반기': 'half year',
    '상반기': 'first half',
    '하반기': 'second half',
};

// 숫자 한글 → 영어 (고유어 + 한자어)
const numberMap: KoreanTranslationMap = {
    // 고유어 숫자
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

    // 한자어 숫자 (더 자주 사용됨)
    '일': '1',
    '이': '2',
    '삼': '3',
    '사': '4',
    '오': '5',
    '육': '6',
    '칠': '7',
    '팔': '8',
    '구': '9',
    '십': '10',
    '십일': '11',
    '십이': '12',
    '십삼': '13',
    '십사': '14',
    '십오': '15',
    '십육': '16',
    '십칠': '17',
    '십팔': '18',
    '십구': '19',
    '이십': '20',
    '이십오': '25',
    '삼십': '30',
    '삼십오': '35',
    '사십': '40',
    '사십오': '45',
    '오십': '50',
    '오십오': '55',
};

// 🆕 성능 최적화를 위한 캐시
const translationCache = new Map<string, string>();
const CACHE_MAX_SIZE = 1000;

export function translateKoreanToEnglish(koreanText: string): string {
    // 🆕 캐시 확인 (성능 최적화)
    if (translationCache.has(koreanText)) {
        return translationCache.get(koreanText)!;
    }

    let translatedText = koreanText.toLowerCase().trim();

    // 1. 복합 패턴을 먼저 처리 (긴 패턴부터)
    translatedText = handleComplexPatterns(translatedText);

    // 2. 기본 날짜 표현 번역
    translatedText = applyTranslationMap(translatedText, basicDateMap);

    // 3. 월 번역
    translatedText = applyTranslationMap(translatedText, monthMap);

    // 4. 시간 표현 번역 (확장됨)
    translatedText = applyTranslationMap(translatedText, timeMap);

    // 🆕 5. 기간/주기 표현 번역
    translatedText = applyTranslationMap(translatedText, periodMap);

    // 6. 숫자 한글 번역
    translatedText = applyTranslationMap(translatedText, numberMap);

    // 7. 단순 요일 번역 (복합 패턴 처리 후)
    Object.entries(weekdayMap).forEach(([korean, english]) => {
        const regex = new RegExp(`\\b${korean}\\b`, 'g');
        translatedText = translatedText.replace(regex, english);
    });

    // 🆕 캐시에 저장 (크기 제한)
    if (translationCache.size >= CACHE_MAX_SIZE) {
        const firstKey = translationCache.keys().next().value;
        translationCache.delete(firstKey);
    }
    translationCache.set(koreanText, translatedText);

    return translatedText;
}

// 🆕 성능 최적화: 반복 코드 제거
function applyTranslationMap(text: string, map: KoreanTranslationMap): string {
    let result = text;
    Object.entries(map).forEach(([korean, english]) => {
        const regex = new RegExp(korean, 'g');
        result = result.replace(regex, english);
    });
    return result;
}

function handleComplexPatterns(text: string): string {
    let result = text;

    // === 🆕 월/달 충돌 해결을 위한 문맥적 처리 ===

    // "다음 월" → "next month" (문맥상 달을 의미)
    result = result.replace(/다음\s*월(?![요일])/g, 'next month');
    result = result.replace(/지난\s*월(?![요일])/g, 'last month');
    result = result.replace(/이번\s*월(?![요일])/g, 'this month');

    // === 요일 관련 복합 패턴 (가장 먼저 처리) ===

    // "이번 주 X요일" → "this X" (띄어쓰기 선택적)
    result = result.replace(/이번\s*주\s+(월요일|화요일|수요일|목요일|금요일|토요일|일요일)/g, (match, day) => {
        const englishDay = weekdayMap[day];
        return `this ${englishDay}`;
    });

    // "이번 주 X" → "this X" (줄임형)
    result = result.replace(/이번\s*주\s+(월|화|수|목|금|토|일)(?!월)/g, (match, day) => {
        const englishDay = weekdayMap[day];
        return `this ${englishDay}`;
    });

    // "다음 주 X요일" → "next X"
    result = result.replace(/다음\s*주\s+(월요일|화요일|수요일|목요일|금요일|토요일|일요일)/g, (match, day) => {
        const englishDay = weekdayMap[day];
        return `next ${englishDay}`;
    });

    // "다음 주 X" → "next X" (줄임형)
    result = result.replace(/다음\s*주\s+(월|화|수|목|금|토|일)(?!월)/g, (match, day) => {
        const englishDay = weekdayMap[day];
        return `next ${englishDay}`;
    });

    // "지난 주 X요일" → "last X"
    result = result.replace(/지난\s*주\s+(월요일|화요일|수요일|목요일|금요일|토요일|일요일)/g, (match, day) => {
        const englishDay = weekdayMap[day];
        return `last ${englishDay}`;
    });

    // "지난 주 X" → "last X" (줄임형)
    result = result.replace(/지난\s*주\s+(월|화|수|목|금|토|일)(?!월)/g, (match, day) => {
        const englishDay = weekdayMap[day];
        return `last ${englishDay}`;
    });

    // === 기간 표현 (띄어쓰기 선택적) ===

    // 주 단위
    result = result.replace(/이번\s*주(?!\s*[월화수목금토일])/g, 'this week');
    result = result.replace(/다음\s*주(?!\s*[월화수목금토일])/g, 'next week');
    result = result.replace(/지난\s*주(?!\s*[월화수목금토일])/g, 'last week');

    // 월 단위 (이미 위에서 처리됨)
    result = result.replace(/이번\s*달/g, 'this month');
    result = result.replace(/다음\s*달/g, 'next month');
    result = result.replace(/지난\s*달/g, 'last month');

    // 년 단위
    result = result.replace(/올\s*해/g, 'this year');
    result = result.replace(/이번\s*해/g, 'this year');
    result = result.replace(/이번\s*년/g, 'this year');
    result = result.replace(/내\s*년/g, 'next year');
    result = result.replace(/다음\s*년/g, 'next year');
    result = result.replace(/작\s*년/g, 'last year');
    result = result.replace(/지난\s*년/g, 'last year');

    // === 🆕 특수 기간 표현 ===
    result = result.replace(/이번\s*주말/g, 'this weekend');
    result = result.replace(/다음\s*주말/g, 'next weekend');
    result = result.replace(/지난\s*주말/g, 'last weekend');

    result = result.replace(/이번\s*분기/g, 'this quarter');
    result = result.replace(/다음\s*분기/g, 'next quarter');
    result = result.replace(/지난\s*분기/g, 'last quarter');

    // === 상대적 날짜 표현 ===

    // 일 단위
    result = result.replace(/(\d+)\s*일\s*(후|뒤)/g, 'in $1 days');
    result = result.replace(/(\d+)\s*일\s*(전|앞)/g, '$1 days ago');

    // 한글 숫자로 된 일 단위 (고유어)
    result = result.replace(/(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*일\s*(후|뒤)/g, (match, num, direction) => {
        const englishNum = numberMap[num] || num;
        return `in ${englishNum} days`;
    });
    result = result.replace(/(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*일\s*(전|앞)/g, (match, num, direction) => {
        const englishNum = numberMap[num] || num;
        return `${englishNum} days ago`;
    });

    // 한글 숫자로 된 일 단위 (한자어 - 더 자주 사용됨)
    result = result.replace(/(일|이|삼|사|오|육|칠|팔|구|십|십일|십이|십삼|십사|십오|이십|삼십)\s*일\s*(후|뒤)/g, (match, num, direction) => {
        const englishNum = numberMap[num] || num;
        return `in ${englishNum} days`;
    });
    result = result.replace(/(일|이|삼|사|오|육|칠|팔|구|십|십일|십이|십삼|십사|십오|이십|삼십)\s*일\s*(전|앞)/g, (match, num, direction) => {
        const englishNum = numberMap[num] || num;
        return `${englishNum} days ago`;
    });

    // 주 단위 (고유어)
    result = result.replace(/(\d+)\s*주\s*(후|뒤)/g, 'in $1 weeks');
    result = result.replace(/(\d+)\s*주\s*(전|앞)/g, '$1 weeks ago');

    // 한글 숫자로 된 주 단위 (고유어)
    result = result.replace(/(한|두|세|네)\s*주\s*(후|뒤)/g, (match, num, direction) => {
        const englishNum = numberMap[num] || num;
        return `in ${englishNum} weeks`;
    });
    result = result.replace(/(한|두|세|네)\s*주\s*(전|앞)/g, (match, num, direction) => {
        const englishNum = numberMap[num] || num;
        return `${englishNum} weeks ago`;
    });

    // 한글 숫자로 된 주 단위 (한자어)
    result = result.replace(/(일|이|삼|사|오)\s*주\s*(후|뒤)/g, (match, num, direction) => {
        const englishNum = numberMap[num] || num;
        return `in ${englishNum} weeks`;
    });
    result = result.replace(/(일|이|삼|사|오)\s*주\s*(전|앞)/g, (match, num, direction) => {
        const englishNum = numberMap[num] || num;
        return `${englishNum} weeks ago`;
    });

    // 월 단위
    result = result.replace(/(\d+)\s*(달|개월|월)\s*(후|뒤)/g, 'in $1 months');
    result = result.replace(/(\d+)\s*(달|개월|월)\s*(전|앞)/g, '$1 months ago');

    // 한글 숫자로 된 월 단위 (고유어)
    result = result.replace(/(한|두|세|네|다섯|여섯)\s*(달|개월|월)\s*(후|뒤)/g, (match, num, unit, direction) => {
        const englishNum = numberMap[num] || num;
        return `in ${englishNum} months`;
    });
    result = result.replace(/(한|두|세|네|다섯|여섯)\s*(달|개월|월)\s*(전|앞)/g, (match, num, unit, direction) => {
        const englishNum = numberMap[num] || num;
        return `${englishNum} months ago`;
    });

    // 한글 숫자로 된 월 단위 (한자어)
    result = result.replace(/(일|이|삼|사|오|육)\s*(달|개월|월)\s*(후|뒤)/g, (match, num, unit, direction) => {
        const englishNum = numberMap[num] || num;
        return `in ${englishNum} months`;
    });
    result = result.replace(/(일|이|삼|사|오|육)\s*(달|개월|월)\s*(전|앞)/g, (match, num, unit, direction) => {
        const englishNum = numberMap[num] || num;
        return `${englishNum} months ago`;
    });

    // 년 단위
    result = result.replace(/(\d+)\s*년\s*(후|뒤)/g, 'in $1 years');
    result = result.replace(/(\d+)\s*년\s*(전|앞)/g, '$1 years ago');

    // === 시간 표현 개선 ===

    // "오후 3시" → "3 pm"
    result = result.replace(/(오전|오후)\s*(\d+)\s*시/g, (match, period, hour) => {
        const englishPeriod = timeMap[period];
        return `${hour} ${englishPeriod}`;
    });

    // "오후 삼시" → "3 pm" (한자어 숫자)
    result = result.replace(/(오전|오후)\s*(일|이|삼|사|오|육|칠|팔|구|십|십일|십이)\s*시/g, (match, period, hour) => {
        const englishPeriod = timeMap[period];
        const englishHour = numberMap[hour] || hour;
        return `${englishHour} ${englishPeriod}`;
    });

    // "3시 30분" → "3:30"
    result = result.replace(/(\d+)\s*시\s*(\d+)\s*분/g, '$1:$2');

    // "삼시 삼십분" → "3:30" (한자어 숫자)
    result = result.replace(/(일|이|삼|사|오|육|칠|팔|구|십|십일|십이)\s*시\s*(일|이|삼|사|오|십|십오|이십|이십오|삼십|삼십오|사십|사십오|오십|오십오)\s*분/g, (match, hour, minute) => {
        const englishHour = numberMap[hour] || hour;
        const englishMinute = numberMap[minute] || minute;
        return `${englishHour}:${englishMinute}`;
    });

    // "3시" → "3 o'clock" (오전/오후가 없는 경우)
    result = result.replace(/(\d+)\s*시(?!\s*\d)/g, '$1 o\'clock');

    // "삼시" → "3 o'clock" (한자어 숫자, 오전/오후가 없는 경우)
    result = result.replace(/(일|이|삼|사|오|육|칠|팔|구|십|십일|십이)\s*시(?!\s*\d)/g, (match, hour) => {
        const englishHour = numberMap[hour] || hour;
        return `${englishHour} o'clock`;
    });

    // === 🆕 시간대 + 날짜 조합 ===

    // "오늘 오후" → "today afternoon"
    result = result.replace(/오늘\s*(오전|오후|아침|저녁|밤|새벽|낮)/g, (match, time) => {
        const englishTime = timeMap[time];
        return `today ${englishTime}`;
    });

    // "내일 아침" → "tomorrow morning"
    result = result.replace(/내일\s*(오전|오후|아침|저녁|밤|새벽|낮)/g, (match, time) => {
        const englishTime = timeMap[time];
        return `tomorrow ${englishTime}`;
    });

    // "어제 저녁" → "yesterday evening"
    result = result.replace(/어제\s*(오전|오후|아침|저녁|밤|새벽|낮)/g, (match, time) => {
        const englishTime = timeMap[time];
        return `yesterday ${englishTime}`;
    });

    return result;
}

// 한글이 포함되어 있는지 확인
export function containsKorean(text: string): boolean {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    return koreanRegex.test(text);
}

// 🆕 캐시 관리 함수
export function clearTranslationCache(): void {
    translationCache.clear();
}

export function getTranslationCacheSize(): number {
    return translationCache.size;
}

// 디버깅용 함수 (개선됨)
export function debugTranslation(koreanText: string): {
    original: string,
    translated: string,
    steps: string[],
    cached: boolean
} {
    const cached = translationCache.has(koreanText);
    const steps: string[] = [];
    let current = koreanText.toLowerCase().trim();

    steps.push(`초기: "${current}"`);

    if (!cached) {
        current = handleComplexPatterns(current);
        steps.push(`복합 패턴 처리 후: "${current}"`);
    } else {
        steps.push(`캐시에서 가져옴`);
    }

    const final = translateKoreanToEnglish(koreanText);
    steps.push(`최종 결과: "${final}"`);

    return {
        original: koreanText,
        translated: final,
        steps,
        cached
    };
}

// 🆕 지원하는 패턴 목록 반환 (개발/디버깅용)
export function getSupportedPatterns(): {
    basicDates: string[],
    weekdays: string[],
    timeExpressions: string[],
    periods: string[],
    relativePatterns: string[]
} {
    return {
        basicDates: Object.keys(basicDateMap),
        weekdays: Object.keys(weekdayMap),
        timeExpressions: Object.keys(timeMap),
        periods: Object.keys(periodMap),
        relativePatterns: [
            "X일 후/전", "X주 후/전", "X달 후/전", "X년 후/전",
            "다음/지난/이번 + 기간", "한글숫자 + 기간"
        ]
    };
}