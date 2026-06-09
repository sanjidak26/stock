'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, HelpCircle } from 'lucide-react';
import styles from './ai.module.css';

const SUGGESTIONS = [
  'Which medicines expire next month?',
  'Show me top selling medicines',
  'What is my revenue today?',
  'Which medicines are out of stock?',
  'Show low stock medicines',
  'What is my total inventory value?',
  'Show expired stock with loss value',
  'Which dealers supplied most stock?',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`${styles.msg} ${isUser ? styles.userMsg : styles.aiMsg}`}>
      <div className={styles.avatar}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={styles.bubble}>
        <div className={styles.text}>{msg.content}</div>
        {msg.rows && msg.rows.length > 0 && (
          <div className={styles.resultTable}>
            <div className={styles.resultHeader}>
              <Sparkles size={12} /> {msg.rows.length} result{msg.rows.length !== 1 ? 's' : ''} found
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>{Object.keys(msg.rows[0]).map(k => <th key={k}>{k.replace(/_/g,' ')}</th>)}</tr>
                </thead>
                <tbody>
                  {msg.rows.slice(0, 20).map((r, i) => (
                    <tr key={i}>{Object.values(r).map((v, j) => <td key={j}>{String(v ?? '—')}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            {msg.rows.length > 20 && <div className={styles.moreRows}>…and {msg.rows.length - 20} more rows</div>}
          </div>
        )}
        {msg.rows && msg.rows.length === 0 && (
          <div className={styles.noResult}>No results found for this query.</div>
        )}
        {msg.error && <div className="alert alert-error" style={{ marginTop: 8 }}>{msg.error}</div>}
      </div>
    </div>
  );
}

export default function AiPage() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "Hello! I'm your pharmacy AI assistant. Ask me anything about your stock, sales, or expiry in plain English.",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(question) {
    const q = question || input.trim();
    if (!q) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: q }]);
    setLoading(true);

    const res = await fetch('/api/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessages(m => [...m, { role: 'ai', content: 'Sorry, I could not process that.', error: data.error }]);
    } else {
      const summary = data.count === 0
        ? 'No results found for that query.'
        : `Here are the results (${data.count} row${data.count !== 1 ? 's' : ''}):`;
      setMessages(m => [...m, { role: 'ai', content: summary, rows: data.rows }]);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">Ask questions in plain English — powered by your live database</p>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className={styles.chips}>
        {SUGGESTIONS.map(s => (
          <button key={s} className={styles.chip} onClick={() => send(s)}>
            <HelpCircle size={12} /> {s}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className={styles.chatArea}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className={`${styles.msg} ${styles.aiMsg}`}>
            <div className={styles.avatar}><Bot size={14} /></div>
            <div className={styles.bubble}>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={styles.inputRow}>
        <input
          className={`form-input ${styles.chatInput}`}
          placeholder="Ask anything about your inventory, sales or expiry…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          id="ai-input"
        />
        <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()} id="ai-send">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
