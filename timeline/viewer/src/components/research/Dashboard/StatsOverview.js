
import React, { useEffect, useState } from 'react';
import apiService from '../../../services/apiService';

const StatsOverview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        apiService.stats.getOverview()
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading stats...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

    // stats.json structure: { total_events, total_actors, total_tags, top_tags, top_actors, events_by_year, date_range }

    return (
        <div className="stats-overview">
            <h1>Research Dashboard (Static Mode)</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <StatCard title="Total Events" value={stats.total_events} color="#3498db" />
                <StatCard title="Total Actors" value={stats.total_actors} color="#27ae60" />
                <StatCard title="Total Tags" value={stats.total_tags} color="#9b59b6" />
                <StatCard title="Total Sources" value={stats.total_sources} color="#e67e22" />
            </div>

            <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <h3>Top Actors</h3>
                    <ul style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        {stats.top_actors && stats.top_actors.map((actor) => (
                            <li key={actor.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                <span>{actor.name}</span>
                                <strong>{actor.count}</strong>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3>Top Tags</h3>
                    <ul style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        {stats.top_tags && stats.top_tags.map((tag) => (
                            <li key={tag.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                <span>{tag.name}</span>
                                <strong>{tag.count}</strong>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, color = '#27ae60' }) => (
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', borderTop: `4px solid ${color}` }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#7f8c8d' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{value}</p>
    </div>
);

export default StatsOverview;
