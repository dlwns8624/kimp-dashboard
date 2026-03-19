"use client";

import React, { useState, useEffect, useCallback } from "react";
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
}

export default function NewsPage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const fetchNews = useCallback((p: number) => {
    if (p === 0) setLoading(true);
    fetch(`${API_BASE_URL}/api/news?page=${p}&limit=10`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          if (p === 0) setNewsList(data);
          else setNewsList(prev => {
              // Prevent duplicates if any
              const existingIds = new Set(prev.map(n => n.id));
              const uniqueNew = data.filter(n => !existingIds.has(n.id));
              return [...prev, ...uniqueNew];
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch news", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchNews(0);
  }, [fetchNews]);

  const loadMoreNews = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">트렌딩 트라이브 뉴스</h1>
          <p className="text-neutral-400 text-sm mt-1">블록체인 및 가상자산 시장의 글로벌 최신 뉴스를 실시간으로 전해드립니다.</p>
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-neutral-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>실시간 뉴스를 불러오는 중입니다...</p>
          </div>
        ) : newsList.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">불러올 뉴스가 없습니다.</div>
        ) : (
          newsList.map((news) => (
            <div 
              key={news.id} 
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-colors rounded-2xl p-6 cursor-pointer group"
              onClick={() => window.open(news.url, "_blank")}
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors mb-2">
                  {news.title}
                </h2>
                <span className="text-xs text-neutral-500 whitespace-nowrap ml-4">
                  {formatDistanceToNow(news.published_on * 1000, { addSuffix: true, locale: ko })}
                </span>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed mb-4 line-clamp-3">
                {news.body.replace(/(<([^>]+)>)/gi, "")}
              </p>
              <div className="flex items-center justify-between mt-4 text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                <span>{news.source_info?.name || news.source}</span>
                <div className="text-indigo-500 hover:text-indigo-300 transition-colors flex items-center gap-1">
                  원문 읽기 <span className="text-lg leading-none">→</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      <div className="flex justify-center pt-8">
        <button 
          onClick={loadMoreNews}
          className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-8 rounded-full transition-colors border border-neutral-700 shadow-lg"
        >
          더 가져오기 (Load More)
        </button>
      </div>
    </div>
  );
}
