import React, { useEffect, useRef, memo } from 'react';
import { createChart, IChartApi, LineData, Time, AreaSeries } from 'lightweight-charts';

interface MiniChartProps {
  data: Array<{ date: string; close: number }>;
  width?: number;
  height?: number;
  positive?: boolean;
}

/**
 * MiniChart Component
 * Compact sparkline for stock price history
 */
const MiniChart: React.FC<MiniChartProps> = memo(({
  data,
  width = 80,
  height = 32,
  positive = true,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    // Add area series (v5.x API)
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: positive ? '#22c55e' : '#ef4444',
      topColor: positive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      bottomColor: positive ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
      lineWidth: 1,
      crosshairMarkerVisible: false,
    });

    // Transform data
    const chartData: LineData<Time>[] = data.map((d) => ({
      time: d.date as Time,
      value: d.close,
    }));

    areaSeries.setData(chartData);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data, width, height, positive]);

  if (!data || data.length === 0) {
    return <div style={{ width, height }} className="bg-gray-100 rounded" />;
  }

  return <div ref={chartContainerRef} />;
});

MiniChart.displayName = 'MiniChart';

export default MiniChart;
