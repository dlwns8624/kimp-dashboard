"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/constants";

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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("전체");
  const [filterPeriod, setFilterPeriod] = useState("이번 주");
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/calendar`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch calendar", err);
        setLoading(false);
      });
  }, []);

  const getImportanceColor = (imp: string) => {
    if (imp === "높음") return "bg-rose-500 text-white";
    if (imp === "보통") return "bg-amber-500 text-white";
    return "bg-neutral-600 text-neutral-200";
  };

  const filteredEvents = events.filter((ev) => {
    if (filterLevel !== "전체" && ev.importance !== filterLevel) return false;
    // Period filter parsing can be done via date-fns
    return true; 
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">글로벌 경제 캘린더</h1>
          <p className="text-neutral-400 text-sm mt-1">암호화폐 변동성에 큰 영향을 미치는 주요 거시경제 지표 및 발표 일정입니다.</p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2">
          <select 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-white text-sm px-4 py-2 rounded-lg outline-none cursor-pointer"
          >
            <option value="오늘">오늘</option>
            <option value="내일">내일</option>
            <option value="이번 주">이번 주</option>
            <option value="다음 주">다음 주</option>
            <option value="월간">월간 데이터</option>
          </select>
          <select 
            value={filterLevel} 
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-white text-sm px-4 py-2 rounded-lg outline-none cursor-pointer"
          >
            <option value="전체">중요도: 전체</option>
            <option value="높음">중요도: 높음 (⭐⭐⭐)</option>
            <option value="보통">중요도: 보통 (⭐⭐)</option>
            <option value="낮음">중요도: 낮음 (⭐)</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-neutral-950/80">
                <th className="p-4 font-semibold text-neutral-400 text-xs tracking-widest border-b border-neutral-800">Date/Time</th>
                <th className="p-4 font-semibold text-neutral-400 text-xs tracking-widest border-b border-neutral-800">Event</th>
                <th className="p-4 font-semibold text-neutral-400 text-xs tracking-widest border-b border-neutral-800 text-center">Importance</th>
                <th className="p-4 font-semibold text-neutral-400 text-xs tracking-widest border-b border-neutral-800 text-right">Actual</th>
                <th className="p-4 font-semibold text-neutral-400 text-xs tracking-widest border-b border-neutral-800 text-right">Forecast</th>
                <th className="p-4 font-semibold text-neutral-400 text-xs tracking-widest border-b border-neutral-800 text-right">Previous</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-neutral-500">
                    <div className="flex flex-col items-center">
                       <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                       <span>데이터를 불러오는 중입니다...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-neutral-500">해당 조건에 맞는 일정이 없습니다.</td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm text-neutral-300">{ev.date}</span>
                        <span className="font-bold text-lg text-indigo-400">{ev.time}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-white block">{ev.name}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${getImportanceColor(ev.importance)}`}>
                        {ev.importance}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-bold ${ev.actual !== '-' ? 'text-white' : 'text-neutral-600'}`}>
                        {ev.actual}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-neutral-400 text-sm">
                        {ev.forecast}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-neutral-500 text-sm">
                        {ev.previous}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
