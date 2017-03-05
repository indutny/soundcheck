'use strict';

const React = require('react');

class AudioInput extends React.Component {
  AudioInput() {
  }

  render() {
    return <section className="router-component audio-input">
    </section>;
  }

  getAudioInput() {
    throw new Error('Surprisingly AudioInput can only output data');
  }

  feedAudioTo(input) {
    console.log('feed', input);
  }
}
module.exports = AudioInput;
