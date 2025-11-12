import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Link2, FileText, Copy, Check, ExternalLink } from 'lucide-react';
import { generateShareUrl, generateStaticEventUrl, copyToClipboard } from '../utils/shareUtils';
import './ShareDialog.css';

const ShareDialog = ({ event, filters = null, onClose }) => {
  const [urlType, setUrlType] = useState('interactive');
  const [copied, setCopied] = useState(false);

  // Generate both URL types
  const interactiveUrl = generateShareUrl({
    eventId: event.id,
    filters
  });
  const staticUrl = generateStaticEventUrl(event.id);

  const selectedUrl = urlType === 'interactive' ? interactiveUrl : staticUrl;

  const handleCopy = async () => {
    const success = await copyToClipboard(selectedUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Kleptocracy Timeline: ${event.title}`,
          text: event.summary || `${event.title} - ${event.date}`,
          url: selectedUrl
        });
        onClose();
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }

    // Fallback to copy
    handleCopy();
  };

  return (
    <motion.div
      className="share-dialog-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="share-dialog-modal"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="share-dialog-header">
          <h3>Share Event</h3>
          <button className="share-close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="share-dialog-body">
          <div className="share-event-info">
            <h4>{event.title}</h4>
            <p className="share-event-date">{event.date}</p>
          </div>

          <div className="share-url-options">
            <label className="share-url-option">
              <input
                type="radio"
                name="urlType"
                value="interactive"
                checked={urlType === 'interactive'}
                onChange={(e) => setUrlType(e.target.value)}
              />
              <div className="option-content">
                <div className="option-header">
                  <Link2 size={18} />
                  <span className="option-title">Interactive Viewer</span>
                  <span className="recommended-badge">Recommended</span>
                </div>
                <p className="option-description">
                  Full timeline experience with filters, search, and navigation.
                  Best for sharing with researchers and engaged readers.
                </p>
              </div>
            </label>

            <label className="share-url-option">
              <input
                type="radio"
                name="urlType"
                value="static"
                checked={urlType === 'static'}
                onChange={(e) => setUrlType(e.target.value)}
              />
              <div className="option-content">
                <div className="option-header">
                  <FileText size={18} />
                  <span className="option-title">Static Page</span>
                </div>
                <p className="option-description">
                  Fast-loading, no-JavaScript page. Better for SEO, social media previews,
                  AI agents, and readers with limited bandwidth.
                </p>
              </div>
            </label>
          </div>

          <div className="share-url-display">
            <div className="url-text">{selectedUrl}</div>
            <button
              className="copy-url-button"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
                </>
              )}
            </button>
          </div>

          {urlType === 'static' && (
            <div className="static-page-preview">
              <a
                href={staticUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="preview-link"
              >
                <ExternalLink size={14} />
                Preview static page
              </a>
            </div>
          )}
        </div>

        <div className="share-dialog-footer">
          <button className="share-cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="share-action-button" onClick={handleShare}>
            {navigator.share ? 'Share' : 'Copy Link'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ShareDialog;
