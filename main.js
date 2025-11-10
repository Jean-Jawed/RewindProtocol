// Audio Manager
class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.musicGain = this.audioContext.createGain();
        this.musicGain.connect(this.masterGain);
        this.isMuted = false;
        this.musicOscillators = [];
        this.settings = this.loadSettings();
        this.updateVolume();
    }

    loadSettings() {
        const saved = localStorage.getItem('rewindSettings');
        return saved ? JSON.parse(saved) : {
            volume: 50,
            sfxVolume: 70,
            controls: 'qsdz'
        };
    }

    saveSettings() {
        localStorage.setItem('rewindSettings', JSON.stringify(this.settings));
    }

    updateVolume() {
        this.masterGain.gain.value = this.settings.volume / 100;
    }

    startMusic() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.stopMusic();
        
        // Basse
        const bass = this.audioContext.createOscillator();
        bass.type = 'sine';
        bass.frequency.value = 55;
        const bassGain = this.audioContext.createGain();
        bassGain.gain.value = 0.15;
        bass.connect(bassGain);
        bassGain.connect(this.musicGain);
        bass.start();
        this.musicOscillators.push(bass);

        // Pad
        const pad = this.audioContext.createOscillator();
        pad.type = 'sawtooth';
        pad.frequency.value = 220;
        const padGain = this.audioContext.createGain();
        padGain.gain.value = 0.08;
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        pad.connect(filter);
        filter.connect(padGain);
        padGain.connect(this.musicGain);
        pad.start();
        this.musicOscillators.push(pad);

        // Arpège
        this.startArpeggio();
    }

    startArpeggio() {
        const notes = [440, 554.37, 659.25, 880];
        let index = 0;
        
        const playNote = () => {
            if (this.isMuted) return;
            
            const osc = this.audioContext.createOscillator();
            osc.type = 'square';
            osc.frequency.value = notes[index];
            const gain = this.audioContext.createGain();
            gain.gain.value = 0.05;
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.musicGain);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
            
            index = (index + 1) % notes.length;
        };
        
        this.arpeggioInterval = setInterval(playNote, 400);
    }

    stopMusic() {
        this.musicOscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.musicOscillators = [];
        if (this.arpeggioInterval) {
            clearInterval(this.arpeggioInterval);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.masterGain.gain.value = this.isMuted ? 0 : this.settings.volume / 100;
        return this.isMuted;
    }

    playSound(type) {
        if (this.isMuted) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const now = this.audioContext.currentTime;
        
        gain.gain.value = (this.settings.sfxVolume / 100) * 0.3;
        
        switch(type) {
            case 'click':
                osc.frequency.value = 800;
                osc.type = 'square';
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
        }
    }
}

// Settings Manager
class SettingsManager {
    constructor(audioManager) {
        this.audio = audioManager;
        this.initializeControls();
    }

    initializeControls() {
        // Volume sliders
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');
        const sfxSlider = document.getElementById('sfx-slider');
        const sfxValue = document.getElementById('sfx-value');
        const controlsSelect = document.getElementById('controls-select');

        volumeSlider.value = this.audio.settings.volume;
        volumeValue.textContent = this.audio.settings.volume + '%';
        sfxSlider.value = this.audio.settings.sfxVolume;
        sfxValue.textContent = this.audio.settings.sfxVolume + '%';
        controlsSelect.value = this.audio.settings.controls;

        volumeSlider.addEventListener('input', (e) => {
            this.audio.settings.volume = parseInt(e.target.value);
            volumeValue.textContent = e.target.value + '%';
            this.audio.updateVolume();
            this.audio.saveSettings();
        });

        sfxSlider.addEventListener('input', (e) => {
            this.audio.settings.sfxVolume = parseInt(e.target.value);
            sfxValue.textContent = e.target.value + '%';
            this.audio.saveSettings();
        });

        controlsSelect.addEventListener('change', (e) => {
            this.audio.settings.controls = e.target.value;
            this.audio.saveSettings();
        });

        document.getElementById('reset-settings').addEventListener('click', () => {
            this.audio.settings = { volume: 50, sfxVolume: 70, controls: 'qsdz' };
            this.audio.saveSettings();
            this.audio.updateVolume();
            volumeSlider.value = 50;
            volumeValue.textContent = '50%';
            sfxSlider.value = 70;
            sfxValue.textContent = '70%';
            controlsSelect.value = 'qsdz';
            this.audio.playSound('click');
        });
    }
}

// Leaderboard Manager
class LeaderboardManager {
    constructor() {
        this.scores = this.loadScores();
    }

    loadScores() {
        const saved = localStorage.getItem('rewindLeaderboard');
        return saved ? JSON.parse(saved) : [];
    }

    saveScores() {
        localStorage.setItem('rewindLeaderboard', JSON.stringify(this.scores));
    }

    addScore(name, score, level) {
        this.scores.push({
            name: name || 'Anonymous',
            score: score,
            level: level,
            date: new Date().toLocaleDateString()
        });
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 10);
        this.saveScores();
    }

    display() {
        const list = document.getElementById('leaderboard-list');
        if (this.scores.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--neon-pink);">Aucun score enregistré</p>';
            return;
        }

        list.innerHTML = this.scores.map((entry, index) => `
            <div class="leaderboard-entry">
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${entry.name}</span>
                <span class="leaderboard-score">${entry.score}</span>
                <span class="leaderboard-date">${entry.date}</span>
            </div>
        `).join('');
    }
}

// Main App
class App {
    constructor() {
        this.audio = new AudioManager();
        this.settings = new SettingsManager(this.audio);
        this.leaderboard = new LeaderboardManager();
        this.deathCount = 0;
        this.init();
    }

    init() {
        this.showBootScreen();
        this.initializeEventListeners();
    }

    showBootScreen() {
        const bootScreen = document.getElementById('boot-screen');
        const landing = document.getElementById('landing');
        
        setTimeout(() => {
            bootScreen.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => {
                bootScreen.classList.add('hidden');
                landing.classList.remove('hidden');
                this.audio.startMusic();
            }, 500);
        }, 2500);
    }

    initializeEventListeners() {
        // Main menu
        document.getElementById('play-btn').addEventListener('click', () => {
            this.audio.playSound('click');
            window.location.href = 'game.html';
        });

        document.getElementById('leaderboard-btn').addEventListener('click', () => {
            this.audio.playSound('click');
            this.showLeaderboard();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.audio.playSound('click');
            this.showSettings();
        });

        document.getElementById('credits-btn').addEventListener('click', () => {
            this.audio.playSound('click');
            this.showCredits();
        });

        // Mute button
        document.getElementById('mute-btn').addEventListener('click', () => {
            const isMuted = this.audio.toggleMute();
            document.getElementById('mute-btn').textContent = isMuted ? '🔇' : '🔊';
        });

        // Modal closes
        document.getElementById('close-credits').addEventListener('click', () => {
            this.audio.playSound('click');
            this.hideModal('credits-modal');
        });

        document.getElementById('close-leaderboard').addEventListener('click', () => {
            this.audio.playSound('click');
            this.hideModal('leaderboard-modal');
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            this.audio.playSound('click');
            this.hideModal('settings-modal');
        });

        // Konami code easter egg
        this.initKonamiCode();
    }

    showCredits() {
        document.getElementById('credits-modal').classList.remove('hidden');
    }

    showLeaderboard() {
        this.leaderboard.display();
        document.getElementById('leaderboard-modal').classList.remove('hidden');
    }

    showSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    hideModal(id) {
        document.getElementById(id).classList.add('hidden');
    }

    initKonamiCode() {
        const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let position = 0;

        document.addEventListener('keydown', (e) => {
            if (e.key === code[position]) {
                position++;
                if (position === code.length) {
                    alert('🔄 La boucle est infinie 🔄');
                    position = 0;
                }
            } else {
                position = 0;
            }
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});