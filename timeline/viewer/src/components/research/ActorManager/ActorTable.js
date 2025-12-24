
import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../../../services/apiService';
import '../research.css';

const ActorTable = () => {
    const [allActors, setAllActors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const ITEMS_PER_PAGE = 20;

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        loadActors();
    }, []);

    const loadActors = async () => {
        setLoading(true);
        try {
            // Fetch all actors (static JSON)
            const data = await apiService.metadata.getActors();
            setAllActors(data.actors || []);
        } catch (error) {
            console.error("Failed to load actors", error);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering and pagination
    const filteredActors = useMemo(() => {
        if (!debouncedSearch) return allActors;
        const lower = debouncedSearch.toLowerCase();
        return allActors.filter(a => a.name.toLowerCase().includes(lower));
    }, [allActors, debouncedSearch]);

    const totalPages = Math.ceil(filteredActors.length / ITEMS_PER_PAGE);
    const paginatedActors = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredActors.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredActors, page]);

    // Reset page on search
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    return (
        <div className="research-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Actor Explorer (Static)</h2>
                <input
                    type="text"
                    placeholder="Search actors..."
                    className="research-input"
                    style={{ width: '300px' }}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <table className="research-table">
                <thead>
                    <tr>
                        <th style={{ width: '50px' }}>#</th>
                        <th>Name</th>
                        <th>Event Count</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td></tr>
                    ) : paginatedActors.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center' }}>No actors found</td></tr>
                    ) : (
                        paginatedActors.map((actor, idx) => (
                            <tr key={actor.name}>
                                <td>{((page - 1) * ITEMS_PER_PAGE) + idx + 1}</td>
                                <td>
                                    <strong>{actor.name}</strong>
                                </td>
                                <td>{actor.count}</td>
                                <td>
                                    <button className="research-btn" disabled>Edit (Coming Soon)</button>
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

export default ActorTable;
