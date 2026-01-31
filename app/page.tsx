'use client'

import { useState, useEffect } from 'react'
import BackgroundSlideshow from './BackgroundSlideshow'

interface Match {
  match_number: number
  team1: number
  team2: number
  result?: 'team1_win' | 'team2_win' | 'draw'
}

interface DrawTracker {
  team1: number
  team2: number
  nextToPlay: number // Which team plays next from this draw pair
}

interface GameState {
  total_teams: number
  current_match: {
    team1: number
    team2: number
  } | null
  waiting_queue: number[] // Teams waiting to play
  match_history: Match[]
  match_counter: number
  draw_trackers: DrawTracker[] // Track which team from a draw should play next
}

export default function Home() {
  const [totalTeams, setTotalTeams] = useState<number | ''>(8)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Handle team number changes with validation
  const handleTeamChange = (value: string) => {
    if (value === '') {
      setTotalTeams('')
      return
    }
    
    const num = parseInt(value)
    if (!isNaN(num)) {
      // Allow typing but don't restrict yet (validation happens on submit)
      setTotalTeams(num)
    }
  }

  const incrementTeams = () => {
    const current = totalTeams === '' ? 3 : totalTeams
    if (current < 20) {
      setTotalTeams(current + 1)
    }
  }

  const decrementTeams = () => {
    const current = totalTeams === '' ? 3 : totalTeams
    if (current > 3) {
      setTotalTeams(current - 1)
    }
  }

  // Load game state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('football_game_state')
    if (saved) {
      try {
        setGameState(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load saved game:', e)
      }
    }
  }, [])

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (gameState) {
      localStorage.setItem('football_game_state', JSON.stringify(gameState))
    }
  }, [gameState])

  const startNewGame = () => {
    const teams = totalTeams === '' ? 3 : totalTeams
    
    if (teams < 3 || teams > 20) {
      setError('Please enter between 3 and 20 teams')
      return
    }

    const initialState: GameState = {
      total_teams: teams,
      current_match: null,
      waiting_queue: Array.from({ length: teams }, (_, i) => i + 1), // [1, 2, 3, ..., totalTeams]
      match_history: [],
      match_counter: 0,
      draw_trackers: []
    }

    setGameState(initialState)
    setError(null)
  }

  const getNextMatch = () => {
    if (!gameState) return

    // Need at least 2 teams in the queue
    if (gameState.waiting_queue.length < 2) {
      setError('Not enough teams in queue to start a match')
      return
    }

    // Take the first two teams from the queue
    const [team1, team2, ...remainingQueue] = gameState.waiting_queue

    setGameState({
      ...gameState,
      current_match: { team1, team2 },
      waiting_queue: remainingQueue
    })
    setError(null)
  }

  const handleDrawTeamSelection = (team1: number, team2: number): number => {
    if (!gameState) return team1

    // Find if we have a draw tracker for these two teams
    const trackerIndex = gameState.draw_trackers.findIndex(
      dt => (dt.team1 === team1 && dt.team2 === team2) || 
            (dt.team1 === team2 && dt.team2 === team1)
    )

    if (trackerIndex === -1) {
      // First time these teams drew - lower number plays first
      const lowerTeam = Math.min(team1, team2)
      const higherTeam = Math.max(team1, team2)
      
      // Add new tracker
      gameState.draw_trackers.push({
        team1: lowerTeam,
        team2: higherTeam,
        nextToPlay: higherTeam // Next time, higher team plays
      })
      
      return lowerTeam
    } else {
      // Found existing tracker - use and toggle
      const tracker = gameState.draw_trackers[trackerIndex]
      const teamToPlay = tracker.nextToPlay
      
      // Toggle for next time
      tracker.nextToPlay = tracker.nextToPlay === tracker.team1 ? tracker.team2 : tracker.team1
      
      return teamToPlay
    }
  }

  const recordResult = (result: 'team1_win' | 'team2_win' | 'draw') => {
    if (!gameState || !gameState.current_match) return

    const { team1, team2 } = gameState.current_match
    const newMatchNumber = gameState.match_counter + 1

    // Create match record
    const match: Match = {
      match_number: newMatchNumber,
      team1,
      team2,
      result
    }

    let newQueue = [...gameState.waiting_queue]

    if (result === 'team1_win') {
      // Team 1 wins, stays on - Team 1 goes to front of queue
      // Team 2 loses, goes to back of queue
      newQueue = [team1, ...newQueue, team2]
    } else if (result === 'team2_win') {
      // Team 2 wins, stays on - Team 2 goes to front of queue
      // Team 1 loses, goes to back of queue
      newQueue = [team2, ...newQueue, team1]
    } else {
      // Draw - both teams leave the pitch
      // Determine which team should play first when they come back
      const firstToPlay = handleDrawTeamSelection(team1, team2)
      const secondToPlay = firstToPlay === team1 ? team2 : team1
      
      // Add them to the back of the queue in order
      newQueue = [...newQueue, firstToPlay, secondToPlay]
    }

    setGameState({
      ...gameState,
      current_match: null,
      waiting_queue: newQueue,
      match_history: [...gameState.match_history, match],
      match_counter: newMatchNumber
    })
    setError(null)
  }

  const endSession = () => {
    setGameState(null)
    localStorage.removeItem('football_game_state')
    setError(null)
  }

  const playerImages = [
     '/images/players/WhatsApp Image 2026-01-29 at 20.19.02.jpeg',
     '/images/players/photo-1574629810360-7efbbe195018.jpg',
    '/images/players/photo-1579952363873-27f3bade9f55.jpg',
    '/images/players/photo-1551958219-acbc608c6377.jpg',
   
    
  ]

  return (
    <main className="min-h-screen p-8 relative">
      {/* Background Slideshow */}
      <BackgroundSlideshow images={playerImages} interval={4000} />
      
      <div className="max-w-6xl mx-auto relative z-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-glow">
            Street Football Rotation Manager
          </h1>
          <p className="text-gray-400 text-lg">
            4-a-side team rotation system
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Start Game Section */}
        {!gameState && (
          <div className="glow-card max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-glow">Start New Game</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Number of Teams (3-20)</label>
                <div className="flex items-center gap-3">
                  {/* Minus Button */}
                  <button
                    type="button"
                    onClick={decrementTeams}
                    disabled={totalTeams !== '' && totalTeams <= 3}
                    className="flex-shrink-0 w-12 h-12 bg-accent border border-glow/30 text-glow font-bold text-xl 
                             rounded-lg transition-all duration-300 hover:bg-glow/10 hover:border-glow/60 
                             hover:shadow-glow disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                  >
                    −
                  </button>
                  
                  {/* Number Input */}
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={totalTeams}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="8"
                    className="input-field w-full text-center text-2xl font-bold"
                  />
                  
                  {/* Plus Button */}
                  <button
                    type="button"
                    onClick={incrementTeams}
                    disabled={totalTeams !== '' && totalTeams >= 20}
                    className="flex-shrink-0 w-12 h-12 bg-accent border border-glow/30 text-glow font-bold text-xl 
                             rounded-lg transition-all duration-300 hover:bg-glow/10 hover:border-glow/60 
                             hover:shadow-glow disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={startNewGame}
                className="glow-button w-full"
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {/* Game Interface */}
        {gameState && (
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
                      className="glow-button"
                    >
                      Team {gameState.current_match.team1} Wins
                    </button>
                    <button
                      onClick={() => recordResult('draw')}
                      className="glow-button"
                    >
                      Draw
                    </button>
                    <button
                      onClick={() => recordResult('team2_win')}
                      className="glow-button"
                    >
                      Team {gameState.current_match.team2} Wins
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-400 mb-4">
                    {gameState.waiting_queue.length < 2 
                      ? 'Not enough teams to start a match' 
                      : 'No current match - click below to start next match'}
                  </p>
                  <button
                    onClick={getNextMatch}
                    disabled={gameState.waiting_queue.length < 2}
                    className="glow-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Get Next Match
                  </button>
                </div>
              )}
            </div>

            {/* Game Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Waiting Queue */}
              <div className="glow-card">
                <h3 className="text-xl font-bold mb-4 text-glow">Waiting Queue</h3>
                {gameState.waiting_queue.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 mb-2">Next teams to play (in order):</p>
                    <div className="flex flex-wrap gap-2">
                      {gameState.waiting_queue.map((team, index) => (
                        <div 
                          key={`${team}-${index}`} 
                          className={`team-badge text-sm ${index < 2 ? 'ring-2 ring-glow' : ''}`}
                        >
                          Team {team}
                          {index < 2 && <span className="ml-1 text-xs">▶</span>}
                        </div>
                      ))}
                    </div>
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
                  <p>Teams in Queue: <span className="text-glow">{gameState.waiting_queue.length}</span></p>
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
                onClick={endSession}
                className="bg-accent border border-red-500/30 text-red-400 font-medium px-6 py-3 rounded-lg 
                         transition-all duration-300 hover:shadow-glow hover:border-red-500/60"
              >
                End Session
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}