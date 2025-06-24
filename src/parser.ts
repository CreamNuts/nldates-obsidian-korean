import chrono, { Chrono, Parser } from "chrono-node";
import type { Moment } from "moment";

import { DayOfWeek } from "./settings";
import {
  ORDINAL_NUMBER_PATTERN,
  getLastDayOfMonth,
  getLocaleWeekStart,
  getWeekNumber,
  parseOrdinalNumberPattern,
} from "./utils";

// 한글 번역 모듈 import 추가
import { translateKoreanToEnglish, containsKorean } from "./korean-translator";

export interface NLDResult {
  formattedString: string;
  date: Date;
  moment: Moment;
}

function getLocalizedChrono(): Chrono {
  const locale = window.moment.locale();

  switch (locale) {
    case "en-gb":
      return new Chrono(chrono.en.createCasualConfiguration(true));
    default:
      return new Chrono(chrono.en.createCasualConfiguration(false));
  }
}

function getConfiguredChrono(): Chrono {
  const localizedChrono = getLocalizedChrono();
  localizedChrono.parsers.push({
    pattern: () => {
      return /\bChristmas\b/i;
    },
    extract: () => {
      return {
        day: 25,
        month: 12,
      };
    },
  });

  localizedChrono.parsers.push({
    pattern: () => new RegExp(ORDINAL_NUMBER_PATTERN),
    extract: (_context, match) => {
      return {
        day: parseOrdinalNumberPattern(match[0]),
        month: window.moment().month(),
      };
    },
  } as Parser);
  return localizedChrono;
}

export default class NLDParser {
  chrono: Chrono;

  constructor() {
    this.chrono = getConfiguredChrono();
  }

  getParsedDate(selectedText: string, weekStartPreference: DayOfWeek): Date {
    // 한글 처리 로직 추가
    let processedText = selectedText;

    // 한글이 포함되어 있으면 영어로 번역
    if (containsKorean(selectedText)) {
      processedText = translateKoreanToEnglish(selectedText);
      console.debug(`Korean text "${selectedText}" translated to "${processedText}"`);
    }
    const parser = this.chrono;
    const initialParse = parser.parse(processedText);
    const weekdayIsCertain = initialParse[0]?.start.isCertain("weekday");

    const weekStart =
      weekStartPreference === "locale-default"
        ? getLocaleWeekStart()
        : weekStartPreference;

    const locale = {
      weekStart: getWeekNumber(weekStart),
    };

    const thisDateMatch = processedText.match(/this\s([\w]+)/i);
    const nextDateMatch = processedText.match(/next\s([\w]+)/i);
    const lastDayOfMatch = processedText.match(/(last day of|end of)\s*([^\n\r]*)/i);
    const midOf = processedText.match(/mid\s([\w]+)/i);

    const referenceDate = weekdayIsCertain
      ? window.moment().weekday(0).toDate()
      : new Date();

    if (thisDateMatch && thisDateMatch[1] === "week") {
      return parser.parseDate(`this ${weekStart}`, referenceDate);
    }

    if (nextDateMatch && nextDateMatch[1] === "week") {
      return parser.parseDate(`next ${weekStart}`, referenceDate, {
        forwardDate: true,
      });
    }

    if (nextDateMatch && nextDateMatch[1] === "month") {
      const thisMonth = parser.parseDate("this month", new Date(), {
        forwardDate: true,
      });
      return parser.parseDate(processedText, thisMonth, {
        forwardDate: true,
      });
    }

    if (nextDateMatch && nextDateMatch[1] === "year") {
      const thisYear = parser.parseDate("this year", new Date(), {
        forwardDate: true,
      });
      return parser.parseDate(processedText, thisYear, {
        forwardDate: true,
      });
    }

    if (lastDayOfMatch) {
      const tempDate = parser.parse(lastDayOfMatch[2]);
      const year = tempDate[0].start.get("year");
      const month = tempDate[0].start.get("month");
      const lastDay = getLastDayOfMonth(year, month);

      return parser.parseDate(`${year}-${month}-${lastDay}`, new Date(), {
        forwardDate: true,
      });
    }

    if (midOf) {
      return parser.parseDate(`${midOf[1]} 15th`, new Date(), {
        forwardDate: true,
      });
    }

    return parser.parseDate(processedText, referenceDate, { locale });
  }
}
