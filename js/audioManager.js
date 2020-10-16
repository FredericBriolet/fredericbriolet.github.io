class AudioManager {
  constructor(options) {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    this.oscillatorsTypes = ['sine'];
    this.oscillatorsOptions = [
      ["osc1", "sine", 1],
      ["osc2", "sine", 1]
    ]
    this.oscillators = {}

    this.reverb = null;
    this.reverbNotesPlaying = 0;
    this.reverbVolume = null;
    this.reverbVolumeTweener = null;
    this.reverbVolumeValue = settings.masterVolumeReverb;

    this.midNotes = [220,247,262,294,330,349,392,440]
    this.highNotes = [493,523,587,659,698,783,880]
    this.lowNotes = [110,123,130,146,164,174,195]
    // this.blackNotes = [78, 92, 104, 116, 139, 156, 185, 208, 233, 277, 311, 370, 415, 466, 554, 622, 740]
    this.blackNotes = [104, 116, 139, 156, 185, 208, 233, 277, 311, 370, 415, 466, 554, 622, 740]
    this.allNotes = this.blackNotes;

    this.timeoutDuration = 800;
    this.reverbDuration = 5000;
  }

  initAudio() {
    for(var i= 0 ; i < this.oscillatorsOptions.length;i++){
      this.initOscillators(this.oscillatorsOptions[i]);
    }
  }

  initOscillators(options) {
    const osc = this.audioCtx.createOscillator();
    osc.timeout = null;
    
    osc.volume = this.audioCtx.createGain();
    osc.volume.connect(this.audioCtx.destination);
    osc.volume.gain.setValueAtTime(0, this.audioCtx.currentTime);
    osc.connect(osc.volume);
    

    this.reverbVolume = this.audioCtx.createGain();
    this.reverbVolume.connect(this.audioCtx.destination);

    this.reverb = new SimpleReverb(this.audioCtx, {
      seconds: this.reverbDuration / 1000,
      decay: 2,
      reverse: 0
    })

    osc.volume.connect(this.reverb.input);
    this.reverb.output.connect(this.reverbVolume);
    this.reverbVolume.gain.setValueAtTime(settings.masterVolumeReverb, this.audioCtx.currentTime);

    osc.type = options[1];
    osc.frequency.value = options[2];

    osc.start(0);

    const name = options[0];
    this.oscillators[name] = osc;

    let folder = gui.addFolder(name);
    folder.add(this.reverb.params.seconds, 'value', 0.0, 10.0, 0.1).name("Reverb duration");
  }

  getAverageNote() {
    let sum = 0;
    for( let i = 0; i < this.allNotes.length; i++ ){
        sum += parseInt( this.allNotes[i], 10 );
    }
    return sum/this.allNotes.length;
  }

  clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
  }

  playNote(osc, freq = null, volume = 0.01, portamento = settings.portamento) {
    if (!freq) {
      freq = this.getRandomFrequence();
    }

    if (this.reverbVolumeValue != settings.masterVolumeReverb) {
      this.reverbVolumeValue = settings.masterVolumeReverb;
      this.reverbVolume.gain.setValueAtTime(this.reverbVolumeValue, this.audioCtx.currentTime);
    }


    let vol = volume * settings.masterVolumeBase;
    osc.volume.gain.setValueAtTime(vol, this.audioCtx.currentTime);

    // this.attack = 1;
    // this.release = 2;
    // osc.volume.gain.linearRampToValueAtTime(volume, this.audioCtx.currentTime + this.attack);
    // osc.volume.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + this.attack + this.release);
    
    osc.frequency.linearRampToValueAtTime(freq, this.audioCtx.currentTime + portamento);

    this.reverbNotesPlaying++;

    if (osc.timeout) {
      clearTimeout(osc.timeout);
    }
    osc.timeout = setTimeout(() => {
      osc.frequency.setValueAtTime(0, this.audioCtx.currentTime);
      // osc.volume.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + this.release);

      clearTimeout(osc.timeout);
    }, this.timeoutDuration);
  }

  getRandomFrequence() {
    const freq = this.allNotes[Math.floor(Math.random() * this.allNotes.length)];
    return freq;
  }
}