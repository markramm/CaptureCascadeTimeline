/**
 * IndexedDBToggle - UI control to enable/disable IndexedDB optimization
 *
 * Allows users to toggle between traditional in-memory approach
 * and IndexedDB-backed virtual scrolling.
 */

import React, { useState, useEffect } from 'react';
import './IndexedDBToggle.css';

const IndexedDBToggle = () => {
  const [useIndexedDB, setUseIndexedDB] = useState(
    localStorage.getItem('useIndexedDB') === 'true'
  );
  const [showInfo, setShowInfo] = useState(false);

  // Check if IndexedDB is supported
  const isSupported = typeof window.indexedDB !== 'undefined';

  const handleToggle = () => {
    const newValue = !useIndexedDB;
    setUseIndexedDB(newValue);
    localStorage.setItem('useIndexedDB', newValue.toString());

    // Reload page to apply changes
    if (window.confirm('The page will reload to apply this change. Continue?')) {
      window.location.reload();
    } else {
      // Revert if user cancels
      setUseIndexedDB(!newValue);
      localStorage.setItem('useIndexedDB', (!newValue).toString());
    }
  };

  if (!isSupported) {
    return (
      <div className="indexeddb-toggle-unsupported">
        <span className="warning-icon">⚠️</span>
        <span>IndexedDB not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className="indexeddb-toggle-container">
      <div className="indexeddb-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={useIndexedDB}
            onChange={handleToggle}
            className="toggle-checkbox"
          />
          <span className="toggle-slider"></span>
          <span className="toggle-text">
            {useIndexedDB ? 'IndexedDB (Memory Optimized)' : 'Traditional (Full Load)'}
          </span>
        </label>

        <button
          className="info-button"
          onClick={() => setShowInfo(!showInfo)}
          aria-label="Information about IndexedDB"
        >
          ℹ️
        </button>
      </div>

      {showInfo && (
        <div className="indexeddb-info">
          <h4>About IndexedDB Optimization</h4>

          <div className="info-section">
            <h5>Traditional Mode (Current):</h5>
            <ul>
              <li>Loads all {window.__TIMELINE_EVENT_COUNT__ || '2,875'} events into memory</li>
              <li>~15-20MB memory usage</li>
              <li>2-3 second initial load</li>
              <li>Instant filtering once loaded</li>
            </ul>
          </div>

          <div className="info-section">
            <h5>IndexedDB Mode (Optimized):</h5>
            <ul>
              <li>Stores events in browser database</li>
              <li>~2-3MB memory usage (87% reduction)</li>
              <li>300-500ms initial load (80% faster)</li>
              <li>Loads only visible events</li>
              <li>Persistent cache for instant subsequent loads</li>
            </ul>
          </div>

          <div className="info-section">
            <h5>Recommended for:</h5>
            <ul>
              <li>Mobile devices</li>
              <li>Browsers with limited memory</li>
              <li>Users who frequently return to the timeline</li>
            </ul>
          </div>

          <p className="info-note">
            <strong>Note:</strong> Switching modes will reload the page.
          </p>
        </div>
      )}
    </div>
  );
};

export default IndexedDBToggle;
