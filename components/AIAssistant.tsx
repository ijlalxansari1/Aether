'use client';

import { useState } from 'react';
import { Stage } from '@/lib/types';

interface AIAssistantProps {
  currentStage: Stage;
  rowCount: number;
}

export default function AIAssistant({ currentStage, rowCount }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Contextual suggestions based on stage
  const getSuggestion = () => {
    switch (currentStage) {
      case 'ingest': return "I see you're bringing in data. Make sure it's under 10MB for optimal performance. Want me to infer the types?";
      case 'clean': return `I noticed some null values in the ${rowCount} rows. Should I impute them with the median? [Human Approval Required]`;
      case 'ethics': return "I'm scanning for PII now. If I find emails or phone numbers, I'll recommend masking them to maintain privacy.";
      case 'analyze': return "I can write DuckDB SQL queries for you. Try asking 'Show me average sales by region'.";
      case 'dashboard': return "Your dashboard is looking good. Should I generate a narrative summary for your report?";
      default: return "How can I assist you with your data pipeline today?";
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          className="ai-fab" 
          onClick={() => setIsOpen(true)}
          title="Aether Copilot"
        >
          ✨
        </button>
      )}

      {/* AI Panel */}
      {isOpen && (
        <div className="ai-panel">
          <div className="ai-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>✨</span>
              <span style={{ fontWeight: 600 }}>Aether Copilot</span>
            </div>
            <button className="ai-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div className="ai-chat">
            <div className="ai-message system">
              <div className="ai-avatar">🤖</div>
              <div className="ai-bubble">
                <p><strong>Stage: {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}</strong></p>
                <p style={{ marginTop: 4 }}>{getSuggestion()}</p>
              </div>
            </div>
            {currentStage === 'clean' && (
              <div className="ai-actions" style={{ marginLeft: 36, marginTop: 8 }}>
                <button className="btn btn-sm btn-primary">Approve</button>
                <button className="btn btn-sm btn-secondary">Reject</button>
              </div>
            )}
          </div>

          <div className="ai-input-area">
            <input type="text" placeholder="Ask Copilot..." className="search-input" style={{ width: '100%', borderRadius: '20px' }} />
          </div>
        </div>
      )}
    </>
  );
}
