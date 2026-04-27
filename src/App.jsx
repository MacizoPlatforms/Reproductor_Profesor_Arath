import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, List, Heart, Search, Shield, ShieldAlert } from 'lucide-react'
import { supabase } from './lib/supabase'

function App() {
  const [playlist, setPlaylist] = useState([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  const audioRef = useRef(null)
  const fileInputRef = useRef(null)

  const currentTrack = playlist[currentTrackIndex]

  // Fetch initial tracks from Supabase
  useEffect(() => {
    const fetchTracks = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)

      if (data && data.length > 0) {
        setPlaylist(data)
        audioRef.current = new Audio(data[0].src)
      }
      setIsLoading(false)
    }

    fetchTracks()
  }, [])

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return

    const audio = audioRef.current
    audio.volume = volume

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100)
    }

    const handleEnded = () => {
      nextTrack()
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrackIndex, volume, playlist])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(e => console.error("Error playing audio:", e))
    }
    setIsPlaying(!isPlaying)
  }

  const nextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length
    changeTrack(nextIndex)
  }

  const prevTrack = () => {
    const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length
    changeTrack(prevIndex)
  }

  const changeTrack = (index, currentPlaylist = playlist) => {
    if (audioRef.current) audioRef.current.pause()
    
    setCurrentTrackIndex(index)
    const trackToPlay = currentPlaylist[index]
    
    audioRef.current = new Audio(trackToPlay.src)
    audioRef.current.volume = volume
    
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(e => console.error("Error playing audio:", e))
  }

  const handleProgressChange = (e) => {
    const newProgress = e.target.value
    setProgress(newProgress)
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value
    setVolume(newVolume)
    if (audioRef.current) audioRef.current.volume = newVolume
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const newTracks = files.map((file, index) => ({
      id: Date.now() + index,
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Archivo Local",
      cover: "https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=1000&auto=format&fit=crop",
      duration: "Local",
      src: URL.createObjectURL(file)
    }))
    
    const updatedPlaylist = [...playlist, ...newTracks]
    const firstNewTrackIndex = playlist.length
    
    setPlaylist(updatedPlaylist)
    setTimeout(() => changeTrack(firstNewTrackIndex, updatedPlaylist), 0)
  }

  const [hasSearched, setHasSearched] = useState(false)
  const [jsCode, setJsCode] = useState("")
  const [jsResult, setJsResult] = useState("")
  
  const executeSearch = async (isVulnerable) => {
    setPlaylist([])
    setHasSearched(true)
    
    const functionName = isVulnerable ? 'buscar_pistas_vulnerable' : 'buscar_pistas_seguro'
    
    const { data, error } = await supabase.rpc(functionName, { 
      nombre_pista: searchTerm 
    })

    if (error) {
      console.error("Search Error:", error)
      alert("Error en la consulta. Posible sintaxis SQL rota (¡Éxito en el ataque!)")
      return
    }

    if (data && data.length > 0) {
      setPlaylist(data)
      setCurrentTrackIndex(0)
    } else {
      setPlaylist([])
      alert("0 resultados encontrados (El sistema bloqueó la inyección o no hay coincidencias)")
    }
  }

  const executeEval = () => {
    try {
      // Esta es la línea que herramientas como njsscan marcarían como ERROR CRÍTICO
      const output = eval(jsCode)
      setJsResult(String(output))
    } catch (e) {
      setJsResult("⚠️ Error: " + e.message)
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="animate-pulse-soft">Cargando Arath Player...</div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      {/* Security Lab Section */}
      <div className="glass security-lab">
        <div className="lab-header">
          <Shield size={18} />
          <span>LABORATORIO DE SEGURIDAD (SQL & CODE INJECTION)</span>
        </div>

        {/* SQL INJECTION DEMO */}
        <div className="lab-section">
          <p className="section-title">1. SQL Injection (Database)</p>
          <div className="search-container">
            <div className="input-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Escribe: ' OR '1'='1" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="search-actions">
              <button onClick={() => executeSearch(true)} className="btn-vuln">
                Probar SQL Vulnerable
              </button>
              <button onClick={() => executeSearch(false)} className="btn-secure">
                Probar SQL Seguro
              </button>
            </div>
          </div>
          {hasSearched && (
            <p className="lab-hint"><b>Resultados:</b> {playlist.length} canciones.</p>
          )}
        </div>

        <div className="divider"></div>

        {/* CODE INJECTION DEMO (EVAL) */}
        <div className="lab-section">
          <p className="section-title">2. Code Injection (JavaScript eval)</p>
          <div className="search-container">
            <div className="input-wrapper">
              <input 
                type="text" 
                placeholder="Prueba: alert('Hackeado!') o 2+2" 
                value={jsCode}
                onChange={(e) => setJsCode(e.target.value)}
                className="search-input code-font"
              />
            </div>
            <button onClick={executeEval} className="btn-vuln full-width">
              Ejecutar Código (Vulnerable)
            </button>
            {jsResult && (
              <div className="eval-result">
                <b>Salida:</b> <code>{jsResult}</code>
              </div>
            )}
          </div>
          <p className="lab-hint">Njsscan detectaría el uso de <code>eval()</code> aquí.</p>
        </div>

        <div className="lab-footer">
          <button className="text-muted btn-reset" onClick={() => window.location.reload()}>
            Reiniciar Todo
          </button>
        </div>
      </div>

      <div className="player-container">
        <div className="glass main-card">
          <div className="header">
            <button onClick={() => fileInputRef.current.click()} title="Subir música">
              <Music size={20} className="text-muted hover-primary" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="audio/*" 
              multiple 
              style={{ display: 'none' }} 
            />
            <span className="brand">ARATH PLAYER</span>
            <button onClick={() => window.location.reload()}>
              <List size={20} className="text-muted hover-primary" />
            </button>
          </div>

          <div className="album-container animate-float">
            <img src={currentTrack?.cover} alt={currentTrack?.title} className="album-art" />
          </div>

          <div className="track-info">
            <div className="track-details">
              <h1>{currentTrack?.title || "Sin título"}</h1>
              <p className="text-muted">{currentTrack?.artist || "Artista desconocido"}</p>
            </div>
            <Heart size={24} className="heart-icon" />
          </div>

          <div className="progress-section">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress || 0} 
              onChange={handleProgressChange}
              className="progress-bar"
            />
            <div className="time-info text-muted">
              <span>0:00</span>
              <span>{currentTrack?.duration || "0:00"}</span>
            </div>
          </div>

          <div className="controls">
            <button onClick={prevTrack}><SkipBack size={32} fill="white" /></button>
            <button onClick={togglePlay} className="play-btn">
              {isPlaying ? <Pause size={40} fill="white" /> : <Play size={40} fill="white" />}
            </button>
            <button onClick={nextTrack}><SkipForward size={32} fill="white" /></button>
          </div>

          <div className="volume-section">
            <Volume2 size={20} className="text-muted" />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01"
              value={volume} 
              onChange={handleVolumeChange}
              className="volume-bar"
            />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .app-layout {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          width: 100%;
        }
        .security-lab {
          width: 100%;
          max-width: 500px;
          padding: 1.5rem;
          text-align: left;
          border-bottom: 3px solid #ef4444;
        }
        .lab-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 800;
          font-size: 0.75rem;
          color: #ef4444;
          margin-bottom: 1.5rem;
          letter-spacing: 1px;
        }
        .lab-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .section-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        .divider {
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin: 1.5rem 0;
        }
        .code-font {
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.8rem;
        }
        .full-width {
          width: 100%;
        }
        .eval-result {
          background: rgba(0,0,0,0.4);
          padding: 10px;
          border-radius: 8px;
          font-size: 0.8rem;
          text-align: left;
          border-left: 3px solid #ef4444;
        }
        .search-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }
        .search-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px 12px 12px 40px;
          border-radius: 12px;
          color: white;
          outline: none;
          transition: all 0.3s;
        }
        .search-input:focus {
          border-color: var(--primary);
          background: rgba(255,255,255,0.1);
        }
        .search-actions {
          display: flex;
          gap: 10px;
        }
        .btn-vuln, .btn-secure {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .btn-vuln {
          background: #ef4444;
          color: white;
        }
        .btn-vuln:hover {
          background: #dc2626;
        }
        .btn-secure {
          background: #22c55e;
          color: white;
        }
        .btn-secure:hover {
          background: #16a34a;
        }
        .lab-footer {
          margin-top: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lab-hint {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .btn-reset {
          font-size: 0.75rem;
          text-decoration: underline;
          cursor: pointer;
        }
        .loading-container {
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .player-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        .main-card {
          width: 380px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand {
          font-weight: 800;
          letter-spacing: 2px;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .album-container {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .album-art {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .track-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
        }
        .track-details h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 250px;
        }
        .track-details p {
          margin: 4px 0 0;
          font-size: 1rem;
        }
        .heart-icon {
          color: var(--text-muted);
          cursor: pointer;
        }
        .progress-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .progress-bar {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }
        .progress-bar::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255,255,255,0.5);
        }
        .time-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
        }
        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 1rem;
        }
        .play-btn {
          width: 80px;
          height: 80px;
          background: white;
          color: black;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .play-btn svg {
          color: black !important;
          fill: black !important;
        }
        .volume-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .volume-bar {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          outline: none;
        }
        .volume-bar::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          background: var(--text-muted);
          border-radius: 50%;
        }
        .text-muted {
          color: var(--text-muted);
        }
      `}} />
    </div>
  )
}

export default App

