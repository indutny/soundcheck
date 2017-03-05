'use strict';

const React = require('react');

const soundcheck = require('../../soundcheck');
const Router = soundcheck.components.Router;
const AudioInput = soundcheck.components.AudioInput;
const Spectrum = soundcheck.components.Spectrum;

class App extends React.Component {
  render() {
    return <div>
      <Router components={[
        { Component: AudioInput, id: 'input', props: { buffer: 2048 } },
        { Component: Spectrum, id: 'fft', props: { size: 2048 } }
      ]}/>
    </div>;
  }
}
module.exports = App;
