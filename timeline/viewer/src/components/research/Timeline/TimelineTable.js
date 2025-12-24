
import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../../../services/apiService';
import '../research.css';

const TimelineTable = () => {
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        try {
            // Fetch all events (static JSON)
            const data = await apiService.events.getEvents();
            let events = data.events || data; // static API might return array directly or object
            if (Array.isArray(events)) {
                // Ensure sorted by date descending
                events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            }
            setAllEvents(events || []);
        } catch (error) {
            console.error("Failed to load events", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = useMemo(() => {
        if (!debouncedSearch) return allEvents;
        const lower = debouncedSearch.toLowerCase();
        return allEvents.filter(e =>
            (e.title || '').toLowerCase().includes(lower) ||
            (e.summary || '').toLowerCase().includes(lower)
        );
    }, [allEvents, debouncedSearch]);

    const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
    const paginatedEvents = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEvents, page]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    return (
        <div className="research-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Timeline Explorer (Static)</h2>
                <input
                    type="text"
                    placeholder="Search events..."
                    className="research-input"
                    style={{ width: '300px' }}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <table className="research-table">
                <thead>
                    <tr>
                        <th style={{ width: '120px' }}>Date</th>
                        <th>Title</th>
                        <th>Importance</th>
                        <th>Sources</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center' }}>Loading...</td></tr>
                    ) : paginatedEvents.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center' }}>No events found</td></tr>
                    ) : (
                        paginatedEvents.map((event, idx) => (
                            <tr key={event.id || idx}>
                                <td style={{ whiteSpace: 'nowrap' }}>{event.date}</td>
                                <td>
                                    <strong>{event.title}</strong>
                                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                        {event.id}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${event.importance >= 8 ? 'badge-blue' : 'badge-gray'}`}>
                                        {event.importance || 0}
                                    </span>
                                </td>
                                <td>{event.sources ? event.sources.length : 0}</td>
                                <td>
                                    <button className="research-btn" onClick={() => alert(JSON.stringify(event, null, 2))}>
                                        View JSON
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <div className="pagination">
                <button
                    className="research-btn"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                >
                    Previous
                </button>
                <span style={{ padding: '10px' }}>Page {page} of {totalPages || 1}</span>
                <button
                    className="research-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default TimelineTable;
