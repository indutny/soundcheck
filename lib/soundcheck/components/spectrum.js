'use strict';

const React = require('react');

class Spectrum extends React.Component {
  render() {
    return <section className="router-component spectrum">
      <canvas width="640" height="240"></canvas>
    </section>;
  }

  getAudioInput() {
    return audio => this.onAudio(audio);
  }

  feedAudioTo(input) {
  }

  onAudio(data) {
  }
}
module.exports = Spectrum;
