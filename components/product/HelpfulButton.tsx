'use client'

import { useState, useEffect } from 'react'

interface HelpfulButtonProps {
  reviewId: string
  initialCount: number
}

function getVotedSet(): Set<string> {
  try {
    const raw = localStorage.getItem('acme_helpful_votes')
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function addVote(reviewId: string) {
  const set = getVotedSet()
  set.add(reviewId)
  localStorage.setItem('acme_helpful_votes', JSON.stringify([...set]))
}

export default function HelpfulButton({ reviewId, initialCount }: HelpfulButtonProps) {
  const [count,   setCount]   = useState(initialCount)
  const [voted,   setVoted]   = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setVoted(getVotedSet().has(reviewId))
  }, [reviewId])

  async function handleClick() {
    if (voted || loading) return
    setLoading(true)

    const voterToken = `local-${Math.random().toString(36).slice(2)}-${Date.now()}`

    try {
      const res = await fetch('/api/reviews/helpful', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reviewId, voterToken }),
      })
      const data = await res.json()
      if (!data.alreadyVoted) {
        setCount(c => c + 1)
        setVoted(true)
        addVote(reviewId)
      }
    } catch {
      // silent fail — helpful votes are low stakes
    } finally {
      setLoading(false)
    }
  }

  if (count === 0 && !voted) return null

  return (
    <button
      onClick={handleClick}
      disabled={voted || loading}
      className="text-[11px] font-mono text-ink-soft hover:text-ink-iron transition-colors disabled:cursor-default disabled:opacity-70"
    >
      {voted ? `Helpful (${count})` : `Helpful? (${count})`}
    </button>
  )
}
