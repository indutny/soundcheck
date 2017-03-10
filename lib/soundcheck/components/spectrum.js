'use strict';

const SpectrumAnalyzer = require('spectrum-analyzer');
const React = require('react');

const FPS = 60;
const UPDATE_DELTA = 1000 / FPS;

const FREQ_LOW = 10;
const FREQ_HIGH = 20000;
const POINTS_PER_PX = 2;

const POWER_REFERENCE = 1;

class Spectrum extends React.Component {
  constructor(props) {
    super(props);

    this.analyzer = new SpectrumAnalyzer(props.size,
        SpectrumAnalyzer.InputBuffer.windowFunctions.hamming);
    this.sampleRate = props.audioContext.sampleRate;
    this.fftLow = Math.floor((FREQ_LOW / this.sampleRate) * props.size);
    this.fftHigh = Math.ceil((FREQ_HIGH / this.sampleRate) * props.size);

    this.canvas = null;
    this.ctx = null;

    this.lastUpdate = 0;

    this.width = props.width || 640;
    this.height = props.height || 240;

    this.chart = {
      power: new Array(this.width * POINTS_PER_PX).fill(null),
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
    this.analyzer.appendData(inputs[0]);

    const now = Date.now();
    if (now - this.lastUpdate < UPDATE_DELTA)
      return;

    this.lastUpdate = now;

    this.analyzer.recompute();
    this.redraw();
  }

  redraw() {
    const power = this.analyzer.getPower();
    const phase = this.analyzer.getPhase();

    // Group values to display
    let lastX = -1;
    let accPower = 0;
    let accPhase = 0;
    let accCount = 0;
    let maxPower = 0;
    for (let i = this.fftLow; i < this.fftHigh; i++) {
      maxPower = Math.max(power[i], maxPower);
      accPower += power[i];
      accPhase += phase[i];
      accCount++;

      const freq = (i - this.fftLow) / (this.fftHigh - this.fftLow) *
                   (FREQ_HIGH - FREQ_LOW) + FREQ_LOW;
      const off = Math.log10(freq / FREQ_LOW) /
          Math.log10(FREQ_HIGH / FREQ_LOW);

      // Group values to not draw way too much
      const x = Math.max(0, off * this.width);
      if (x - lastX < (1 / POINTS_PER_PX))
        continue;

      const pointPower = accPower / accCount;
      const pointPhase = accPhase / accCount;

      const db = pointPower;
      this.chart.power[Math.floor(x * POINTS_PER_PX)] = db;
      this.chart.phase[Math.floor(x * POINTS_PER_PX)] = pointPhase;

      accPower = 0;
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
      const y = (0.5 + phase / 2) * this.height;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Power
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < this.chart.power.length; i++) {
      const power = this.chart.power[i];
      if (power === null)
        continue;
      const x = i / POINTS_PER_PX;
      const db = 10 * Math.log10(power / POWER_REFERENCE);
      const y = -db / 100 * this.height;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
module.exports = Spectrum;
