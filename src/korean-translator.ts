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

// 고유어 날짜 표현
const nativeDateMap: KoreanTranslationMap = {
    '하루': '1 day',
    '이틀': '2 days',
    '사흘': '3 days',
    '나흘': '4 days',
    '닷새': '5 days',
    '엿새': '6 days',
    '이레': '7 days',
    '열흘': '10 days',
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

// 숫자 한글 → 영어 (중복 제거)
const numberMap: KoreanTranslationMap = {
    // 고유어
    '한': '1', '하나': '1', '둘': '2', '두': '2', '셋': '3', '세': '3',
    '넷': '4', '네': '4', '다섯': '5', '여섯': '6', '일곱': '7', '여덟': '8',
    '아홉': '9', '열': '10',
    // 한자어
    '일': '1', '이': '2', '삼': '3', '사': '4', '오': '5', '육': '6',
    '칠': '7', '팔': '8', '구': '9', '십': '10',
    '십일': '11', '십이': '12', '이십': '20', '삼십': '30', '사십': '40', '오십': '50',
};

// 패턴 그룹 정의
const patternGroups = {
    year: {
        'this year': ['올해', '금년', '이번해', '이번년'],
        'next year': ['내년', '다음해', '다음년', '이듬해'],
        'last year': ['작년', '지난해', '지난년'],
        'two years ago': ['재작년']
    },
    period: {
        'this': ['이번'],
        'next': ['다음'],
        'last': ['지난']
    }
};

export function translateKoreanToEnglish(koreanText: string): string {
    let result = koreanText.toLowerCase().trim();

    // 1. 복합 패턴 처리
    result = handleComplexPatterns(result);

    // 2. 기본 표현 번역
    const maps = [nativeDateMap, basicDateMap, monthMap, timeMap, numberMap, weekdayMap];
    maps.forEach(map => {
        result = replaceWithMap(result, map);
    });

    return result;
}

function replaceWithMap(text: string, map: KoreanTranslationMap): string {
    let result = text;
    Object.entries(map).forEach(([korean, english]) => {
        result = result.replace(new RegExp(korean, 'g'), english);
    });
    return result;
}

function handleComplexPatterns(text: string): string {
    let result = text;

    // 1. 고유어 날짜 표현
    result = handleNativeDateExpressions(result);

    // 2. 년도 표현 (패턴 그룹 사용)
    Object.entries(patternGroups.year).forEach(([english, koreanList]) => {
        const pattern = koreanList.map(k => k.replace('년', '\\s*년').replace('해', '\\s*해')).join('|');
        result = result.replace(new RegExp(`(${pattern})`, 'g'), english);
    });

    // 3. 주/월 표현 (통합 처리)
    const periodUnits = [
        { patterns: ['주'], english: 'week' },
        { patterns: ['달', '월'], english: 'month' }
    ];

    Object.entries(patternGroups.period).forEach(([englishPeriod, koreanPeriods]) => {
        periodUnits.forEach(({ patterns, english }) => {
            const unitPattern = patterns.join('|');
            const periodPattern = koreanPeriods.join('|');
            result = result.replace(
                new RegExp(`(${periodPattern})\\s*(${unitPattern})`, 'g'),
                `${englishPeriod} ${english}`
            );
        });
    });

    // 4. 특정 요일 표현
    result = result.replace(/(이번|다음|지난)\s*주\s+(월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일)/g,
        (match, period, day) => {
            const englishPeriod = patternGroups.period[period as keyof typeof patternGroups.period] || period;
            return `${englishPeriod} ${weekdayMap[day]}`;
        });

    // 5. 상대적 날짜
    result = handleRelativeDates(result);

    // 6. 시간 표현
    result = handleTimeExpressions(result);

    // 7. 특수 조합
    result = result.replace(/(오늘|내일|어제)\s*(오전|오후|아침|저녁|밤)/g,
        (match, day, time) => `${basicDateMap[day]} ${timeMap[time]}`);

    return result;
}

function handleNativeDateExpressions(text: string): string {
    let result = text;

    Object.entries(nativeDateMap).forEach(([korean, english]) => {
        // 통합 패턴 처리
        result = result.replace(new RegExp(`${korean}\\s*(후|뒤)`, 'g'), `in ${english}`);
        result = result.replace(new RegExp(`${korean}\\s*(전|앞)`, 'g'), `${english} ago`);
    });

    return result;
}

function handleRelativeDates(text: string): string {
    let result = text;

    const units = [
        { korean: '시간', english: 'hours' },
        { korean: '분', english: 'minutes' },
        { korean: '초', english: 'seconds' },
        { korean: '일', english: 'days' },
        { korean: '주', english: 'weeks' },
        { korean: '(달|개월|월)', english: 'months' },
        { korean: '년', english: 'years' }
    ];

    units.forEach(({ korean, english }) => {
        // 통합 숫자 처리 함수 사용
        result = processNumberPattern(result, korean, english);
    });

    return result;
}

// 숫자 패턴 처리 통합 함수
function processNumberPattern(text: string, unit: string, englishUnit: string): string {
    let result = text;

    // 모든 숫자 패턴 생성 (아라비아 + 한글)
    const allNumbers = `(\\d+|${Object.keys(numberMap).join('|')})`;

    // 후/뒤 패턴
    result = result.replace(new RegExp(`${allNumbers}\\s*${unit}\\s*(후|뒤)`, 'g'),
        (match, num) => {
            const englishNum = numberMap[num] || num;
            return `in ${englishNum} ${englishUnit}`;
        });

    // 전/앞 패턴
    result = result.replace(new RegExp(`${allNumbers}\\s*${unit}\\s*(전|앞)`, 'g'),
        (match, num) => {
            const englishNum = numberMap[num] || num;
            return `${englishNum} ${englishUnit} ago`;
        });

    return result;
}

function handleTimeExpressions(text: string): string {
    let result = text;
    const allNumbers = `(\\d+|${Object.keys(numberMap).join('|')})`;

    // 오전/오후 + 시간 (통합 처리)
    result = result.replace(new RegExp(`(오전|오후)\\s*${allNumbers}\\s*시`, 'g'),
        (match, period, hour) => {
            const englishHour = numberMap[hour] || hour;
            return `${englishHour} ${timeMap[period]}`;
        });

    // 시:분 형태 (통합 처리)
    result = result.replace(new RegExp(`${allNumbers}\\s*시\\s*${allNumbers}\\s*분`, 'g'),
        (match, hour, minute) => {
            const englishHour = numberMap[hour] || hour;
            const englishMinute = numberMap[minute] || minute;
            return `${englishHour}:${englishMinute}`;
        });

    // 단순 시간 (X시)
    result = result.replace(new RegExp(`${allNumbers}\\s*시(?!\\s*(간|분|\\d))`, 'g'),
        (match, hour) => {
            const englishHour = numberMap[hour] || hour;
            return `${englishHour} o'clock`;
        });

    return result;
}

// 영어가 포함되어 있는지 확인
export function containsEnglish(text: string): boolean {
    return /[a-zA-Z]/.test(text);
}
