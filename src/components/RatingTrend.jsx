import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './RatingTrend.css'

function RatingTrend({ trendData }) {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="rating-trend-empty">
        <p>暂无历史评分数据</p>
      </div>
    )
  }

  // 格式化数据，将月份格式化为更友好的显示
  const formattedData = trendData.map(item => {
    const [year, month] = item.month.split('-')
    const monthNum = parseInt(month, 10)
    // 显示为 "1月" 格式
    const monthLabel = `${monthNum}月`
    return {
      ...item,
      month: monthLabel
    }
  })

  return (
    <div className="rating-trend-container">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="month" 
            stroke="var(--text-secondary)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            domain={[0, 10]}
            ticks={[2, 4, 6, 8, 10]}
            stroke="var(--text-secondary)"
            style={{ fontSize: '12px' }}
            label={{ value: '评分', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-secondary)' } }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)'
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
            formatter={(value) => [`${value.toFixed(1)}`, '平均评分']}
          />
          <Legend 
            wrapperStyle={{ color: 'var(--text-primary)' }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="var(--primary)" 
            strokeWidth={2}
            dot={{ fill: 'var(--primary)', r: 4 }}
            activeDot={{ r: 6 }}
            name="平均评分"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RatingTrend

