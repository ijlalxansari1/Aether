'use client';

import dynamic from 'next/dynamic';

const PlotlyChartDynamic = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading Chart...</div>
});

export default function PlotlyChart(props: any) {
  return <PlotlyChartDynamic {...props} style={{ width: '100%', height: '100%' }} useResizeHandler={true} />;
}
