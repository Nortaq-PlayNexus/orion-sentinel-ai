import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { handleCommand } from '../core/orionAI'

const SUGGESTIONS = [
  'Scan the Pacific Ocean for unusual structures.',
  'Compare the Mariana Trench across 20 years of imagery.',
  'Investigate this atmospheric anomaly.',
  'Show unexplained high-confidence events worldwide.',
]

let SpeechRec = null
if (typeof window !== 'undefined') {
  SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
}

export default function OrionPanel() {
  const [messages, setMessages] = useState([
    {
      role: 'orion',
      title: 'ORION AI ONLINE',
      body: `I am the planetary intelligence core. I coordinate six specialist agents — satellite analysis, ocean research, atmospheric science, geology, wildlife, and verification — and fuse their findings into probability-weighted hypotheses.\n\nNo result is ever presented as certainty. Ask me to scan an ocean, compare a region across time, or investigate an anomaly.`,
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [listening, setListening] = useState(false)
  const listRef = useRef(null)
  const recRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  useEffect(
    () => () => {
      if (recRef.current) recRef.current.stop()
    },
    [],
  )

  async function send(text) {
    const t = (text || input).trim()
    if (!t || thinking) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', body: t }])
    setThinking(true)
    const reply = await handleCommand(t)
    const focus = reply.focus
    setMessages((m) => [...m, { role: 'orion', ...reply }])
    setThinking(false)
    if (focus) {
      setTimeout(() => {
        useStore
          .getState()
          .setScanSector(
            `${Math.abs(focus.lat).toFixed(1)}°${focus.lat >= 0 ? 'N' : 'S'} / ${Math.abs(focus.lon).toFixed(1)}°${focus.lon >= 0 ? 'E' : 'W'}`,
          )
      }, 400)
    }
  }

  function toggleVoice() {
    if (!SpeechRec) {
      setMessages((m) => [
        ...m,
        {
          role: 'orion',
          title: 'VOICE INPUT UNAVAILABLE',
          body: 'Speech recognition is not supported in this browser. Try Chrome or Edge, or type your directive.',
        },
      ])
      return
    }
    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }
    const rec = new SpeechRec()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript
      setInput(t)
      send(t)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  return (
    <div className="glass panel orion-panel">
      <div className="panel-head">
        <span className="orion-avatar">
          <span className="orion-eye" />
        </span>
        <span className="panel-title">ORION AI</span>
        <span className="panel-status">CORE ONLINE</span>
      </div>

      <div className="orion-chat" ref={listRef}>
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="msg msg-user">
              <div className="msg-body">{m.body}</div>
            </div>
          ) : (
            <div key={i} className="msg msg-orion">
              {m.title && <div className="msg-title">▸ {m.title}</div>}
              <div className="msg-body">{m.body}</div>
              {m.chips && (
                <div className="msg-chips">
                  {m.chips.map((c, j) => (
                    <button key={j} onClick={() => send(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ),
        )}
        {thinking && (
          <div className="msg msg-orion thinking">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-label">orchestrating agents...</span>
          </div>
        )}
      </div>

      <div className="suggest-row">
        {SUGGESTIONS.map((s, i) => (
          <button key={i} className="chip" onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="orion-input-row">
        <input
          className="orion-input"
          placeholder="Type a directive for ORION AI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button
          className={`voice-btn ${listening ? 'active' : ''}`}
          onClick={toggleVoice}
          title="Voice command"
        >
          {listening ? '◉' : '▣'}
        </button>
        <button className="send-btn" onClick={() => send()} disabled={thinking}>
          ▲
        </button>
      </div>
    </div>
  )
}
