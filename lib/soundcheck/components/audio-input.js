'use strict';

const PI2 = 2 * Math.PI;
let SAMPLE_RATE = null;

const DEFAULT_LOOKBACK = 1;
const DEFAULT_TEMPO = 3;

let WHITE = null;

function clip(x) {
  return Math.max(-1, Math.min(1, x));
}

function pclip(x) {
  return Math.max(0, Math.min(1, x));
}

function initNoise() {
  WHITE = new Array((SAMPLE_RATE / DEFAULT_TEMPO) | 0);
  let r = 0xdeadbeef;
  for (let i = 0; i < WHITE.length; i++) {
    r ^= r << 13;
    r ^= r >> 17;
    r ^= r << 5;
    WHITE[i] = ((r >>> 0) / 0x100000000) * 2 - 1;
  }
}
initNoise();

function random(t) {
  return WHITE[((t * SAMPLE_RATE) % WHITE.length) | 0];
}

const shapes = {
  drum: {
    bass: (x, t) => {
      let hi = random(t) * Math.max(0, 0.001 - t) / 0.001;
      return hi + Math.sin(PI2 * t * (1 - t) * 50);
    },
    snare: (x, t) => {
      const noise = random(t);
      const body = shapes.sin(120 - t * 30, t);

      const noiseEnv = Math.max(0, Math.pow(1 - t, 12));
      const bodyEnv = Math.max(0, Math.pow(1 - t, 8)) * 0.6;

      return noise * noiseEnv + body * bodyEnv;
    },
    hhat: (x, t) => {
      return random(t);
    }
  },
  sin: (x, t) => { return Math.sin(PI2 * t * x) },
  saw: (x, t) => { return (t * x) % 1 - 0.5 },
  lead: (x, t) => {
    return clip(Math.sin(PI2 * t * x) * ((t * x * 0.5) % 1 - 0.5) * 1.3);
  },
  bass: (x, t) => {
    return clip(shapes.sin(x, t) * shapes.saw(x, t) * 3);
  }
};

const filters = {
  highPass: (fn, x, t) => {
    return (fn(x, t) - fn(x, t + 1/SAMPLE_RATE) -
            fn(x, t + 2/SAMPLE_RATE)) / 3;
  },
  lowPass: (fn, x, t) => {
    return (fn(x, t) + fn(x, t + 1/SAMPLE_RATE) +
            fn(x, t + 2/SAMPLE_RATE)) / 3;
  }
};

function Instrument(config) {
  this.name = config.name;
  this.shape = config.shape;
  this.filter = config.filter;
  this.timbre = config.timbre;
  this.gain = typeof config.gain === 'undefined' ? 1 : config.gain;
  this.envelope = config.envelope;
  this.notes = config.notes;
  this.tempo = config.tempo || DEFAULT_TEMPO;
  this.lookback = config.lookback || DEFAULT_LOOKBACK;
}

Instrument.prototype.playNote = function playNote(note, start, t) {
  const noteT = t - start;
  const envelopeT = noteT * this.tempo;
  const freq = this.timbre * Math.pow(2, note / 12);
  let raw;
  if (this.filter)
    raw = this.filter(this.shape, freq, noteT);
  else
    raw = this.shape(freq, noteT);

  // Safety guard
  raw = Math.max(-1, Math.min(1, raw));

  const gain = this.envelope ? pclip(this.envelope(envelopeT)) : 1;
  return raw * gain;
};

Instrument.prototype.play = function play(time) {
  // Just for live editing
  if (this.notes.length <= 0)
    return;

  const noteOff = Math.floor(time * this.tempo);

  let comp = 0;
  while (comp < this.lookback)
    comp += this.notes.length;

  let res = 0;
  for (let i = this.lookback - 1; i >= 0; i--) {
    const nodeStart = noteOff - i;
    const nodeIndex = (nodeStart + comp) % this.notes.length;
    let note = this.notes[nodeIndex];
    if (note === null)
      continue;

    res += this.playNote(note, nodeStart / this.tempo, time);
  }

  const gain =
      clip(typeof this.gain === 'function' ?
           this.gain(time * this.tempo) : this.gain);
  res *= gain;

  // Protection
  if (isNaN(res))
    return 0;
  return res;
};

function bassDrum(notes, tempo, gain) {
  return {
    name: 'drums:bass',
    shape: shapes.drum.bass,
    timbre: 0,
    lookback: tempo,
    gain: typeof gain === 'undefined' ? 1 : gain,
    tempo: tempo || TEMPO,
    envelope: function(t) {
      const mid = 0.1;
      if (t < 0.005)
        return t / 0.005;
      else if (t < mid)
        return 1;
      else
        return 1 - (t - mid) / (1 - mid);
    },
    notes: notes
  };
}

function snareDrum(notes, tempo, gain) {
  return {
    name: 'drums:snare',
    shape: shapes.drum.snare,
    timbre: 0,
    gain: typeof gain === 'undefined' ? 1 : gain,
    tempo: tempo || TEMPO,
    notes: notes
  };
}

function hhat(notes, tempo, gain) {
  return {
   name: 'drums:hhat',
    shape: shapes.drum.hhat,
    filter: filters.highPass,
    timbre: 0,
    gain: typeof gain === 'undefined' ? 1 : gain,
    tempo: tempo || TEMPO,
    envelope: function(t) {
      return Math.pow(Math.max(0, 1 - t), 24);
    },
    notes: notes
  };
}

function mono(name, shape, filter, notes, octave, tempo, gain) {
  return {
    name,
    shape,
    timbre: 329.62755 * Math.pow(2, octave || 0),
    lookback: 2,
    filter: filter,
    gain: typeof gain === 'undefined' ? 1 : gain,
    tempo: tempo || TEMPO,
    envelope: function(t) {
      if (t < 0.01)
        return t / 0.01;
      else if (t < 0.75)
        return 1;
      else
        return (1.05 - t) / 0.255;
    },
    notes: notes
  };
}

function bass(notes, tempo, gain) {
  return mono('bass', shapes.bass, filters.lowPass, notes, -3, tempo, gain);
}

function lead(notes, tempo, gain) {
  return mono('lead', shapes.lead, null, notes, 1, tempo, gain);
}

const _ = null;
const instruments = [
   hhat([ 0, _, _, _ ], 5, 0.5),
   snareDrum([ _, _, _, _, 0, _, _, _ ], 5, 0.4),
   bassDrum([ 0, 0, _, _, _, _, 0, 0, _, _, _, _, 0, 0, _, 0, 0, _ ,
              0, 0, _, _, _, _, 0, 0, _, _, _, _, 0,0, _, _, _, _  ], 5, 0.8),
   bass([ 0, 0, _, _, _, _, 0, 0, _, _, _, _, 0, 0, _, 0, 3, _ ,
          0, 0, _, _, _, _, 0, 0, _, _, _, _, 0,0, _, _, _, _  ], 5, 1),
   lead([ 0, 7, 12, 7, 5, 3,
          0, 7, 12, 7, 5, 3,
          0, 7, 12, 7, 5, 3,
          0, 7, 12, 7, 5, 3,
          0, 7, 12, 7, 5, 3,
          5, 7, 12, 7, 5, 2,
          1, 7, 12, 7, 5, 0,
          1, 7, 12, 7, 5, 0,
          1, 7, 12, 7, 3, 0,
          1, 7, 12, 7, 5, 0,
          1, 7, 12, 7, 5, 0,
          1, 7, 12, 7, 3, 1], 10, (time) => {
            const off = time % (72 * 3);
            const gain = 0.15;
            if (off <= 72)
              return Math.pow(off / 72, 4) * gain;
            else if (off <= 72 * 2)
              return gain;
            else
              return Math.pow((72 * 3 - off) / 72, 4)* gain;
          })
].filter(x => x).map(config => new Instrument(config));

function music (t) {
  if (!SAMPLE_RATE) {
    SAMPLE_RATE = 44100;
    WHITE = new Array((SAMPLE_RATE / DEFAULT_TEMPO) | 0);
    initNoise();
  }
  if (!SAMPLE_RATE)
    return 0;
  let amp = 0;
  for (let i = 0; i < instruments.length; i++)
    amp += instruments[i].play(t);
  return amp;
};

const React = require('react');

class AudioInput extends React.Component {
  constructor(props) {
    super(props);

    this.sampleRate = props.audioContext.sampleRate;
    /*
    const out = new Float64Array(props.buffer);
    const input = new Float64Array(props.buffer);
    setInterval(() => {
      for (let i = 0; i < input.length; i++)
        input[i] = Math.random() * 2 - 1;
      this.props.onAudioFeed([ out ], [ input ]);
    }, 40);
    return;
    */

    this.off = 0;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      this.source = props.audioContext.createMediaStreamSource(stream);
      this.node = props.audioContext.createScriptProcessor(props.buffer, 1, 1);

      this.node.onaudioprocess = event => this.onAudioProcess(event);

      this.source.connect(this.node);
      this.node.connect(props.audioContext.destination);
    });
  }

  onAudioProcess(event) {
    const input = event.inputBuffer.getChannelData(0);
    const output = event.outputBuffer.getChannelData(0);

    let off = this.off;
    for (let i = 0; i < input.length; i++) {
      const t = (off + i) / this.sampleRate;
      input[i] = music(t);
    }
    this.off += input.length;
    this.props.onAudioFeed([ output ], [ input ]);
  }

  render() {
    return <section className="router-component router-component-audio-input">
      AudioInput
    </section>;
  }
}
module.exports = AudioInput;
