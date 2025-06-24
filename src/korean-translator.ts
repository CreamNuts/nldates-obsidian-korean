// 간소화된 한글 자연어 날짜를 영어로 번역하는 함수

interface KoreanTranslationMap {
    [key: string]: string;
}

// 기본 날짜 표현
const basicDateMap: KoreanTranslationMap = {
    '오늘': 'today',
    '내일': 'tomorrow',
    '어제': 'yesterday',
    '모레': 'in 2 days',
    '그저께': '2 days ago',
    '그제': '2 days ago',
};
const nativeDateMap: KoreanTranslationMap = {
    '하루': '1 day',      // 1일
    '이틀': '2 days',     // 2일
    '사흘': '3 days',     // 3일  
    '나흘': '4 days',     // 4일
    '닷새': '5 days',     // 5일
    '엿새': '6 days',     // 6일
    '이레': '7 days',     // 일주일
    '열흘': '10 days',    // 10일
};
// 요일 표현
const weekdayMap: KoreanTranslationMap = {
    '월요일': 'monday', '화요일': 'tuesday', '수요일': 'wednesday', '목요일': 'thursday',
    '금요일': 'friday', '토요일': 'saturday', '일요일': 'sunday',
    '월': 'monday', '화': 'tuesday', '수': 'wednesday', '목': 'thursday',
    '금': 'friday', '토': 'saturday', '일': 'sunday',
};

// 월 표현
const monthMap: KoreanTranslationMap = {
    '1월': 'january', '2월': 'february', '3월': 'march', '4월': 'april',
    '5월': 'may', '6월': 'june', '7월': 'july', '8월': 'august',
    '9월': 'september', '10월': 'october', '11월': 'november', '12월': 'december',
};

// 시간 표현
const timeMap: KoreanTranslationMap = {
    '오전': 'am', '오후': 'pm', '저녁': 'evening', '아침': 'morning',
    '점심': 'noon', '밤': 'night', '자정': 'midnight', '정오': 'noon',
};

// 숫자 한글 → 영어 (통합)
const numberMap: KoreanTranslationMap = {
    // 고유어
    '한': '1', '하나': '1', '둘': '2', '두': '2', '셋': '3', '세': '3',
    '넷': '4', '네': '4', '다섯': '5', '여섯': '6', '일곱': '7', '여덟': '8', '아홉': '9', '열': '10',
    // 한자어 (주요 숫자만)
    '일': '1', '이': '2', '삼': '3', '사': '4', '오': '5', '육': '6', '칠': '7', '팔': '8', '구': '9', '십': '10',
    '십일': '11', '십이': '12', '이십': '20', '삼십': '30', '사십': '40', '오십': '50',
};

export function translateKoreanToEnglish(koreanText: string): string {
    let result = koreanText.toLowerCase().trim();

    // 1. 복합 패턴 처리 (순서 중요!)
    result = handleComplexPatterns(result);

    // 2. 기본 표현 번역 (순서 중요!)
    result = replaceWithMap(result, nativeDateMap);  // 고유어 날짜 먼저
    result = replaceWithMap(result, basicDateMap);
    result = replaceWithMap(result, monthMap);
    result = replaceWithMap(result, timeMap);
    result = replaceWithMap(result, numberMap);
    result = replaceWithMap(result, weekdayMap);

    return result;
}

function replaceWithMap(text: string, map: KoreanTranslationMap): string {
    let result = text;
    Object.entries(map).forEach(([korean, english]) => {
        result = result.replace(new RegExp(korean, 'g'), english);
    });
    return result;
}

function handleNativeDateExpressions(text: string): string {
    let result = text;

    // 고유어 날짜 + 방향 패턴 처리
    Object.entries(nativeDateMap).forEach(([korean, english]) => {
        // "사흘 후" → "in 3 days"
        result = result.replace(new RegExp(`${korean}\\s*(후|뒤)`, 'g'), `in ${english}`);
        // "사흘 전" → "3 days ago"  
        result = result.replace(new RegExp(`${korean}\\s*(전|앞)`, 'g'), `${english} ago`);
    });

    return result;
}

function handleComplexPatterns(text: string): string {
    let result = text;

    // 0. 고유어 날짜 표현 (가장 먼저 처리)
    result = handleNativeDateExpressions(result);

    // 1. 특정 요일 표현 (주 + 요일)
    result = result.replace(/(이번|다음|지난)\s*주\s+(월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일)/g,
        (match, period, day) => {
            const englishPeriod = period === '이번' ? 'this' : period === '다음' ? 'next' : 'last';
            const englishDay = weekdayMap[day];
            return `${englishPeriod} ${englishDay}`;
        });

    // 2. 년도 표현 (먼저 처리)
    result = result.replace(/올\s*해/g, 'this year');
    result = result.replace(/금\s*년/g, 'this year');
    result = result.replace(/이번\s*해/g, 'this year');
    result = result.replace(/이번\s*년/g, 'this year');
    result = result.replace(/내\s*년/g, 'next year');
    result = result.replace(/다음\s*해/g, 'next year');
    result = result.replace(/다음\s*년/g, 'next year');
    result = result.replace(/이듬\s*해/g, 'next year');
    result = result.replace(/작\s*년/g, 'last year');
    result = result.replace(/지난\s*해/g, 'last year');
    result = result.replace(/지난\s*년/g, 'last year');
    result = result.replace(/재작\s*년/g, 'two years ago');

    // 3. 기간 표현 (주/월)
    result = result.replace(/이번\s*주/g, 'this week');
    result = result.replace(/다음\s*주/g, 'next week');
    result = result.replace(/지난\s*주/g, 'last week');
    result = result.replace(/이번\s*(달|월)/g, 'this month');
    result = result.replace(/다음\s*(달|월)/g, 'next month');
    result = result.replace(/지난\s*(달|월)/g, 'last month');

    // 4. 상대적 날짜 (통합 처리)
    result = handleRelativeDates(result);

    // 5. 시간 표현
    result = handleTimeExpressions(result);

    // 6. 특수 조합
    result = result.replace(/(오늘|내일|어제)\s*(오전|오후|아침|저녁|밤)/g, (match, day, time) => {
        const englishDay = basicDateMap[day] || day;
        const englishTime = timeMap[time] || time;
        return `${englishDay} ${englishTime}`;
    });

    return result;
}

function handleRelativeDates(text: string): string {
    let result = text;

    // 숫자 + 단위 + 방향 패턴 통합 처리
    const patterns = [
        { unit: '일', english: 'days' },
        { unit: '주', english: 'weeks' },
        { unit: '(달|개월|월)', english: 'months' },
        { unit: '년', english: 'years' }
    ];

    patterns.forEach(({ unit, english }) => {
        // 아라비아 숫자
        result = result.replace(new RegExp(`(\\d+)\\s*${unit}\\s*(후|뒤)`, 'g'), `in $1 ${english}`);
        result = result.replace(new RegExp(`(\\d+)\\s*${unit}\\s*(전|앞)`, 'g'), `$1 ${english} ago`);

        // 한글 숫자 (통합)
        const koreanNums = Object.keys(numberMap).join('|');
        result = result.replace(new RegExp(`(${koreanNums})\\s*${unit}\\s*(후|뒤)`, 'g'),
            (match, num, direction) => {
                const englishNum = numberMap[num] || num;
                return `in ${englishNum} ${english}`;
            });
        result = result.replace(new RegExp(`(${koreanNums})\\s*${unit}\\s*(전|앞)`, 'g'),
            (match, num, direction) => {
                const englishNum = numberMap[num] || num;
                return `${englishNum} ${english} ago`;
            });
    });

    return result;
}

function handleTimeExpressions(text: string): string {
    let result = text;

    // 오전/오후 + 시간
    result = result.replace(/(오전|오후)\s*(\d+)\s*시/g, (match, period, hour) => {
        return `${hour} ${timeMap[period]}`;
    });

    // 한글 숫자 시간
    const koreanNums = Object.keys(numberMap).join('|');
    result = result.replace(new RegExp(`(오전|오후)\\s*(${koreanNums})\\s*시`, 'g'),
        (match, period, hour) => {
            const englishHour = numberMap[hour] || hour;
            return `${englishHour} ${timeMap[period]}`;
        });

    // 시:분 형태
    result = result.replace(/(\d+)\s*시\s*(\d+)\s*분/g, '$1:$2');
    result = result.replace(new RegExp(`(${koreanNums})\\s*시\\s*(${koreanNums})\\s*분`, 'g'),
        (match, hour, minute) => {
            const englishHour = numberMap[hour] || hour;
            const englishMinute = numberMap[minute] || minute;
            return `${englishHour}:${englishMinute}`;
        });

    // 단순 시간 (X시)
    result = result.replace(/(\d+)\s*시(?!\s*\d)/g, '$1 o\'clock');
    result = result.replace(new RegExp(`(${koreanNums})\\s*시(?!\\s*\\d)`, 'g'),
        (match, hour) => {
            const englishHour = numberMap[hour] || hour;
            return `${englishHour} o'clock`;
        });

    return result;
}

// 한글이 포함되어 있는지 확인
export function containsEnglish(text: string): boolean {
    return /[a-zA-Z]/.test(text);
}