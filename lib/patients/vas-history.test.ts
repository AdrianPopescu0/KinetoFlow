import assert from "node:assert/strict"
import { test } from "node:test"

import {
  buildVasDailySeries,
  formatVasChartDate,
  isHighPainVas,
  vasHistorySpansYears,
} from "./vas-history.ts"

test("buildVasDailySeries e gol fără check-in-uri", () => {
  assert.deepEqual(buildVasDailySeries([]), [])
})

test("buildVasDailySeries păstrează un singur punct pe zi, cel mai recent", () => {
  const series = buildVasDailySeries([
    { vas_score: 4, created_at: "2026-09-08T07:00:00.000Z" },
    { vas_score: 8, created_at: "2026-09-08T14:00:00.000Z" },
    { vas_score: 2, created_at: "2026-09-06T10:00:00.000Z" },
  ])
  assert.deepEqual(
    series.map((point) => ({ dateKey: point.dateKey, vasScore: point.vasScore })),
    [
      { dateKey: "2026-09-06", vasScore: 2 },
      { dateKey: "2026-09-08", vasScore: 8 },
    ],
  )
})

test("buildVasDailySeries folosește calendarul București la miezul nopții", () => {
  const series = buildVasDailySeries([
    { vas_score: 5, created_at: "2026-09-07T21:30:00.000Z" },
  ])
  assert.equal(series.length, 1)
  assert.equal(series[0]?.dateKey, "2026-09-08")
  assert.equal(series[0]?.vasScore, 5)
})

test("buildVasDailySeries sortează zilele cronologic", () => {
  const series = buildVasDailySeries([
    { vas_score: 9, created_at: "2026-09-10T08:00:00.000Z" },
    { vas_score: 1, created_at: "2026-09-01T08:00:00.000Z" },
    { vas_score: 4, created_at: "2026-09-05T08:00:00.000Z" },
  ])
  assert.deepEqual(
    series.map((point) => point.dateKey),
    ["2026-09-01", "2026-09-05", "2026-09-10"],
  )
})

test("formatVasChartDate afișează ziua.luna", () => {
  assert.equal(formatVasChartDate("2026-09-08"), "8.09")
  assert.equal(formatVasChartDate("2026-09-08", true), "8.09.26")
})

test("vasHistorySpansYears detectează trecerea de an", () => {
  assert.equal(
    vasHistorySpansYears([
      { dateKey: "2025-12-31", vasScore: 3, createdAt: "2025-12-31T10:00:00.000Z" },
      { dateKey: "2026-01-02", vasScore: 4, createdAt: "2026-01-02T10:00:00.000Z" },
    ]),
    true,
  )
  assert.equal(
    vasHistorySpansYears([
      { dateKey: "2026-01-02", vasScore: 4, createdAt: "2026-01-02T10:00:00.000Z" },
      { dateKey: "2026-09-08", vasScore: 2, createdAt: "2026-09-08T10:00:00.000Z" },
    ]),
    false,
  )
})

test("isHighPainVas e adevărat de la 7 în sus", () => {
  assert.equal(isHighPainVas(null), false)
  assert.equal(isHighPainVas(6), false)
  assert.equal(isHighPainVas(7), true)
  assert.equal(isHighPainVas(10), true)
})
