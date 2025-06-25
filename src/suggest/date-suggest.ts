import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import type NaturalLanguageDates from "src/main";
import { generateMarkdownLink } from "src/utils";
import { containsEnglish } from "src/korean-translator";

interface IDateCompletion {
  label: string;
}

// 자연스러운 한글 시간 표현 정의
const KOREAN_TIME_EXPRESSIONS = {
  // 고유어 날짜 (하루~열흘)
  nativeDays: ['하루', '이틀', '사흘', '나흘', '닷새', '엿새', '이레', '여드레', '아흐레', '열흘'],

  // 고유어 숫자 (시간, 주에 사용)
  nativeNumbers: ['한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'],

  // 한자어 숫자 (년에 사용)
  sinoNumbers: ['일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십'],

  // 시간 단위별 자연스러운 표현 규칙
  units: {
    hour: { suffix: '시간', useNative: true },
    day: { suffix: '일', special: 'nativeDays' },
    week: { suffix: '주', useNative: true },
    month: { suffixes: ['개월', '달'], useNative: true }, // '달'은 아라비아 숫자만
    year: { suffix: '년', useSino: true }
  }
};

// 기본 제안 항목들
const BASIC_SUGGESTIONS = {
  weekdays: ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'],
  timeOfDay: ['오전', '오후', '아침', '저녁', '밤'],
  yearTerms: ['올해', '내년', '작년', '이듬해', '재작년'],
  basicDates: ["오늘", "내일", "모레", "어제", "그저께"]
};

export default class DateSuggest extends EditorSuggest<IDateCompletion> {
  app: App;
  private plugin: NaturalLanguageDates;

  constructor(app: App, plugin: NaturalLanguageDates) {
    super(app);
    this.app = app;
    this.plugin = plugin;

    // @ts-ignore
    this.scope.register(["Shift"], "Enter", (evt: KeyboardEvent) => {
      // @ts-ignore
      this.suggestions.useSelectedItem(evt);
      return false;
    });

    if (this.plugin.settings.autosuggestToggleLink) {
      this.setInstructions([{ command: "Shift", purpose: "Keep text as alias" }]);
    }
  }

  getSuggestions(context: EditorSuggestContext): IDateCompletion[] {
    const suggestions = this.getDateSuggestions(context);
    if (suggestions.length) {
      return suggestions;
    }

    // catch-all if there are no matches
    return [{ label: context.query }];
  }

  getDateSuggestions(context: EditorSuggestContext): IDateCompletion[] {
    // 영어가 포함된 경우 영어 처리
    if (containsEnglish(context.query)) {
      return this.getEnglishDateSuggestions(context);
    }

    // 한글 처리
    return this.getKoreanDateSuggestions(context);
  }

  getKoreanDateSuggestions(context: EditorSuggestContext): IDateCompletion[] {
    const query = context.query.toLowerCase().trim();

    if (!query) {
      const sorted = this.sortSuggestionsByDate(BASIC_SUGGESTIONS.basicDates);
      return sorted.map((label) => ({ label }));
    }

    let suggestions: string[] = [];

    // 1. 모든 종류의 제안 생성
    suggestions.push(...this.handleReferencePattern(query));
    suggestions.push(...this.handleNumberPattern(query));
    suggestions.push(...this.handleWeekdayPattern(query));
    suggestions.push(...this.handleTimeOfDayPattern(query));
    if (!this.plugin.settings.excludeYearSuggestions) {
      suggestions.push(...BASIC_SUGGESTIONS.yearTerms);
    }
    suggestions.push(...BASIC_SUGGESTIONS.basicDates);
    KOREAN_TIME_EXPRESSIONS.nativeDays.forEach((day) => {
      suggestions.push(`${day} 후`, `${day} 전`, `${day} 뒤`);
    });

    // 2. 필터링, 정렬, 포맷팅
    const uniqueSuggestions = [...new Set(suggestions)];
    const filtered = uniqueSuggestions.filter((s) =>
      s.toLowerCase().includes(query)
    );
    const sorted = this.sortSuggestionsByDate(filtered);

    return sorted.map((label) => ({ label })).slice(0, 10);
  }

  private sortSuggestionsByDate(suggestions: string[]): string[] {
    const now = window.moment();

    const getDate = (suggestion: string) => {
      try {
        const parsedResult = this.plugin.parseDate(suggestion);
        if (parsedResult.date && window.moment(parsedResult.date).isValid()) {
          return window.moment(parsedResult.date);
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    return suggestions.sort((a, b) => {
      const dateA = getDate(a);
      const dateB = getDate(b);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      const diffA = Math.abs(now.diff(dateA));
      const diffB = Math.abs(now.diff(dateB));

      return diffA - diffB;
    });
  }

  // 다음/지난/이번 패턴 처리
  private handleReferencePattern(query: string): string[] {
    const referenceMatch = query.match(/(다음|지난|이번)/);
    if (!referenceMatch) return [];

    const reference = referenceMatch[1];
    const suggestions: string[] = [];

    // 주 + 요일 조합 (최우선)
    BASIC_SUGGESTIONS.weekdays.forEach(day => {
      suggestions.push(`${reference} 주 ${day}`);
    });

    // 기간 단위
    if (!this.plugin.settings.excludeYearSuggestions) {
      suggestions.push(`${reference} 주`, `${reference} 달`, `${reference} 년`);
    } else {
      suggestions.push(`${reference} 주`, `${reference} 달`);
    }


    // 단순 요일
    BASIC_SUGGESTIONS.weekdays.forEach(day => {
      suggestions.push(`${reference} ${day}`);
    });

    return suggestions;
  }

  // 숫자 패턴 처리 (아라비아 + 한글)
  private handleNumberPattern(query: string): string[] {
    const suggestions: string[] = [];

    // 아라비아 숫자 처리
    const arabicMatch = query.match(/(\d+)/);
    if (arabicMatch) {
      const number = parseInt(arabicMatch[1]);
      suggestions.push(...this.generateArabicNumberSuggestions(number));
    }

    // 한글 숫자 처리
    const koreanNumber = this.findKoreanNumber(query);
    if (koreanNumber) {
      suggestions.push(...this.generateKoreanNumberSuggestions(koreanNumber.text, koreanNumber.index));
    }

    return suggestions;
  }

  // 아라비아 숫자 제안 생성
  private generateArabicNumberSuggestions(number: number): string[] {
    const suggestions: string[] = [];
    const settings = this.plugin.settings;

    // 시간 (1-24)
    if (!settings.excludeTimeSuggestions && number <= 24) {
      suggestions.push(`${number}시간 후`, `${number}시간 전`);
    }

    // 일 (1-31)
    if (number <= 31) {
      suggestions.push(`${number}일 후`, `${number}일 전`, `${number}일 뒤`);
    }

    // 주 (1-8)
    if (number <= 8) {
      suggestions.push(`${number}주 후`, `${number}주 전`);
    }

    // 월 (1-12)
    if (number <= 12) {
      suggestions.push(
        `${number}달 후`,
        `${number}달 전`,
        `${number}개월 후`,
        `${number}개월 전`
      );
    }

    // 년 (1-10)
    if (!settings.excludeYearSuggestions && number <= 10) {
      suggestions.push(`${number}년 후`, `${number}년 전`);
    }

    return suggestions;
  }

  // 한글 숫자 찾기
  private findKoreanNumber(query: string): { text: string; index: number } | null {
    // 1. 고유어 날짜 표현을 먼저 확인 (가장 구체적인 케이스)
    for (let i = 0; i < KOREAN_TIME_EXPRESSIONS.nativeDays.length; i++) {
      const day = KOREAN_TIME_EXPRESSIONS.nativeDays[i];
      if (query.includes(day)) {
        return { text: day, index: i + 1 };
      }
    }

    // 2. 기존의 고유어 숫자 확인
    for (let i = 0; i < KOREAN_TIME_EXPRESSIONS.nativeNumbers.length; i++) {
      const num = KOREAN_TIME_EXPRESSIONS.nativeNumbers[i];
      if (query.includes(num)) {
        return { text: num, index: i + 1 };
      }
    }

    // 3. 기존의 한자어 숫자 확인
    for (let i = 0; i < KOREAN_TIME_EXPRESSIONS.sinoNumbers.length; i++) {
      const num = KOREAN_TIME_EXPRESSIONS.sinoNumbers[i];
      if (query.includes(num)) {
        return { text: num, index: i + 1 };
      }
    }

    return null;
  }

  // 한글 숫자 제안 생성 (자연스러운 표현만)
  private generateKoreanNumberSuggestions(
    koreanNum: string,
    numValue: number
  ): string[] {
    const suggestions: string[] = [];
    const settings = this.plugin.settings;

    // 시간 - 고유어 사용
    if (
      !settings.excludeTimeSuggestions &&
      KOREAN_TIME_EXPRESSIONS.nativeNumbers.includes(koreanNum)
    ) {
      suggestions.push(`${koreanNum} 시간 후`, `${koreanNum} 시간 전`);
    }

    // 일 - 고유어 날짜 사용
    if (numValue <= 10 && KOREAN_TIME_EXPRESSIONS.nativeDays[numValue - 1]) {
      const nativeDay = KOREAN_TIME_EXPRESSIONS.nativeDays[numValue - 1];
      if (koreanNum === nativeDay) {
        suggestions.push(`${nativeDay} 후`, `${nativeDay} 전`, `${nativeDay} 뒤`);
      }
    }

    // 주 - 고유어 사용
    if (KOREAN_TIME_EXPRESSIONS.nativeNumbers.includes(koreanNum)) {
      suggestions.push(`${koreanNum} 주 후`, `${koreanNum} 주 전`);
    }

    // 월 - 한자어 사용 (고유어 +'개월'은 부자연스러움)
    if (KOREAN_TIME_EXPRESSIONS.sinoNumbers.includes(koreanNum)) {
      suggestions.push(`${koreanNum} 개월 후`, `${koreanNum} 개월 전`);
    }

    // 년 - 한자어 사용
    if (
      !settings.excludeYearSuggestions &&
      KOREAN_TIME_EXPRESSIONS.sinoNumbers.includes(koreanNum)
    ) {
      suggestions.push(`${koreanNum} 년 후`, `${koreanNum} 년 전`);
    }

    return suggestions;
  }

  // 요일 패턴 처리
  private handleWeekdayPattern(query: string): string[] {
    const weekday = BASIC_SUGGESTIONS.weekdays.find(day => query.includes(day));
    if (!weekday) return [];

    return [
      `다음 ${weekday}`,
      `지난 ${weekday}`,
      `이번 주 ${weekday}`,
      `다음 주 ${weekday}`
    ];
  }

  // 시간대 패턴 처리
  private handleTimeOfDayPattern(query: string): string[] {
    const timeOfDay = BASIC_SUGGESTIONS.timeOfDay.find(time => query.includes(time));
    if (!timeOfDay) return [];

    return [
      `오늘 ${timeOfDay}`,
      `내일 ${timeOfDay}`,
      `어제 ${timeOfDay}`
    ];
  }

  getEnglishDateSuggestions(context: EditorSuggestContext): IDateCompletion[] {
    const query = context.query;

    // 기존 영어 로직 유지
    if (query.match(/^time/)) {
      return ["now", "+15 minutes", "+1 hour", "-15 minutes", "-1 hour"]
        .map((val) => ({ label: `time:${val}` }))
        .filter((item) => item.label.toLowerCase().includes(context.query));
    }

    if (query.match(/(next|last|this)/i)) {
      const reference = query.match(/(next|last|this)/i)[1];
      return [
        "week", "month", "year",
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday",
      ]
        .map((val) => ({ label: `${reference} ${val}` }))
        .filter((item) => item.label.toLowerCase().includes(context.query));
    }

    const relativeDate =
      query.match(/^in ([+-]?\d+)/i) || query.match(/^([+-]?\d+)/i);
    if (relativeDate) {
      const timeDelta = relativeDate[1];
      const settings = this.plugin.settings;
      const suggestions: IDateCompletion[] = [];

      // 시간 제안 (설정에 따라)
      if (!settings.excludeTimeSuggestions) {
        suggestions.push(
          { label: `in ${timeDelta} minutes` },
          { label: `in ${timeDelta} hours` }
        );
      }

      // 기본 날짜 제안
      suggestions.push(
        { label: `in ${timeDelta} days` },
        { label: `in ${timeDelta} weeks` },
        { label: `in ${timeDelta} months` },
        { label: `${timeDelta} days ago` },
        { label: `${timeDelta} weeks ago` },
        { label: `${timeDelta} months ago` }
      );

      // 년도 제안 (설정에 따라)
      if (!settings.excludeYearSuggestions) {
        suggestions.push(
          { label: `in ${timeDelta} years` },
          { label: `${timeDelta} years ago` }
        );
      }

      return suggestions.filter((item) =>
        item.label.toLowerCase().includes(context.query)
      );
    }

    return [
      { label: "Today" }, { label: "Yesterday" }, { label: "Tomorrow" },
    ].filter((item) => item.label.toLowerCase().includes(context.query));
  }

  renderSuggestion(suggestion: IDateCompletion, el: HTMLElement): void {
    el.setText(suggestion.label);
  }

  selectSuggestion(suggestion: IDateCompletion, event: KeyboardEvent | MouseEvent): void {
    const { editor } = this.context;
    const includeAlias = event.shiftKey;
    let dateStr = "";
    let makeIntoLink = this.plugin.settings.autosuggestToggleLink;

    // 영어 time: 패턴 처리
    if (suggestion.label.startsWith("time:")) {
      const timePart = suggestion.label.substring(5);
      dateStr = this.plugin.parseTime(timePart).formattedString;
      makeIntoLink = false;
    } else {
      // 한글 및 기타 패턴은 모두 parseDate로 처리
      dateStr = this.plugin.parseDate(suggestion.label).formattedString;
    }

    if (makeIntoLink) {
      dateStr = generateMarkdownLink(
        this.app,
        dateStr,
        includeAlias ? suggestion.label : undefined
      );
    }

    editor.replaceRange(dateStr, this.context.start, this.context.end);
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    file: TFile
  ): EditorSuggestTriggerInfo {
    if (!this.plugin.settings.isAutosuggestEnabled) {
      return null;
    }

    const triggerPhrase = this.plugin.settings.autocompleteTriggerPhrase;
    const startPos = this.context?.start || {
      line: cursor.line,
      ch: cursor.ch - triggerPhrase.length,
    };

    if (!editor.getRange(startPos, cursor).startsWith(triggerPhrase)) {
      return null;
    }

    const precedingChar = editor.getRange(
      {
        line: startPos.line,
        ch: startPos.ch - 1,
      },
      startPos
    );

    // Short-circuit if `@` as a part of a word (e.g. part of an email address)
    if (precedingChar && /[`a-zA-Z0-9]/.test(precedingChar)) {
      return null;
    }

    return {
      start: startPos,
      end: cursor,
      query: editor.getRange(startPos, cursor).substring(triggerPhrase.length),
    };
  }
}
