import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, List, Heart } from 'lucide-react'

const tracks = [
  {
    id: 1,
    title: "Midnight City",
    artist: "M83",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop",
    duration: "4:03",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "Starboy",
    artist: "The Weeknd",
    cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1000&auto=format&fit=crop",
    duration: "3:50",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "Blinding Lights",
    artist: "The Weeknd",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop",
    duration: "3:20",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
]

function App() {
  const [playlist, setPlaylist] = useState(tracks)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const audioRef = useRef(new Audio(playlist[0].src))
  const fileInputRef = useRef(null)

  const currentTrack = playlist[currentTrackIndex]

  useEffect(() => {
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
    audioRef.current.pause()
    setCurrentTrackIndex(index)
    
    const trackToPlay = currentPlaylist[index]
    audioRef.current = new Audio(trackToPlay.src)
    audioRef.current.volume = volume
    
    // Auto-play
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(e => console.error("Error playing audio:", e))
  }

  const handleProgressChange = (e) => {
    const newProgress = e.target.value
    setProgress(newProgress)
    if (audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value
    setVolume(newVolume)
    audioRef.current.volume = newVolume
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const newTracks = files.map((file, index) => ({
      id: Date.now() + index,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      artist: "Archivo Local",
      cover: "https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=1000&auto=format&fit=crop",
      duration: "Local",
      src: URL.createObjectURL(file)
    }))
    
    const updatedPlaylist = [...playlist, ...newTracks]
    const firstNewTrackIndex = playlist.length // Index of the first new track
    
    setPlaylist(updatedPlaylist)
    
    // Switch to the first uploaded track and play it
    setTimeout(() => {
      changeTrack(firstNewTrackIndex, updatedPlaylist)
    }, 0)
  }


  return (
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
          <button onClick={() => console.log("Playlist clicked")}>
            <List size={20} className="text-muted hover-primary" />
          </button>
        </div>

        <div className="album-container animate-float">
          <img src={currentTrack.cover} alt={currentTrack.title} className="album-art" />
        </div>

        <div className="track-info">
          <div className="track-details">
            <h1>{currentTrack.title}</h1>
            <p className="text-muted">{currentTrack.artist}</p>
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
            <span>{currentTrack.duration}</span>
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

      <style dangerouslySetInnerHTML={{ __html: `
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
