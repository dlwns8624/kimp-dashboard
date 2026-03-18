"use client";

import { useEffect, useRef, useState } from "react";
import * as LightweightCharts from "lightweight-charts";
import { API_BASE_URL } from "@/lib/constants";

interface ChartProps {
  symbol: string;
  timeframe: string;
}

export default function LongShortChart({ symbol, timeframe }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<LightweightCharts.IChartApi | null>(null);
  const seriesRef = useRef<LightweightCharts.ISeriesApi<"Area"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      layout: {
        background: { type: LightweightCharts.ColorType.Solid, color: "#171717" },
        textColor: "#a3a3a3",
      },
      grid: {
        vertLines: { color: "#262626" },
        horzLines: { color: "#262626" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      rightPriceScale: {
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
      },
    });
    chartRef.current = chart;

    const areaSeries = (chart as any).addAreaSeries({
      topColor: "rgba(16, 185, 129, 0.4)",
      bottomColor: "rgba(16, 185, 129, 0)",
      lineColor: "#10b981",
      lineWidth: 2,
    });
    seriesRef.current = areaSeries;

    const handleResize = () => {
      if (chart && chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    // Fetch Real Data
    setLoading(true);
    fetch(`${API_BASE_URL}/api/long-short?symbol=${symbol}USDT&period=${timeframe}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            setLoading(false);
            return;
        }
        
        const formattedData = data
          .map((d: any) => {
            const time = Math.floor(new Date(d.timestamp).getTime() / 1000);
            const value = parseFloat(d.longAccount) * 100;
            if (isNaN(time) || isNaN(value)) return null;
            return { time: time as import("lightweight-charts").Time, value };
          })
          .filter((item): item is { time: import("lightweight-charts").Time; value: number } => item !== null)
          .sort((a, b) => (a.time as number) - (b.time as number));

        // Ensure unique ascending times
        const uniqueData: any[] = [];
        const seen = new Set();
        formattedData.forEach((item: any) => {
            if (!seen.has(item.time)) {
                seen.add(item.time);
                uniqueData.push(item);
            }
        });

        if (uniqueData.length > 0 && areaSeries) {
            try {
                areaSeries.setData(uniqueData);
                chartRef.current?.timeScale().fitContent();
            } catch (error) {
                console.error("Error setting chart data:", error);
            }
        }
        setLoading(false);
      })
      .catch((err) => {
          console.error("Failed to fetch long/short data", err);
          setLoading(false);
      });

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol, timeframe]);

  return (
    <div className="relative w-full h-[400px]">
      {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm rounded-lg">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}
