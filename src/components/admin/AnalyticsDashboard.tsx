import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { fetchAnalytics } from '@/store/analyticsSlice';
import { RootState } from '@/store';

export const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { data, status } = useSelector((state: RootState) => state.analytics);

  useEffect(() => {
    dispatch(fetchAnalytics());
  }, [dispatch]);

  if (status === 'loading') return <div className="text-center text-lg font-bold text-gray-800">Loading analytics...</div>;
  if (status === 'failed' || !data) return <div className="text-center text-lg font-bold text-gray-800">Error loading analytics</div>;

  const { keyMetrics, scoreRanges, audienceData, sourceChartData, assessmentPerformance, completionTrends } = data;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-2 border-green-300 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <h3 className="text-lg font-bold mb-2 text-gray-900">Conversion Rate</h3>
          <div className="text-4xl font-bold text-green-700 mb-2">
            {keyMetrics.totalLeads > 0 ? Math.round((keyMetrics.completedLeads / keyMetrics.totalLeads) * 100) : 0}%
          </div>
          <p className="text-sm text-gray-700 font-semibold">Assessment completion rate</p>
        </Card>
        
        <Card className="p-6 border-2 border-blue-300 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <h3 className="text-lg font-bold mb-2 text-gray-900">High Quality Leads</h3>
          <div className="text-4xl font-bold text-blue-700 mb-2">
            {keyMetrics.highQualityLeads}
          </div>
          <p className="text-sm text-gray-700 font-semibold">Scores 80% or higher</p>
        </Card>
        
        <Card className="p-6 border-2 border-purple-300 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <h3 className="text-lg font-bold mb-2 text-gray-900">Average Score</h3>
          <div className="text-4xl font-bold text-purple-700 mb-2">
            {keyMetrics.avgScore}
          </div>
          <p className="text-sm text-gray-700 font-semibold">Across all assessments</p>
        </Card>
        
        <Card className="p-6 border-2 border-orange-300 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <h3 className="text-lg font-bold mb-2 text-gray-900">Top Source</h3>
          <div className="text-2xl font-bold text-orange-700 mb-2">
            {keyMetrics.topSource || 'N/A'}
          </div>
          <p className="text-sm text-gray-700 font-semibold">Primary lead source</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card className="p-6 border-2 border-gray-300 shadow-lg bg-white">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreRanges}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="range" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Audience Split */}
        <Card className="p-6 border-2 border-gray-300 shadow-lg bg-white">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Audience Split</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={audienceData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {audienceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Source Distribution */}
        <Card className="p-6 border-2 border-gray-300 shadow-lg bg-white">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sourceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="source" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip />
              <Bar dataKey="count" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Completion Trends */}
        <Card className="p-6 border-2 border-gray-300 shadow-lg bg-white">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Daily Completions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completionTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="date" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip />
              <Line type="monotone" dataKey="completions" stroke="#16a34a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Assessment Performance Table */}
      <Card className="p-6 border-2 border-gray-300 shadow-lg bg-white">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Assessment Performance</h3>
        <div className="space-y-3">
          {assessmentPerformance.map((assessment: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <div>
                <h4 className="font-bold text-gray-900">{assessment.title}</h4>
                <p className="text-sm text-gray-700 font-semibold">{assessment.count} completions</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-700">{assessment.avgScore}%</div>
                <div className="text-sm text-gray-700 font-semibold">Avg Score</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
