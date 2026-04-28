"use client"

import { useState, useEffect, useRef } from "react"

interface Comment {
  id: string
  step_id: string | null
  user_email: string
  content: string
  created_at: string
}

interface Props {
  demoId: string
  stepId: string | null
  stepLabel: string
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.round((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

export function CommentsPanel({ demoId, stepId, stepLabel }: Props) {
  const [allComments, setAllComments] = useState<Comment[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const stepComments = allComments.filter(c => c.step_id === stepId)
  const globalComments = allComments.filter(c => c.step_id === null)

  useEffect(() => {
    fetch(`/api/demos/${demoId}/comments`)
      .then(r => r.json())
      .then(d => { setAllComments(d.comments ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [demoId])

  async function handleSend() {
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText("")
    try {
      const res = await fetch(`/api/demos/${demoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, step_id: stepId }),
      })
      const data = await res.json()
      if (data.comment) {
        setAllComments(prev => [...prev, data.comment])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
      }
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(commentId: string) {
    await fetch(`/api/demos/${demoId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: commentId }),
    })
    setAllComments(prev => prev.filter(c => c.id !== commentId))
  }

  const displayed = stepId ? stepComments : globalComments

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="font-mono text-[10px] uppercase tracking-[.06em]" style={{ color: "var(--text-ter)" }}>
          {stepId ? `Étape · ${stepLabel}` : "Démo globale"}
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: "var(--text-ter)" }}>
          {displayed.length} commentaire{displayed.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {loading && (
          <p className="font-mono text-[11px] text-center py-4" style={{ color: "var(--text-ter)" }}>Chargement…</p>
        )}
        {!loading && displayed.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[13px] mb-1" style={{ color: "var(--text-sec)" }}>Aucun commentaire</p>
            <p className="font-mono text-[10px]" style={{ color: "var(--text-ter)" }}>Soyez le premier à commenter</p>
          </div>
        )}
        {displayed.map(c => (
          <div key={c.id} className="group flex gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0"
              style={{ background: "var(--surface-raised)", color: "var(--text)" }}>
              {initials(c.user_email)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-[10px] font-medium truncate" style={{ color: "var(--text-sec)" }}>
                  {c.user_email.split('@')[0]}
                </span>
                <span className="font-mono text-[9px]" style={{ color: "var(--text-ter)" }}>{fmtDate(c.created_at)}</span>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9px]"
                  style={{ color: "var(--text-ter)" }}
                >
                  ✕
                </button>
              </div>
              <p className="text-[12.5px] leading-[1.5]" style={{ color: "var(--text)" }}>{c.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={stepId ? `Commenter l'étape ${stepLabel}…` : "Commenter la démo…"}
            rows={2}
            className="w-full px-3 pt-2.5 pb-1 bg-transparent border-0 outline-none text-[12.5px] resize-none"
            style={{ color: "var(--text)", fontFamily: "var(--font-sans)" }}
          />
          <div className="flex justify-between items-center px-3 pb-2">
            <span className="font-mono text-[9px] uppercase tracking-[.04em]" style={{ color: "var(--text-ter)" }}>
              ↩ envoyer
            </span>
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="px-3 py-1 rounded-lg font-mono text-[10px] uppercase tracking-[.04em] transition-all disabled:opacity-40"
              style={{ background: text.trim() ? "var(--brand)" : "var(--surface-raised)", color: "#fff" }}
            >
              {sending ? "…" : "Envoyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
