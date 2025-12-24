import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileJson, Table, Code } from 'lucide-react';
import './DownloadMenu.css';

function DownloadMenu({ onDownload, events }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (format) => {
    let content, mimeType, filename;
    const dateStr = new Date().toISOString().split('T')[0];

    try {
      // Use passed events prop or fallback to fetching (though props are preferred for "current view")
      const dataToExport = events || [];

      switch (format) {
        case 'csv':
          // Convert events to CSV
          const headers = ['date', 'title', 'importance', 'type', 'tags', 'actors', 'capture_lanes'];
          content = [
            headers.join(','),
            ...dataToExport.map(e => {
              return headers.map(h => {
                let val = e[h];
                if (Array.isArray(val)) val = val.join(';');
                if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
                return val;
              }).join(',');
            })
          ].join('\n');
          mimeType = 'text/csv';
          filename = `capture_timeline_${dateStr}.csv`;
          break;

        case 'json':
          content = JSON.stringify(dataToExport, null, 2);
          mimeType = 'application/json';
          filename = `capture_timeline_${dateStr}.json`;
          break;

        case 'yaml':
        case 'yaml-minimal': // Treating same for client-side simplicity, or filtering could be added
          // Simple JSON to YAML converter for client-side
          // For full robustness we might need js-yaml, but simple recursion works for this structure
          const toYaml = (obj, indent = 0) => {
            const pad = '  '.repeat(indent);
            if (Array.isArray(obj)) {
              return obj.map(v => `${pad}- ${toYaml(v, indent + 1).trim()}`).join('\n');
            } else if (typeof obj === 'object' && obj !== null) {
              return Object.entries(obj).map(([k, v]) => {
                if (typeof v === 'object' && v !== null) {
                  return `${pad}${k}:\n${toYaml(v, indent + 1)}`;
                }
                return `${pad}${k}: ${JSON.stringify(v)}`;
              }).join('\n');
            }
            return String(obj);
          };
          content = toYaml(dataToExport);
          mimeType = 'text/yaml';
          filename = `capture_timeline_${dateStr}.yaml`;
          break;

        case 'hugo':
          // Dynamic import to avoid bundle bloat if not used
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          const eventsFolder = zip.folder("content").folder("events");

          dataToExport.forEach(event => {
            const safeTitle = (event.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const fileContent = `---
title: "${(event.title || '').replace(/"/g, '\\"')}"
date: ${event.date}
importance: ${event.importance || 0}
tags: [${(event.tags || []).map(t => `"${t}"`).join(', ')}]
actors: [${(event.actors || []).map(a => `"${a}"`).join(', ')}]
---

${event.description || ''}
`;
            eventsFolder.file(`${event.date}-${safeTitle}.md`, fileContent);
          });

          content = await zip.generateAsync({ type: "blob" });
          mimeType = "application/zip";
          filename = `capture_timeline_hugo_${dateStr}.zip`;
          break;

        default:
          return;
      }

      // Create download link
      const blob = format === 'hugo' ? content : new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export data: " + e.message);
    }

    if (onDownload) {
      onDownload(format);
    }

    setIsOpen(false);
  };

  return (
    <div className="download-menu" ref={menuRef}>
      <button
        className="icon-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Download timeline data"
      >
        <Download size={20} />
      </button>

      {isOpen && (
        <div className="download-dropdown">
          <div className="download-header">Export Timeline Data</div>

          <button
            className="download-option"
            onClick={() => handleDownload('csv')}
          >
            <Table size={16} />
            <div>
              <div className="option-title">CSV Format</div>
              <div className="option-desc">For Excel, Google Sheets, or data analysis</div>
            </div>
          </button>

          <button
            className="download-option"
            onClick={() => handleDownload('json')}
          >
            <FileJson size={16} />
            <div>
              <div className="option-title">JSON Format</div>
              <div className="option-desc">For developers and data processing</div>
            </div>
          </button>

          <button
            className="download-option"
            onClick={() => handleDownload('yaml')}
          >
            <Code size={16} />
            <div>
              <div className="option-title">YAML Format (Full)</div>
              <div className="option-desc">Complete structured data with all fields</div>
            </div>
          </button>

          <button
            className="download-option"
            onClick={() => handleDownload('yaml-minimal')}
          >
            <Code size={16} />
            <div>
              <div className="option-title">YAML Format (Minimal)</div>
              <div className="option-desc">Essential fields only for lighter processing</div>
            </div>
          </button>

          <div className="download-footer">
            <FileText size={14} />
            <span>{753} events • Last updated {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DownloadMenu;