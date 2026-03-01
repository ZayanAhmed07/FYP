import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

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
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937' }}>Overview</Typography>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>
          {new Date().getFullYear()}
        </Typography>
      </Box>

      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto' }}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={`grid-${i}`}
              x1={padding.left}
              y1={padding.top + (chartHeight / 5) * i}
              x2={svgWidth - padding.right}
              y2={padding.top + (chartHeight / 5) * i}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="#9ca3af"
            strokeWidth="2"
          />

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={svgWidth - padding.right}
            y2={padding.top + chartHeight}
            stroke="#9ca3af"
            strokeWidth="2"
          />

          {/* Areas - Proposals (Pink/Red) */}
          {chartData.length > 0 && (
            <>
              <path
                d={generatePath('proposals', true)}
                fill="#0db4bc"
                fillOpacity="0.4"
              />
              <path
                d={generatePath('proposals', false)}
                stroke="#0db4bc"
                fill="none"
                strokeWidth="2"
              />

              {/* Areas - Impressions (Purple/Blue) */}
              <path
                d={generatePath('impressions', true)}
                fill="#8b5cf6"
                fillOpacity="0.3"
              />
              <path
                d={generatePath('impressions', false)}
                stroke="#8b5cf6"
                fill="none"
                strokeWidth="2"
              />

              {/* Areas - Clicks (Light Blue/Cyan) */}
              <path
                d={generatePath('clicks', true)}
                fill="#22c55e"
                fillOpacity="0.3"
              />
              <path
                d={generatePath('clicks', false)}
                stroke="#22c55e"
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
                    <circle cx={x} cy={yProposals} r="5" fill="#0db4bc" stroke="#fff" strokeWidth="2" />
                    <circle cx={x} cy={yImpressions} r="5" fill="#8b5cf6" stroke="#fff" strokeWidth="2" />
                    <circle cx={x} cy={yClicks} r="5" fill="#22c55e" stroke="#fff" strokeWidth="2" />

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
                            fill="rgba(255, 255, 255, 0.98)"
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            filter="drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                          />
                          <text
                            x={x}
                            y={tooltipY + 20}
                            fill="#1f2937"
                            fontSize="14"
                            fontWeight="600"
                            textAnchor="middle"
                          >
                            {d.month}
                          </text>
                          <text
                            x={x}
                            y={tooltipY + 40}
                            fill="#0db4bc"
                            fontSize="12"
                            textAnchor="middle"
                          >
                            Proposals: {d.proposals}
                          </text>
                          <text
                            x={x}
                            y={tooltipY + 60}
                            fill="#8b5cf6"
                            fontSize="12"
                            textAnchor="middle"
                          >
                            Impressions: {d.impressions}
                          </text>
                          <text
                            x={x}
                            y={tooltipY + 80}
                            fill="#22c55e"
                            fontSize="12"
                            textAnchor="middle"
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
                fill="#6b7280"
                fontSize="12"
                textAnchor="middle"
              >
                {d.month}
              </text>
            );
          })}
        </svg>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#0db4bc' }} />
          <Typography sx={{ fontSize: '0.875rem', color: '#6b7280' }}>Proposals</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#8b5cf6' }} />
          <Typography sx={{ fontSize: '0.875rem', color: '#6b7280' }}>Impressions</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
          <Typography sx={{ fontSize: '0.875rem', color: '#6b7280' }}>Clicks</Typography>
        </Box>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          Real-time data • Last updated: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default RevenueProposalsChart;
