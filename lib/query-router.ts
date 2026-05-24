const QUERY_REWRITES: Array<{ pattern: RegExp; query: string }> = [
  {
    pattern: /^(are\s+)?houses?\s+affordable|housing affordability|can people afford homes/i,
    query: "mortgage rates since 2020"
  },
  {
    pattern: /wages?.*(keep up|kept up|keeping up).*(inflation|prices)|inflation.*wages?/i,
    query: "wages since 2020"
  },
  {
    pattern: /(groceries|grocery|food).*(expensive|prices|inflation)|why are groceries/i,
    query: "US food price inflation since 2020"
  },
  {
    pattern: /(fed|federal reserve).*(raise|raised|cut|cuts|rates)|interest rates/i,
    query: "fed funds rate since 2015"
  },
  {
    pattern: /(jobs?|labor market).*(weak|strong|bad|good)|job market/i,
    query: "unemployment rate since 2020"
  },
  {
    pattern: /japan.*aging|aging.*japan|life expectancy.*japan/i,
    query: "life expectancy in the US vs Japan since 1960"
  },
  {
    pattern: /cities.*growing|urbanization|more urban/i,
    query: "urban population share since 1960"
  },
  {
    pattern: /biggest countries|largest countries|most populous/i,
    query: "largest countries by population today"
  }
];

export function routeQueryIntent(query: string) {
  const trimmed = query.trim();
  return QUERY_REWRITES.find((rewrite) => rewrite.pattern.test(trimmed))?.query ?? trimmed;
}
