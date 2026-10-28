import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

const HighlightedInsights = ({ insights = [] }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="empty-state">
        No critical insights detected in the document.
      </div>
    );
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'danger':
        return <AlertCircle size={18} style={{ color: 'var(--danger)' }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: 'var(--accent)' }} />;
      case 'info':
      default:
        return <Info size={18} style={{ color: 'var(--secondary)' }} />;
    }
  };

  const getInsightClass = (type) => {
    switch (type) {
      case 'danger':
        return 'alert alert-danger';
      case 'warning':
        return 'alert alert-warning';
      case 'info':
      default:
        return 'alert alert-info';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {insights.map((insight, idx) => (
        <div
          key={idx}
          className={getInsightClass(insight.type)}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}
        >
          <div style={{ marginTop: '2px', flexShrink: 0 }}>{getInsightIcon(insight.type)}</div>
          <div style={{ flex: 1 }}>
            <p style={{ 
              fontSize: '0.875rem', 
              lineHeight: '1.45', 
              margin: 0
            }}>
              {insight.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HighlightedInsights;
