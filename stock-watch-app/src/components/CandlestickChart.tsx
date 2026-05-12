import React, { useEffect, useRef, memo } from 'react';
import { createChart, IChartApi, CandlestickData, Time, CrosshairMode, CandlestickSeries, HistogramSeries } from 'lightweight-charts';

interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  data: PriceData[];
  height?: number;
  showVolume?: boolean;
}

/**
 * CandlestickChart Component
 * Full-featured candlestick chart with volume
 */
const CandlestickChart: React.FC<CandlestickChartProps> = memo(({
  data,
  height = 300,
  showVolume = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    const container = chartContainerRef.current;

    // Create chart
    const chart = createChart(container, {
      height,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#9ca3af',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: '#9ca3af',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#e5e7eb',
      },
      timeScale: {
        borderColor: '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series (v5.x API)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#16a34a',
      borderDownColor: '#dc2626',
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
    });

    // Transform data
    const candleData: CandlestickData<Time>[] = data.map((d) => ({
      time: d.date as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(candleData);

    // Add volume histogram if requested
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#60a5fa',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
      });

      const volumeData = data.map((d) => ({
        time: d.date as Time,
        value: d.volume || 0,
        color: d.close >= d.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
      }));

      volumeSeries.setData(volumeData);
    }

    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (container) {
        chart.applyOptions({ width: container.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, height, showVolume]);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-gray-50 rounded-lg"
      >
        <span className="text-gray-400">No price data available</span>
      </div>
    );
  }

  return <div ref={chartContainerRef} className="w-full" />;
});

CandlestickChart.displayName = 'CandlestickChart';

export default CandlestickChart;
