"use client";

import React, { useState, useEffect, useMemo } from "react";
import { API_BASE_URL } from "@/lib/constants";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

interface CalendarEvent {
  id: number;
  date: string;
  time: string;
  name: string;
  importance: string;
  actual: string;
  forecast: string;
  previous: string;
}

const IMPORTANCE_CONFIG: Record<string, { color: string; bg: string; stars: string }> = {
  높음: { color: "text-rose-400", bg: "bg-rose-500/10 border border-rose-500/20", stars: "★★★" },
  보통: { color: "text-amber-400", bg: "bg-amber-500/10 border border-amber-500/20", stars: "★★☆" },
  낮음: { color: "text-neutral-400", bg: "bg-neutral-700/30 border border-neutral-700", stars: "★☆☆" },
};

const PERIOD_OPTIONS = [
  { value: "오늘", label: "오늘" },
  { value: "내일", label: "내일" },
  { value: "이번 주", label: "이번 주" },
  { value: "다음 주", label: "다음 주" },
  { value: "이번 달", label: "이번 달" },
  { value: "전체", label: "전체" },
];

function getDateRange(period: string): { start: Date; end: Date } | null {
  const now = new Date();
  switch (period) {
    case "오늘":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "내일": {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return { start: startOfDay(tomorrow), end: endOfDay(tomorrow) };
    }
    case "이번 주":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "다음 주": {
      const nextWeek = addWeeks(now, 1);
      return { start: startOfWeek(nextWeek, { weekStartsOn: 1 }), end: endOfWeek(nextWeek, { weekStartsOn: 1 }) };
    }
    case "이번 달":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    default:
      return null;
  }
}

function ActualBadge({ actual, forecast }: { actual: string; forecast: string }) {
  if (actual === "-" || !actual) {
    return <span className="text-neutral-600 text-sm">-</span>;
  }
  const actualNum = parseFloat(actual);
  const forecastNum = parseFloat(forecast);
  let colorClass = "text-white";
  if (!isNaN(actualNum) && !isNaN(forecastNum)) {
    colorClass = actualNum >= forecastNum ? "text-emerald-400" : "text-rose-400";
  }
  return <span className={`text-sm font-black ${colorClass}`}>{actual}</span>;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("전체");
  const [filterPeriod, setFilterPeriod] = useState("이번 주");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/calendar`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterLevel !== "전체" && ev.importance !== filterLevel) return false;

      if (filterPeriod !== "전체") {
        const range = getDateRange(filterPeriod);
        if (range) {
          try {
            const evDate = parseISO(ev.date);
            if (!isWithinInterval(evDate, range)) return false;
          } catch {
            return false;
          }
        }
      }
      return true;
    });
  }, [events, filterLevel, filterPeriod]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach((ev) => {
      if (!groups[ev.date]) groups[ev.date] = [];
      groups[ev.date].push(ev);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  const formatDate = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      return {
        full: `${d.getMonth() + 1}월 ${d.getDate()}일`,
        day: days[d.getDay()],
        isToday: dateStr === new Date().toISOString().slice(0, 10),
      };
    } catch {
      return { full: dateStr, day: "", isToday: false };
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 md:pb-8">
      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-3 md:px-8 pt-4 md:pt-8 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">글로벌 경제 캘린더</h1>
        </div>
        <p className="text-neutral-500 text-xs">암호화폐 변동성에 영향을 미치는 주요 거시경제 지표 발표 일정</p>
      </div>

      {/* Filters */}
      <div className="sticky top-14 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-[1200px] mx-auto px-3 md:px-8 py-2 flex flex-wrap gap-2 items-center">
          {/* Period filter */}
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setFilterPeriod(p.value)}
                className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                  filterPeriod === p.value
                    ? "bg-indigo-600 text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Importance filter */}
          <div className="flex gap-1.5">
            {["전체", "높음", "보통", "낮음"].map((level) => {
              const cfg = IMPORTANCE_CONFIG[level] ?? { color: "text-neutral-400", bg: "", stars: "" };
              const isActive = filterLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isActive
                      ? level === "전체"
                        ? "bg-neutral-700 text-white border-neutral-600"
                        : `${cfg.bg} ${cfg.color} border-transparent`
                      : "bg-transparent border-neutral-800 text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {level === "전체" ? "전체" : `${cfg.stars} ${level}`}
                </button>
              );
            })}
          </div>

          {/* Count */}
          <span className="ml-auto text-[10px] text-neutral-600 font-bold">
            {filteredEvents.length}개 이벤트
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-3 md:px-8 py-4 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center py-20 text-neutral-500">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <span className="text-sm">데이터를 불러오는 중입니다...</span>
          </div>
        ) : groupedByDate.length === 0 ? (
          <div className="text-center py-20 text-neutral-500 text-sm">
            해당 조건에 맞는 일정이 없습니다.
          </div>
        ) : (
          groupedByDate.map(([date, dateEvents]) => {
            const { full, day, isToday } = formatDate(date);
            return (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex items-center gap-2 ${isToday ? "text-indigo-400" : "text-neutral-300"}`}>
                    <span className="font-black text-base">{full}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isToday
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : "bg-neutral-800 text-neutral-500"
                    }`}>
                      {isToday ? "오늘" : `(${day})`}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-neutral-800" />
                </div>

                {/* Events */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800/50">
                  {dateEvents.map((ev) => {
                    const cfg = IMPORTANCE_CONFIG[ev.importance] ?? IMPORTANCE_CONFIG["낮음"];
                    const hasResult = ev.actual !== "-" && ev.actual;
                    return (
                      <div key={ev.id} className={`flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3.5 hover:bg-neutral-800/30 transition-colors ${hasResult ? "opacity-75" : ""}`}>
                        {/* Time */}
                        <div className="flex items-center gap-3 sm:w-24 shrink-0">
                          <span className={`font-mono text-sm font-black ${hasResult ? "text-neutral-500" : "text-indigo-400"}`}>
                            {ev.time}
                          </span>
                          {hasResult && (
                            <span className="sm:hidden text-[9px] text-neutral-600 font-bold uppercase">완료</span>
                          )}
                        </div>

                        {/* Importance */}
                        <div className="hidden sm:block sm:w-20 shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                            {cfg.stars}
                          </span>
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="sm:hidden">
                              <span className={`text-[9px] font-bold ${cfg.color}`}>{cfg.stars}</span>
                            </span>
                            <span className="text-sm font-bold text-white truncate">{ev.name}</span>
                          </div>
                        </div>

                        {/* Values */}
                        <div className="flex items-center gap-4 sm:gap-6 shrink-0 text-right">
                          <div>
                            <p className="text-[9px] text-neutral-600 uppercase font-bold mb-0.5">실제</p>
                            <ActualBadge actual={ev.actual} forecast={ev.forecast} />
                          </div>
                          <div>
                            <p className="text-[9px] text-neutral-600 uppercase font-bold mb-0.5">예측</p>
                            <span className="text-sm text-neutral-400">{ev.forecast || "-"}</span>
                          </div>
                          <div>
                            <p className="text-[9px] text-neutral-600 uppercase font-bold mb-0.5">이전</p>
                            <span className="text-sm text-neutral-600">{ev.previous || "-"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
