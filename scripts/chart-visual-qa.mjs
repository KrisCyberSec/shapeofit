import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const DEFAULT_BASE_URL = "http://localhost:3011";
const BASE_URL = process.env.VISUAL_QA_BASE_URL ?? DEFAULT_BASE_URL;
const ARTIFACT_DIR = ".chart-qa";
const LOCAL_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const CHECKS = [
  {
    name: "immigration-lpr",
    query: "lawful permanent residents admitted since 2004",
    expectedTitle: "US Lawful Permanent Resident Admissions",
    expectedAxisLabels: ["Year", "People"],
    expectedSource: "LIVE - DHS"
  },
  {
    name: "us-life-expectancy",
    query: "life expectancy in united states since 1950",
    expectedTitle: "US Life Expectancy",
    expectedAxisLabels: ["Year", "Years"],
    expectedSource: "LIVE - WORLD BANK"
  },
  {
    name: "wages-vs-inflation",
    query: "wages since 2020 vs US inflation rate since 2020",
    expectedTitle: "Average hourly earnings vs CPI inflation",
    expectedAxisLabels: ["Date", "Index"],
    expectedSource: "LIVE - FRED"
  }
];

let devServer;

try {
  await ensureServer();
  await mkdir(ARTIFACT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? chromeExecutablePath()
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });

  for (const check of CHECKS) {
    await validateChart(page, check, "desktop");
    await validateChart(mobilePage, check, "mobile");
  }

  await browser.close();
  console.log(`Chart visual QA passed for ${CHECKS.length} queries across desktop and mobile.`);
} finally {
  if (devServer) devServer.kill("SIGTERM");
}

function chromeExecutablePath() {
  return existsSync(LOCAL_CHROME) ? LOCAL_CHROME : undefined;
}

async function ensureServer() {
  if (await serverResponds()) return;

  if (BASE_URL !== DEFAULT_BASE_URL) {
    throw new Error(`VISUAL_QA_BASE_URL did not respond: ${BASE_URL}`);
  }

  devServer = spawn("npm", ["run", "dev", "--", "-p", "3011"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env
  });

  devServer.stdout.on("data", (chunk) => process.stdout.write(chunk));
  devServer.stderr.on("data", (chunk) => process.stderr.write(chunk));

  const timeoutAt = Date.now() + 30_000;
  while (Date.now() < timeoutAt) {
    if (await serverResponds()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${BASE_URL}`);
}

async function serverResponds() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateChart(page, check, viewportName) {
  console.log(`Checking ${check.name} (${viewportName})...`);
  const url = `${BASE_URL}/?q=${encodeURIComponent(check.query)}`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector("svg.recharts-surface", { state: "attached", timeout: 60_000 });
  await page.waitForTimeout(600);

  const result = await page.evaluate(({ expectedTitle, expectedAxisLabels, expectedSource }) => {
    const svg = document.querySelector("svg.recharts-surface");
    const svgBox = svg?.getBoundingClientRect();
    const xTicks = Array.from(
      document.querySelectorAll(".recharts-xAxis .recharts-cartesian-axis-tick text")
    )
      .map((node) => node.textContent?.trim())
      .filter(Boolean);
    const yTicks = Array.from(
      document.querySelectorAll(".recharts-yAxis .recharts-cartesian-axis-tick text")
    )
      .map((node) => node.textContent?.trim())
      .filter(Boolean);
    const axisLabels = Array.from(document.querySelectorAll(".recharts-label text, text.recharts-label"))
      .map((node) => node.textContent?.trim())
      .filter(Boolean);
    const barBoxes = Array.from(document.querySelectorAll(".recharts-bar-rectangle"))
      .map((node) => node.getBoundingClientRect())
      .filter((box) => box.width > 0 && box.height > 0);
    const lineBoxes = Array.from(document.querySelectorAll(".recharts-line-curve, .recharts-area-curve"))
      .map((node) => node.getBoundingClientRect())
      .filter((box) => box.width > 0 && box.height > 0);
    const bodyText = document.body.innerText;

    return {
      hasTitle: bodyText.includes(expectedTitle),
      hasExpectedSource: bodyText.includes(expectedSource),
      svgSizeOk: Boolean(svgBox && svgBox.width >= 300 && svgBox.height >= 260),
      hasXAxis: Boolean(document.querySelector(".recharts-xAxis")),
      hasYAxis: Boolean(document.querySelector(".recharts-yAxis")),
      xTickCount: xTicks.length,
      yTickCount: yTicks.length,
      axisLabels,
      hasAxisLabels: expectedAxisLabels.every((label) => axisLabels.includes(label)),
      visibleMarkCount: barBoxes.length + lineBoxes.length,
      xTicks,
      yTicks
    };
  }, check);

  const failures = [];
  if (!result.hasTitle) failures.push(`missing title "${check.expectedTitle}"`);
  if (!result.hasExpectedSource) failures.push(`missing source badge "${check.expectedSource}"`);
  if (!result.svgSizeOk) failures.push("chart SVG is missing or too small");
  if (!result.hasXAxis) failures.push("missing X axis");
  if (!result.hasYAxis) failures.push("missing Y axis");
  if (result.xTickCount < 4) failures.push(`too few X ticks: ${result.xTickCount}`);
  if (result.yTickCount < 4) failures.push(`too few Y ticks: ${result.yTickCount}`);
  if (!result.hasAxisLabels) {
    failures.push(`missing axis labels ${check.expectedAxisLabels.join(", ")}`);
  }
  if (result.visibleMarkCount < 1) failures.push("no visible bars or line marks");

  await page.locator("article").screenshot({
    path: `${ARTIFACT_DIR}/${check.name}-${viewportName}.png`
  });

  if (failures.length) {
    throw new Error(
      `${check.name} ${viewportName} failed visual QA: ${failures.join("; ")}\n` +
        `Observed: ${JSON.stringify(result, null, 2)}`
    );
  }
}
