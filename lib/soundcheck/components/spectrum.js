'use strict';

const FFT = require('fft.js');
const React = require('react');

const FPS = 60;
const UPDATE_DELTA = 1000 / FPS;
const SPEED = 0.4;

const FREQ_LOW = 10;
const FREQ_HIGH = 20000;
const POINTS_PER_PX = 2;

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
    this.phase = new Float64Array(this.fftHigh - this.fftLow);
    this.offset = 0;

    this.canvas = null;
    this.ctx = null;

    this.lastUpdate = 0;

    this.width = props.width || 640;
    this.height = props.height || 240;

    this.chart = {
      mag: new Array(this.width * POINTS_PER_PX).fill(null),
      phase: new Array(this.width * POINTS_PER_PX).fill(null)
    };

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
    const size = this.fft.size;
    const halfLen = this.freq.length >>> 1;
    for (let i = this.fftLow; i < this.fftHigh; i++) {
      const re = this.freq[i * 2];
      const im = this.freq[i * 2 + 1];
      const mag = Math.sqrt(Math.pow(re, 2) + Math.pow(im, 2));
      const phase = Math.atan2(im, re);

      const off = i - this.fftLow;
      this.mag[off] = this.mag[off] * (1 - SPEED) + mag * SPEED;
      this.phase[off] = this.phase[off] * (1 - SPEED) + phase * SPEED;
    }

    // Group values to display
    let lastX = -1;
    let accMag = 0;
    let accPhase = 0;
    let accCount = 0;
    for (let i = 0; i < this.mag.length; i++) {
      accMag += this.mag[i];
      accPhase += this.phase[i];
      accCount++;

      const freq = (i / this.mag.length) * (FREQ_HIGH - FREQ_LOW) + FREQ_LOW;
      const off = Math.log10(freq / FREQ_LOW) /
          Math.log10(FREQ_HIGH / FREQ_LOW);

      // Group values to not draw way too much
      const x = Math.max(0, off * this.width);
      if (x - lastX < (1 / POINTS_PER_PX))
        continue;

      const mag = accMag / accCount;
      const phase = accPhase / accCount;

      this.chart.mag[Math.floor(x * POINTS_PER_PX)] = mag;
      this.chart.phase[Math.floor(x * POINTS_PER_PX)] = phase;

      accMag = 0;
      accPhase = 0;
      accCount = 0;
      lastX = x;
    }

    // Draw charts

    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(85,85,85,1)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Axis
    ctx.strokeStyle = 'rgba(120,120,120,1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, this.height / 2);
    ctx.lineTo(this.width, this.height / 2);
    ctx.stroke();

    // 100hz, 1khz 10khz
    for (let hz = 100; hz <= 10000; hz *= 10) {
      const x = Math.log10(hz / FREQ_LOW) /
          Math.log10(FREQ_HIGH / FREQ_LOW) * this.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();

      const text = hz === 100 ? '100hz' :
                   hz === 1000 ? '1khz' : '10khz';
      ctx.strokeText(text, x, 8);
    }

    // 1khz
    const fft1khz = Math.log10(1000 / FREQ_LOW) /
        Math.log10(FREQ_HIGH / FREQ_LOW) * this.width;
    ctx.beginPath();
    ctx.moveTo(fft1khz, 0);
    ctx.lineTo(fft1khz, this.height);
    ctx.stroke();

    // Phase
    ctx.strokeStyle = 'rgba(119,119,238,1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < this.chart.phase.length; i++) {
      const phase = this.chart.phase[i];
      if (phase === null)
        continue;
      const x = i / POINTS_PER_PX;
      const y = (Math.PI + phase) / (2 * Math.PI) * this.height;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Magnitude
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < this.chart.mag.length; i++) {
      const mag = this.chart.mag[i];
      if (mag === null)
        continue;
      const x = i / POINTS_PER_PX;
      const y = (1 - Math.log10(mag) / Math.log10(size)) * this.height;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
module.exports = Spectrum;
