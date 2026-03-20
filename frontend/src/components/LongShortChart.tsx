"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  AreaSeries,
  LineSeries,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import { API_BASE_URL } from "@/lib/constants";

interface ChartProps {
  symbol: string;
  timeframe: string;
  traderType?: "top" | "global";
  chartType?: "line" | "area";
}

export default function LongShortChart({
  symbol,
  timeframe,
  traderType = "global",
  chartType = "area",
}: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#171717" },
        textColor: "#a3a3a3",
      },
      grid: {
        vertLines: { color: "#262626" },
        horzLines: { color: "#262626" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      rightPriceScale: {
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
    });
    chartRef.current = chart;

    const SeriesType = chartType === "area" ? AreaSeries : LineSeries;

    const longSeriesOptions =
      chartType === "area"
        ? {
            topColor: "rgba(16, 185, 129, 0.3)",
            bottomColor: "rgba(16, 185, 129, 0)",
            lineColor: "#10b981",
            lineWidth: 2 as const,
            priceLineVisible: false,
          }
        : {
            color: "#10b981",
            lineWidth: 2 as const,
            priceLineVisible: false,
          };

    const shortSeriesOptions =
      chartType === "area"
        ? {
            topColor: "rgba(244, 63, 94, 0.3)",
            bottomColor: "rgba(244, 63, 94, 0)",
            lineColor: "#f43f5e",
            lineWidth: 2 as const,
            priceLineVisible: false,
          }
        : {
            color: "#f43f5e",
            lineWidth: 2 as const,
            priceLineVisible: false,
          };

    const longSeries = chart.addSeries(SeriesType, longSeriesOptions);
    const shortSeries = chart.addSeries(SeriesType, shortSeriesOptions);

    const handleResize = () => {
      if (chart && chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    setLoading(true);
    fetch(
      `${API_BASE_URL}/api/long-short?symbol=${symbol}USDT&period=${timeframe}&type=${traderType}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
          setLoading(false);
          return;
        }

        const seen = new Set<number>();
        const longData: { time: Time; value: number }[] = [];
        const shortData: { time: Time; value: number }[] = [];

        data
          .map((d: any) => ({
            time: Math.floor(new Date(d.timestamp).getTime() / 1000),
            longVal: parseFloat(d.longAccount) * 100,
            shortVal: parseFloat(d.shortAccount) * 100,
          }))
          .filter(
            (d: { time: number; longVal: number; shortVal: number }) =>
              !isNaN(d.time) && !isNaN(d.longVal) && !isNaN(d.shortVal)
          )
          .sort((a: { time: number }, b: { time: number }) => a.time - b.time)
          .forEach((d: { time: number; longVal: number; shortVal: number }) => {
            if (!seen.has(d.time)) {
              seen.add(d.time);
              longData.push({ time: d.time as Time, value: d.longVal });
              shortData.push({ time: d.time as Time, value: d.shortVal });
            }
          });

        if (longData.length > 0) {
          try {
            longSeries.setData(longData);
            shortSeries.setData(shortData);
            chart.timeScale().fitContent();
          } catch (err) {
            console.error("Chart data error:", err);
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
  }, [symbol, timeframe, traderType, chartType]);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-emerald-500 rounded-full" />
          <span className="text-[10px] text-neutral-500 font-bold">Long %</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-rose-500 rounded-full" />
          <span className="text-[10px] text-neutral-500 font-bold">Short %</span>
        </div>
      </div>

      <div className="relative h-[400px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm rounded-lg">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
