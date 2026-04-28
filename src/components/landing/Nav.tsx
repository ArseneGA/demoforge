"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-8 py-3.5 border-b"
      style={{
        background: "rgba(14,13,17,.75)",
        backdropFilter: "blur(18px)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-deep))" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7z" fill="white" />
            </svg>
          </div>
          <span
            className="text-[15px] font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Demo<em className="not-italic" style={{ color: "var(--brand-light)" }}>Forge</em>
          </span>
        </Link>

        <div className="hidden md:flex gap-6">
          {[
            ["#agents", "Agents"],
            ["#workflow", "Workflow"],
            ["#editor", "Storyboard"],
            ["#pricing", "Pricing"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-[13px] no-underline transition-colors"
              style={{ color: "var(--text-sec)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-sec)")}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href="/login"
          className="text-[13px] font-medium px-3.5 py-2 rounded-md no-underline transition-colors"
          style={{ color: "var(--text-sec)" }}
        >
          Se connecter
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-md no-underline text-white transition-all"
          style={{ background: "var(--brand)" }}
        >
          Démarrer · gratuit
          <ArrowRight size={13} />
        </Link>
      </div>
    </nav>
  )
}
