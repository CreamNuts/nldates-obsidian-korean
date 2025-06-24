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
import { containsKorean } from "src/korean-translator";

interface IDateCompletion {
  label: string;
}

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
    // 한글 입력 처리
    if (!containsKorean(context.query)) {
      return this.getEnglishDateSuggestions(context);
    }

    // 기존 영어 입력 처리
    return this.getKoreanDateSuggestions(context);
  }

  getKoreanDateSuggestions(context: EditorSuggestContext): IDateCompletion[] {
    const query = context.query.toLowerCase().trim();

    // 1. 시간 관련 패턴 (korean-translator.ts 호환)
    if (query.includes('지금') || query.includes('분') || query.includes('시간')) {
      return [
        "지금", "15분 후", "30분 후", "1시간 후", "2시간 후",
        "15분 전", "30분 전", "1시간 전", "2시간 전"
      ]
        .map((val) => ({ label: val }))
        .filter((item) => item.label.includes(query) || query.includes('시간'));
    }

    // 2. 다음/지난/이번 패턴 (korean-translator.ts와 정확히 일치)
    const referenceMatch = query.match(/(다음|지난|이번)/);
    if (referenceMatch) {
      const reference = referenceMatch[1];

      // 복합 패턴 우선 (korean-translator.ts 처리 순서와 동일)
      const suggestions = [
        // 주 + 요일 조합 (가장 높은 우선순위)
        `${reference} 주 월요일`, `${reference} 주 화요일`, `${reference} 주 수요일`,
        `${reference} 주 목요일`, `${reference} 주 금요일`, `${reference} 주 토요일`, `${reference} 주 일요일`,
        `${reference} 주 월`, `${reference} 주 화`, `${reference} 주 수`,
        `${reference} 주 목`, `${reference} 주 금`, `${reference} 주 토`, `${reference} 주 일`,

        // 기간 단위
        `${reference} 주`, `${reference} 주말`, `${reference} 달`, `${reference} 개월`,
        `${reference} 년`, `${reference} 해`,

        // 단순 요일 (낮은 우선순위, "월"은 제외하여 충돌 방지)
        `${reference} 화요일`, `${reference} 수요일`, `${reference} 목요일`,
        `${reference} 금요일`, `${reference} 토요일`, `${reference} 일요일`,
        `${reference} 화`, `${reference} 수`, `${reference} 목`,
        `${reference} 금`, `${reference} 토`, `${reference} 일`
      ];

      return suggestions
        .map(val => ({ label: val }))
        .filter(item => item.label.includes(query));
    }

    // 3. 상대적 날짜 패턴 (아라비아 숫자)
    const arabicNumberMatch = query.match(/(\d+)/);
    if (arabicNumberMatch) {
      const number = arabicNumberMatch[1];
      return [
        { label: `${number}분 후` }, { label: `${number}분 전` },
        { label: `${number}시간 후` }, { label: `${number}시간 전` },
        { label: `${number}일 후` }, { label: `${number}일 뒤` },
        { label: `${number}일 전` }, { label: `${number}일 앞` },
        { label: `${number}주 후` }, { label: `${number}주 뒤` },
        { label: `${number}주 전` }, { label: `${number}주 앞` },
        { label: `${number}달 후` }, { label: `${number}달 뒤` },
        { label: `${number}달 전` }, { label: `${number}달 앞` },
        { label: `${number}개월 후` }, { label: `${number}개월 뒤` },
        { label: `${number}개월 전` }, { label: `${number}개월 앞` },
        { label: `${number}년 후` }, { label: `${number}년 뒤` },
        { label: `${number}년 전` }, { label: `${number}년 앞` },
      ].filter((item) => item.label.includes(query));
    }

    // 4. 한글 숫자 패턴 (고유어 + 한자어 모두 지원)
    const koreanNumbers = {
      // 고유어
      '하나': '1', '한': '1', '둘': '2', '두': '2', '셋': '3', '세': '3',
      '넷': '4', '네': '4', '다섯': '5', '여섯': '6', '일곱': '7',
      '여덟': '8', '아홉': '9', '열': '10',
      // 한자어 (korean-translator.ts와 일치)
      '일': '1', '이': '2', '삼': '3', '사': '4', '오': '5', '육': '6',
      '칠': '7', '팔': '8', '구': '9', '십': '10', '십일': '11', '십이': '12'
    };

    const koreanNumberMatch = Object.keys(koreanNumbers).find(num => query.includes(num));
    if (koreanNumberMatch) {
      return [
        { label: `${koreanNumberMatch} 시간 후` }, { label: `${koreanNumberMatch} 시간 전` },
        { label: `${koreanNumberMatch} 일 후` }, { label: `${koreanNumberMatch} 일 뒤` },
        { label: `${koreanNumberMatch} 일 전` }, { label: `${koreanNumberMatch} 일 앞` },
        { label: `${koreanNumberMatch} 주 후` }, { label: `${koreanNumberMatch} 주 뒤` },
        { label: `${koreanNumberMatch} 주 전` }, { label: `${koreanNumberMatch} 주 앞` },
        { label: `${koreanNumberMatch} 달 후` }, { label: `${koreanNumberMatch} 달 뒤` },
        { label: `${koreanNumberMatch} 달 전` }, { label: `${koreanNumberMatch} 달 앞` },
      ].filter((item) => item.label.includes(query));
    }

    // 5. 요일 관련 (월/달 충돌 해결)
    const weekdays = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
    const weekdayShort = ['화', '수', '목', '금', '토', '일']; // '월' 제외

    const weekdayMatch = [...weekdays, ...weekdayShort].find(day => query.includes(day));
    if (weekdayMatch) {
      return [
        { label: `다음 ${weekdayMatch}` },
        { label: `지난 ${weekdayMatch}` },
        { label: `이번 ${weekdayMatch}` },
        { label: `다음 주 ${weekdayMatch}` },
        { label: `지난 주 ${weekdayMatch}` },
        { label: `이번 주 ${weekdayMatch}` },
      ].filter((item) => item.label.includes(query));
    }

    // 6. 시간대 관련
    const timeWords = ['오전', '오후', '아침', '저녁', '밤', '정오', '자정'];
    const timeMatch = timeWords.find(time => query.includes(time));
    if (timeMatch) {
      return [
        { label: `오늘 ${timeMatch}` },
        { label: `내일 ${timeMatch}` },
        { label: `어제 ${timeMatch}` },
      ].filter((item) => item.label.includes(query));
    }

    // 7. 기본 한글 후보들 (korean-translator.ts basicDateMap과 일치)
    const basicSuggestions = [
      { label: "오늘" }, { label: "어제" }, { label: "내일" },
      { label: "모레" }, { label: "그저께" }, { label: "그제" },
      { label: "이번 주" }, { label: "다음 주" }, { label: "지난 주" },
      { label: "이번 달" }, { label: "다음 달" }, { label: "지난 달" },
      { label: "이번 주말" }, { label: "다음 주말" }, { label: "지난 주말" },
      { label: "올해" }, { label: "내년" }, { label: "작년" },
      { label: "이번 년" }, { label: "다음 년" }, { label: "지난 년" },
    ];

    return basicSuggestions.filter((item) =>
      item.label.includes(query) || query.includes(item.label.split(' ')[0])
    );
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
        "week", "month", "year", "weekend",
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
      return [
        { label: `in ${timeDelta} minutes` }, { label: `in ${timeDelta} hours` },
        { label: `in ${timeDelta} days` }, { label: `in ${timeDelta} weeks` },
        { label: `in ${timeDelta} months` }, { label: `${timeDelta} days ago` },
        { label: `${timeDelta} weeks ago` }, { label: `${timeDelta} months ago` },
      ].filter((item) => item.label.toLowerCase().includes(context.query));
    }

    return [
      { label: "Today" }, { label: "Yesterday" }, { label: "Tomorrow" },
      { label: "Now" }, { label: "This week" }, { label: "Next week" },
      { label: "Last week" }, { label: "This month" }, { label: "Next month" }
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
      // 한글 및 기타 패턴은 모두 parseDate로 처리 (korean-translator.ts 활용)
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