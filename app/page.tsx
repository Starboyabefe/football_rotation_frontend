'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

interface Match {
  match_number: number
  team1: number
  team2: number
  result?: 'team1_win' | 'team2_win' | 'draw'
}

interface GameState {
  session_id: string
  total_teams: number
  current_match?: {
    team1: number
    team2: number
  }
  losers_queue: number[]
  match_history: Match[]
}

export default function Home() {
  const [apiUrl, setApiUrl] = useState('')
  const [totalTeams, setTotalTeams] = useState(5)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  }, [])

  const startNewGame = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${apiUrl}/sessions`, {
        total_teams: totalTeams
      })
      setSessionId(response.data.session_id)
      await fetchGameState(response.data.session_id)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start game')
    }
    setLoading(false)
  }

  const fetchGameState = async (sid?: string) => {
    const id = sid || sessionId
    if (!id) return
    
    try {
      const response = await axios.get(`${apiUrl}/sessions/${id}`)
      setGameState(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch game state')
    }
  }

  const recordResult = async (result: 'team1_win' | 'team2_win' | 'draw') => {
    if (!sessionId || !gameState?.current_match) return
    
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${apiUrl}/sessions/${sessionId}/matches`, {
        team1: gameState.current_match.team1,
        team2: gameState.current_match.team2,
        result: result
      })
      await fetchGameState()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record result')
    }
    setLoading(false)
  }

  const getNextMatch = async () => {
    if (!sessionId) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${apiUrl}/sessions/${sessionId}/next-match`)
      setGameState(prev => prev ? {
        ...prev,
        current_match: {
          team1: response.data.team1,
          team2: response.data.team2
        }
      } : null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get next match')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-glow">
            Football Rotation Manager
          </h1>
          <p className="text-gray-400 text-lg">
            5-a-side team rotation system
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Start Game Section */}
        {!sessionId && (
          <div className="glow-card max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-glow">Start New Game</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Number of Teams (3-20)</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={totalTeams}
                  onChange={(e) => setTotalTeams(parseInt(e.target.value))}
                  className="input-field w-full"
                />
              </div>
              <button
                onClick={startNewGame}
                disabled={loading}
                className="glow-button w-full"
              >
                {loading ? 'Starting...' : 'Start Game'}
              </button>
            </div>
          </div>
        )}

        {/* Game Interface */}
        {sessionId && gameState && (
          <div className="space-y-8">
            {/* Current Match */}
            <div className="glow-card">
              <h2 className="text-2xl font-bold mb-6 text-glow">Current Match</h2>
              {gameState.current_match ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-8">
                    <div className="team-badge text-3xl">
                      Team {gameState.current_match.team1}
                    </div>
                    <div className="text-2xl text-gray-500">vs</div>
                    <div className="team-badge text-3xl">
                      Team {gameState.current_match.team2}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => recordResult('team1_win')}
                      disabled={loading}
                      className="glow-button"
                    >
                      Team {gameState.current_match.team1} Wins
                    </button>
                    <button
                      onClick={() => recordResult('draw')}
                      disabled={loading}
                      className="glow-button"
                    >
                      Draw
                    </button>
                    <button
                      onClick={() => recordResult('team2_win')}
                      disabled={loading}
                      className="glow-button"
                    >
                      Team {gameState.current_match.team2} Wins
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-400 mb-4">No current match</p>
                  <button
                    onClick={getNextMatch}
                    disabled={loading}
                    className="glow-button"
                  >
                    Get Next Match
                  </button>
                </div>
              )}
            </div>

            {/* Game Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Losers Queue */}
              <div className="glow-card">
                <h3 className="text-xl font-bold mb-4 text-glow">Losers Queue</h3>
                {gameState.losers_queue.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {gameState.losers_queue.map((team, index) => (
                      <div key={index} className="team-badge text-sm">
                        Team {team}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No teams in queue</p>
                )}
              </div>

              {/* Session Info */}
              <div className="glow-card">
                <h3 className="text-xl font-bold mb-4 text-glow">Session Info</h3>
                <div className="space-y-2 text-gray-400">
                  <p>Total Teams: <span className="text-glow">{gameState.total_teams}</span></p>
                  <p>Matches Played: <span className="text-glow">{gameState.match_history.length}</span></p>
                  <p className="text-xs break-all">Session ID: {sessionId}</p>
                </div>
              </div>
            </div>

            {/* Match History */}
            <div className="glow-card">
              <h3 className="text-xl font-bold mb-4 text-glow">Match History</h3>
              {gameState.match_history.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {[...gameState.match_history].reverse().map((match) => (
                    <div
                      key={match.match_number}
                      className="bg-accent p-4 rounded-lg flex items-center justify-between border border-glow/10"
                    >
                      <span className="text-gray-400">Match {match.match_number}</span>
                      <div className="flex items-center gap-4">
                        <span className={match.result === 'team1_win' ? 'text-glow font-bold' : 'text-gray-400'}>
                          Team {match.team1}
                        </span>
                        <span className="text-gray-500">vs</span>
                        <span className={match.result === 'team2_win' ? 'text-glow font-bold' : 'text-gray-400'}>
                          Team {match.team2}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {match.result === 'draw' ? 'Draw' : match.result === 'team1_win' ? 'T1 Win' : 'T2 Win'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No matches played yet</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setSessionId(null)
                  setGameState(null)
                }}
                className="bg-accent border border-red-500/30 text-red-400 font-medium px-6 py-3 rounded-lg 
                         transition-all duration-300 hover:shadow-glow hover:border-red-500/60"
              >
                End Session
              </button>
              <button
                onClick={() => fetchGameState()}
                disabled={loading}
                className="glow-button"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}