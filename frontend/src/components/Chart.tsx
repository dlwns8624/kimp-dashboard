"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

interface ChartProps {
  symbol: string;
  upbitSymbol?: string;
}

export default function Chart({ symbol, upbitSymbol }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const market = upbitSymbol || `KRW-${symbol}`;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: '#485c7b',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;
    const candleSeries = (chart as any).addCandlestickSeries({
      upColor: '#ef4444',
      downColor: '#3b82f6',
      borderVisible: false,
      wickUpColor: '#ef4444',
      wickDownColor: '#3b82f6',
    });

    // Fetch Upbit Candles
    const fetchUrl = `https://api.upbit.com/v1/candles/minutes/60?market=${market}&count=100`;
    fetch(fetchUrl)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formattedData = data.map(c => ({
            time: (new Date(c.candle_date_time_kst).getTime() / 1000) as any,
            open: c.opening_price,
            high: c.high_price,
            low: c.low_price,
            close: c.trade_price,
          })).sort((a, b) => a.time - b.time);
          candleSeries.setData(formattedData);
          chart.timeScale().fitContent();
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Chart fetch error", err);
        setLoading(false);
      });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, upbitSymbol, market]);

  return (
    <div className="w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative">
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/20">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs ring-1 ring-indigo-500/20">
                {symbol.charAt(0)}
            </div>
            <div>
                <h3 className="text-white font-black text-sm leading-none mb-1">{symbol} 실시간 잉여 데이터</h3>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none">Upbit Market Feed</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded-md bg-neutral-800 text-[10px] font-bold text-neutral-400 border border-neutral-700">1H</div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>
      
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950/40 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-[400px]" />
      </div>
      
      <div className="p-3 bg-neutral-950/30 border-t border-neutral-800 flex justify-between items-center">
        <p className="text-[10px] font-medium text-neutral-500">※ {market} 마켓 기준 데이터입니다.</p>
        <button className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">Detail View →</button>
      </div>
    </div>
  );
}
