import React, { useState, useEffect } from 'react';
import styles from './RevenueProposalsChart.module.css';

interface ChartDataPoint {
  month: string;
  proposals: number;
  impressions: number;
  clicks: number;
  earnings?: number;
  pendingEarnings?: number;
  monthIndex: number;
}

interface RevenueProposalsChartProps {
  proposalStats: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  earnings: {
    total: number;
    paid: number;
    pending: number;
  };
  monthlyData?: ChartDataPoint[];
}

const RevenueProposalsChart: React.FC<RevenueProposalsChartProps> = ({
  monthlyData,
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  useEffect(() => {

    if (monthlyData && monthlyData.length > 0) {
      // Use real monthly data from backend
      setChartData(monthlyData);
    } else {
     
      const emptyData = months.map((month, index) => ({
        month,
        proposals: 0,
        impressions: 0,
        clicks: 0,
        earnings: 0,
        pendingEarnings: 0,
        monthIndex: index,
      }));
      setChartData(emptyData);
    }
  }, [monthlyData]);  const maxProposals = chartData.length > 0 ? Math.max(...chartData.map((d) => d.proposals), 1) : 1;
  const maxImpressions =
    chartData.length > 0 ? Math.max(...chartData.map((d) => d.impressions), 1) : 1;
  const maxClicks = chartData.length > 0 ? Math.max(...chartData.map((d) => d.clicks), 1) : 1;

  // SVG chart dimensions
  const svgWidth = 800;
  const svgHeight = 350;
  const padding = { top: 40, right: 40, bottom: 50, left: 60 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Calculate scale
  const xScale = chartWidth / (months.length - 1);
  const yScale = chartHeight / Math.max(maxProposals, maxImpressions, maxClicks);

  // Generate SVG path for area chart
  const generatePath = (
    dataKey: 'proposals' | 'impressions' | 'clicks',
    includeBase: boolean = true,
  ) => {
    if (chartData.length === 0) return '';

    let path = '';

    chartData.forEach((d, i) => {
      const x = padding.left + i * xScale;
      const value = d[dataKey];
      const y = padding.top + chartHeight - value * yScale;

      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    if (includeBase && chartData.length > 0) {
      // Close the path to create area by going back to the baseline
      const lastX = padding.left + (chartData.length - 1) * xScale;
      const baseY = padding.top + chartHeight;
      path += ` L ${lastX} ${baseY}`;

      // Go back along the baseline to the start
      for (let i = chartData.length - 2; i >= 0; i--) {
        const x = padding.left + i * xScale;
        path += ` L ${x} ${baseY}`;
      }

      path += ' Z';
    }

    return path;
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Overview</h3>
        <span className={styles.yearLabel}>{new Date().getFullYear()}</span>
      </div>

      <div className={styles.svgWrapper}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className={styles.areaChart}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={`grid-${i}`}
              x1={padding.left}
              y1={padding.top + (chartHeight / 5) * i}
              x2={svgWidth - padding.right}
              y2={padding.top + (chartHeight / 5) * i}
              className={styles.gridLine}
            />
          ))}

          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            className={styles.axisLine}
          />

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={svgWidth - padding.right}
            y2={padding.top + chartHeight}
            className={styles.axisLine}
          />

          {/* Areas - Proposals (Pink/Red) */}
          {chartData.length > 0 && (
            <>
              <path
                d={generatePath('proposals', true)}
                className={styles.areaProposals}
                fillOpacity="0.4"
              />
              <path
                d={generatePath('proposals', false)}
                className={styles.lineProposals}
                fill="none"
                strokeWidth="2"
              />

              {/* Areas - Impressions (Purple/Blue) */}
              <path
                d={generatePath('impressions', true)}
                className={styles.areaImpressions}
                fillOpacity="0.3"
              />
              <path
                d={generatePath('impressions', false)}
                className={styles.lineImpressions}
                fill="none"
                strokeWidth="2"
              />

              {/* Areas - Clicks (Light Blue/Cyan) */}
              <path
                d={generatePath('clicks', true)}
                className={styles.areaClicks}
                fillOpacity="0.3"
              />
              <path
                d={generatePath('clicks', false)}
                className={styles.lineClicks}
                fill="none"
                strokeWidth="2"
              />
            </>
          )}

          {/* Data points and hover interaction */}
          {chartData.map((d, i) => {
            const x = padding.left + i * xScale;
            const yProposals = padding.top + chartHeight - d.proposals * yScale;
            const yImpressions = padding.top + chartHeight - d.impressions * yScale;
            const yClicks = padding.top + chartHeight - d.clicks * yScale;

            return (
              <g key={`data-${i}`}>
                {/* Invisible hover area */}
                <rect
                  x={x - xScale / 2}
                  y={padding.top}
                  width={xScale}
                  height={chartHeight}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredMonth(d.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                />

                {/* Data point circles */}
                {hoveredMonth === d.month && (
                  <>
                    <circle cx={x} cy={yProposals} r="5" className={styles.dotProposals} />
                    <circle cx={x} cy={yImpressions} r="5" className={styles.dotImpressions} />
                    <circle cx={x} cy={yClicks} r="5" className={styles.dotClicks} />

                    {/* Tooltip - Dynamic positioning based on data point location */}
                    {(() => {
                      const avgY = (yProposals + yImpressions + yClicks) / 3;
                      const tooltipHeight = 85;
                      const tooltipMargin = 10;

                      // Position tooltip above if there's space, otherwise below
                      const tooltipY =
                        avgY - tooltipHeight - tooltipMargin > 0
                          ? avgY - tooltipHeight - tooltipMargin
                          : avgY + tooltipMargin;

                      return (
                        <g>
                          <rect
                            x={x - 75}
                            y={tooltipY}
                            width="150"
                            height="85"
                            rx="6"
                            className={styles.tooltipBg}
                          />
                          <text
                            x={x}
                            y={tooltipY + 20}
                            className={styles.tooltipText}
                            fontWeight="600"
                          >
                            {d.month}
                          </text>
                          <text
                            x={x}
                            y={tooltipY + 40}
                            className={styles.tooltipValue}
                            fill="#ff6b9d"
                          >
                            Proposals: {d.proposals}
                          </text>
                          <text
                            x={x}
                            y={tooltipY + 60}
                            className={styles.tooltipValue}
                            fill="#9b7fdb"
                          >
                            Impressions: {d.impressions}
                          </text>
                          <text
                            x={x}
                            y={tooltipY + 80}
                            className={styles.tooltipValue}
                            fill="#5fd3f3"
                          >
                            Clicks: {d.clicks}
                          </text>
                        </g>
                      );
                    })()}
                  </>
                )}
              </g>
            );
          })}

          {/* Month labels */}
          {chartData.map((d, i) => {
            const x = padding.left + i * xScale;
            return (
              <text
                key={`label-${i}`}
                x={x}
                y={svgHeight - 20}
                className={styles.monthLabel}
                textAnchor="middle"
              >
                {d.month}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.legendProposals}`}></div>
          <span>Proposals</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.legendImpressions}`}></div>
          <span>Impressions</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.legendClicks}`}></div>
          <span>Clicks</span>
        </div>
      </div>

      <div className={styles.chartFooter}>
        <p className={styles.footerText}>
          Real-time data • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default RevenueProposalsChart;
