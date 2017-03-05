'use strict';

const FFT = require('fft.js');
const React = require('react');

const FPS = 60;
const UPDATE_DELTA = 1000 / FPS;
const SPEED = 0.4;

const FREQ_LOW = 10;
const FREQ_HIGH = 20000;

class Spectrum extends React.Component {
  constructor(props) {
    super(props);

    this.fft = new FFT(props.size);
    this.sampleRate = props.audioContext.sampleRate;
    this.fftLow = Math.floor((FREQ_LOW / this.sampleRate) * this.fft.size);
    this.fftHigh = Math.ceil((FREQ_HIGH / this.sampleRate) * this.fft.size);

    this.raw = this.fft.createComplexArray();
    this.freq = this.fft.createComplexArray();
    this.mag = new Float64Array(this.fftHigh - this.fftLow);
    this.offset = 0;

    this.canvas = null;
    this.ctx = null;

    this.lastUpdate = 0;

    this.width = props.width || 640;
    this.height = props.height || 240;

    props.onInsertCallback((out, input) => { this.onInsert(out, input) });
  }

  render() {
    return <section className="router-component router-component-spectrum">
      <canvas width={this.width} height={this.height} ref={(canvas) => {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
      }}></canvas>
    </section>;
  }

  onInsert(outputs, inputs) {
    this.props.onPassThrough(outputs, inputs);
    this.addData(inputs);

    this.fft.transform(this.freq, this.raw);

    const now = Date.now();
    if (now - this.lastUpdate < UPDATE_DELTA)
      return;
    this.lastUpdate = now;

    this.redraw();
  }

  addData(inputs) {
    let off = 0;
    while (off < inputs[0].length) {
      const limit = Math.min(inputs[0].length - off,
                             (this.raw.length - this.offset) >>> 1);
      for (let i = 0; i < limit; i++) {
        // Just sum up all channels
        for (let j = 0; j < inputs.length; j++)
          this.raw[this.offset] = inputs[j][off];
        this.raw[this.offset] /= inputs.length;

        off++;
        this.offset += 2;
      }
      this.offset %= this.raw.length;
      if (this.offset !== 0)
        break;
    }
  }

  redraw() {
    const ctx = this.ctx;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.beginPath();
    const size = this.fft.size;
    const halfLen = this.freq.length >>> 1;
    for (let i = this.fftLow; i < this.fftHigh; i++) {
      const mag = Math.sqrt(Math.pow(this.freq[i * 2], 2) +
                            Math.pow(this.freq[i * 2 + 1], 2));
      this.mag[i - this.fftLow] = this.mag[i - this.fftLow] * (1 - SPEED) +
          mag * SPEED;
    }

    let lastX = -1;
    let accMag = 0;
    let accCount = 0;
    for (let i = 0; i < this.mag.length; i++) {
      accMag += this.mag[i];
      accCount++;

      const freq = (i / this.mag.length) * (FREQ_HIGH - FREQ_LOW) + FREQ_LOW;
      const off = Math.log10(freq / FREQ_LOW) /
          Math.log10(FREQ_HIGH / FREQ_LOW);

      const x = Math.max(0, off * this.width);
      if (x - lastX < 0.5)
        continue;

      const mag = accMag / accCount;
      accMag = 0;
      accCount = 0;
      lastX = x;

      const y = (1 - Math.log10(mag) / Math.log10(size / 8)) * this.height;
      accMag = 0;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
module.exports = Spectrum;
