class AudioManager {
  constructor(options) {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    this.oscillatorsTypes = ['sine'];
    this.oscillatorsOptions = [
      ["osc1", "sine", 1],
      ["osc2", "sine", 1]
    ]
    this.oscillators = {}

    this.midNotes = [220,247,262,294,330,349,392,440]
    this.highNotes = [493,523,587,659,698,783,880]
    this.lowNotes = [110,123,130,146,164,174,195]
    this.blackNotes = [78, 92, 104, 116, 139, 156, 185, 208, 233, 277, 311, 370, 415, 466, 554, 622, 740]
    this.allNotes = this.blackNotes;

    this.noteOffset = 1;
    this.timeoutDuration = 150;
  }

  initAudio() {
    for(var i= 0 ; i < this.oscillatorsOptions.length;i++){
      this.initOscillators(this.oscillatorsOptions[i]);
    }
  }

  initOscillators(options) {
    const osc = this.audioCtx.createOscillator();

    osc.volume = this.audioCtx.createGain();
    osc.volume.connect(this.audioCtx.destination);
    osc.volume.gain.value = 1;

    osc.type = options[1];
    osc.frequency.value = options[2];
    osc.connect(osc.volume);
    osc.start();
    const name = options[0];
    const reverb = new SimpleReverb(this.audioCtx, {
      seconds:4,
      decay: 0,
      reverse: 0
    })
    osc.connect(reverb.input);
    reverb.connect(this.audioCtx.destination);
    osc.timeout = null;
    this.oscillators[name] = osc;
  }

  getAverageNote() {
    let sum = 0;
    for( let i = 0; i < this.allNotes.length; i++ ){
        sum += parseInt( this.allNotes[i], 10 );
    }
    return sum/this.allNotes.length;
  }

  playNote(osc, freq = null, volume = 1) {
    if(!freq) {
      freq = this.getRandomFrequence();
    }

    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    osc.volume.gain.value = Math.min(volume, 1);
    
    if(osc.timeout) {
      clearTimeout(osc.timeout);
    }
    osc.timeout = setTimeout(() => {
      osc.frequency.setValueAtTime(0, this.audioCtx.currentTime);
    }, this.timeoutDuration);
  }

  playNotes() {
    this.possibleFrequences = this.allNotes.slice(0);
    let index = 0;

    for(let name in this.oscillators) {
      setTimeout(() => {
        let osc = this.oscillators[name];
        
        const freq = this.getRandomFrequence();
        let freqIndex = this.possibleFrequences.indexOf(freq);
        if (freqIndex > -1) {
          this.possibleFrequences.splice(freqIndex, 1);
        }

        this.playNote(osc, freq, volume);
      }, index * this.timeoutDuration);
      index++;
    }
  }

  getRandomFrequence() {
    const freq = this.allNotes[Math.floor(Math.random() * this.allNotes.length)];
    return freq;
  }
}