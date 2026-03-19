"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE_URL } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface NewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  source_info?: { name: string };
  published_on: number;
  url: string;
  categories?: string;
  tags?: string;
}

const REFRESH_INTERVAL_MS = 60_000; // 1분마다 자동 갱신

function NewsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 animate-pulse">
          <div className="h-4 bg-neutral-800 rounded-full w-3/4 mb-3" />
          <div className="h-3 bg-neutral-800 rounded-full w-full mb-2" />
          <div className="h-3 bg-neutral-800 rounded-full w-5/6 mb-4" />
          <div className="flex justify-between">
            <div className="h-3 bg-neutral-800 rounded-full w-24" />
            <div className="h-3 bg-neutral-800 rounded-full w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NewsPage() {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [selectedSource, setSelectedSource] = useState<string>("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchNews = useCallback(async (p: number, isRefresh = false) => {
    if (p === 0) {
      if (!isRefresh) setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/news?page=${p}&limit=20`);
      const data = await res.json();

      if (Array.isArray(data)) {
        if (data.length < 10) setHasMore(false);

        if (p === 0) {
          setAllNews(data);
        } else {
          setAllNews((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const unique = data.filter((n) => !existingIds.has(n.id));
            return [...prev, ...unique];
          });
        }
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("News fetch failed", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNews(0);
  }, [fetchNews]);

  // Auto-refresh
  useEffect(() => {
    const id = setInterval(() => fetchNews(0, true), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNews]);

  // Collect unique sources
  const sources = useMemo(() => {
    const srcSet = new Set<string>();
    allNews.forEach((n) => {
      const src = n.source_info?.name || n.source;
      if (src) srcSet.add(src);
    });
    return ["전체", ...Array.from(srcSet).slice(0, 8)];
  }, [allNews]);

  // Filter
  const filteredNews = useMemo(() => {
    return allNews.filter((n) => {
      const src = n.source_info?.name || n.source;
      if (selectedSource !== "전체" && src !== selectedSource) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !n.body.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allNews, selectedSource, searchQuery]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNews(next);
  };

  return (
    <div className="min-h-screen bg-neutral-950 pb-20 md:pb-8">
      {/* Header */}
      <div className="max-w-[1100px] mx-auto px-3 md:px-8 pt-4 md:pt-8 pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">암호화폐 뉴스</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20 animate-pulse">LIVE</span>
            </div>
            <p className="text-neutral-500 text-xs">
              블록체인 · 가상자산 글로벌 최신 뉴스
              {lastUpdated && (
                <span className="ml-2 text-neutral-700">
                  · 마지막 업데이트 {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ko })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchNews(0, true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:border-neutral-600 transition-all self-start md:self-auto"
          >
            <span className="text-base leading-none">↻</span>
            새로고침
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-14 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-[1100px] mx-auto px-3 md:px-8 py-2 space-y-2">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="뉴스 검색..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Source filter */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            {sources.map((src) => (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedSource === src
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1100px] mx-auto px-3 md:px-8 py-4">
        {loading ? (
          <NewsSkeleton />
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            <p className="text-4xl mb-3">📰</p>
            <p className="text-sm">
              {searchQuery || selectedSource !== "전체"
                ? "검색 조건에 맞는 뉴스가 없습니다."
                : "불러올 뉴스가 없습니다."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-neutral-600 font-bold">{filteredNews.length}개 뉴스</span>
            </div>

            <div className="space-y-3">
              {filteredNews.map((news, idx) => {
                const sourceName = news.source_info?.name || news.source;
                const timeAgo = formatDistanceToNow(news.published_on * 1000, { addSuffix: true, locale: ko });
                const bodyClean = news.body.replace(/(<([^>]+)>)/gi, "");

                return (
                  <article
                    key={news.id}
                    className={`bg-neutral-900 border rounded-2xl p-5 cursor-pointer group transition-all hover:border-neutral-600 hover:bg-neutral-800/50 ${
                      idx === 0 ? "border-indigo-500/30 bg-indigo-500/5" : "border-neutral-800"
                    }`}
                    onClick={() => window.open(news.url, "_blank")}
                  >
                    {idx === 0 && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">최신</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h2 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors leading-snug flex-1">
                        {news.title}
                      </h2>
                      <span className="text-[10px] text-neutral-600 whitespace-nowrap shrink-0 mt-0.5">{timeAgo}</span>
                    </div>

                    {bodyClean && (
                      <p className="text-neutral-500 text-xs leading-relaxed mb-3 line-clamp-2">
                        {bodyClean}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest bg-neutral-800 px-2 py-0.5 rounded-md">
                          {sourceName}
                        </span>
                      </div>
                      <span className="text-indigo-500 group-hover:text-indigo-300 transition-colors text-xs font-bold flex items-center gap-1">
                        원문 보기 →
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && selectedSource === "전체" && !searchQuery && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-bold py-2.5 px-8 rounded-full transition-all text-sm disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      로딩 중...
                    </>
                  ) : (
                    "더 보기"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
