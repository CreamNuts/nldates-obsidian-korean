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
    if (containsEnglish(context.query)) {
      return this.getEnglishDateSuggestions(context);
    }

    // 영어 입력 처리
    return this.getKoreanDateSuggestions(context);
  }

  getKoreanDateSuggestions(context: EditorSuggestContext): IDateCompletion[] {
    const query = context.query.toLowerCase().trim();

    // 1. 다음/지난/이번 패턴 (가장 우선순위 높음)
    const referenceMatch = query.match(/(다음|지난|이번)/);
    if (referenceMatch) {
      const reference = referenceMatch[1];

      const suggestions = [
        // 주 + 요일 조합 (최우선)
        `${reference} 주 월요일`, `${reference} 주 화요일`, `${reference} 주 수요일`,
        `${reference} 주 목요일`, `${reference} 주 금요일`, `${reference} 주 토요일`, `${reference} 주 일요일`,

        // 기간 단위
        `${reference} 주`, `${reference} 달`, `${reference} 년`,

        // 단순 요일 (전체 이름만, 줄임말 제외)
        `${reference} 월요일`, `${reference} 화요일`, `${reference} 수요일`,
        `${reference} 목요일`, `${reference} 금요일`, `${reference} 토요일`, `${reference} 일요일`
      ];

      return suggestions
        .map(val => ({ label: val }))
        .filter(item => item.label.includes(query))
        .slice(0, 8); // 최대 8개로 제한
    }

    // 2. 아라비아 숫자 패턴 (자주 사용되는 것들만)
    const arabicNumberMatch = query.match(/(\d+)/);
    if (arabicNumberMatch) {
      const number = parseInt(arabicNumberMatch[1]);
      const suggestions = [];

      // 시간 (1-12시간 정도만)
      if (number <= 12) {
        suggestions.push({ label: `${number}시간 후` }, { label: `${number}시간 전` });
      }

      // 일 (1-30일 정도)
      if (number <= 30) {
        suggestions.push(
          { label: `${number}일 후` }, { label: `${number}일 전` }
        );
      }

      // 주 (1-8주 정도)
      if (number <= 8) {
        suggestions.push(
          { label: `${number}주 후` }, { label: `${number}주 전` }
        );
      }

      // 월 (1-12개월)
      if (number <= 12) {
        suggestions.push(
          { label: `${number}달 후` }, { label: `${number}달 전` },
          { label: `${number}개월 후` }, { label: `${number}개월 전` }
        );
      }

      // 년 (1-5년 정도)
      if (number <= 5) {
        suggestions.push(
          { label: `${number}년 후` }, { label: `${number}년 전` }
        );
      }

      return suggestions.filter(item => item.label.includes(query)).slice(0, 6);
    }

    // 3. 한글 숫자 패턴 (자연스러운 표현만)
    const naturalKoreanNumbers: Record<string, { time?: string; day?: string }> = {
      // 시간에 자연스러운 고유어 (한 시간, 두 시간...)
      '한': { time: '한 시간', day: '하루' },
      '두': { time: '두 시간', day: '이틀' },
      '세': { time: '세 시간', day: '사흘' },
      // 날짜에 자연스러운 한자어 (일일, 이일, 삼일...)
      '일': { day: '일일' },
      '이': { day: '이일' },
      '삼': { day: '삼일' },
      '사': { day: '사일' },
      '오': { day: '오일' }
    };

    const koreanNum = Object.keys(naturalKoreanNumbers).find(num => query.includes(num));
    if (koreanNum) {
      const suggestions = [];
      const numData = naturalKoreanNumbers[koreanNum];

      // 시간 표현 (고유어가 자연스러움)
      if (numData.time) {
        suggestions.push(
          { label: `${numData.time} 후` },
          { label: `${numData.time} 전` }
        );
      }

      // 일 표현 (한자어가 자연스러움)
      if (numData.day) {
        suggestions.push(
          { label: `${numData.day} 후` },
          { label: `${numData.day} 전` }
        );
      }

      // 주/월 표현
      suggestions.push(
        { label: `${koreanNum} 주 후` },
        { label: `${koreanNum} 주 전` },
        { label: `${koreanNum} 달 후` },
        { label: `${koreanNum} 달 전` }
      );

      return suggestions.filter(item => item.label.includes(query)).slice(0, 6);
    }

    // 4. 요일 관련 (전체 이름만, 충돌 방지)
    const weekdays = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
    const weekdayMatch = weekdays.find(day => query.includes(day));
    if (weekdayMatch) {
      return [
        { label: `다음 ${weekdayMatch}` },
        { label: `지난 ${weekdayMatch}` },
        { label: `이번 주 ${weekdayMatch}` },
        { label: `다음 주 ${weekdayMatch}` }
      ].filter(item => item.label.includes(query));
    }

    // 5. 시간대 관련
    const timeWords = ['오전', '오후', '아침', '저녁', '밤'];
    const timeMatch = timeWords.find(time => query.includes(time));
    if (timeMatch) {
      return [
        { label: `오늘 ${timeMatch}` },
        { label: `내일 ${timeMatch}` },
        { label: `어제 ${timeMatch}` }
      ].filter(item => item.label.includes(query));
    }

    // 6. 년도 관련
    const yearWords = ['올해', '내년', '작년', '이듬해', '재작년'];
    const yearMatch = yearWords.find(year => query.includes(year));
    if (yearMatch) {
      return [{ label: yearMatch }];
    }

    // 7. 기본 후보들 (핵심만)
    const basicSuggestions = [
      "오늘", "내일", "모레", "어제", "그저께",
    ];

    return basicSuggestions
      .filter(suggestion => suggestion.includes(query) || query.includes(suggestion.split(' ')[0]))
      .map(label => ({ label }))
      .slice(0, 6);
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
      return [
        { label: `in ${timeDelta} minutes` }, { label: `in ${timeDelta} hours` },
        { label: `in ${timeDelta} days` }, { label: `in ${timeDelta} weeks` },
        { label: `in ${timeDelta} months` }, { label: `${timeDelta} days ago` },
        { label: `${timeDelta} weeks ago` }, { label: `${timeDelta} months ago` },
      ].filter((item) => item.label.toLowerCase().includes(context.query));
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