import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";

interface ChartProps {
  symbol: string;
  binanceSymbol: string;
}

export default function Chart({ symbol, binanceSymbol }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

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
      height: 300,
    });
    chartRef.current = chart;

    const candlestickSeries = (chart as any).addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#f43f5e",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#f43f5e",
    });
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chart && chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    // Fetch initial data
    setLoading(true);
    fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1h&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        if (!candlestickSeries || !Array.isArray(data)) {
            setLoading(false);
            return;
        }
        const formattedData = data.map((d: any) => ({
          time: (d[0] / 1000) as import("lightweight-charts").Time,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
        candlestickSeries.setData(formattedData);
        chart.timeScale().fitContent();
        setLoading(false);
      })
      .catch((err) => {
          console.error("Error fetching binance klines:", err);
          setLoading(false);
      });

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [binanceSymbol]);

  return (
    <div className="w-full flex-col bg-neutral-900 border border-neutral-800 rounded-xl p-4 mt-2 mb-4">
      <div className="mb-2 text-sm text-neutral-400 font-semibold uppercase tracking-wider">
        {symbol} (Binance - 1h)
      </div>
      <div className="relative w-full h-[300px]">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm rounded-lg">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
