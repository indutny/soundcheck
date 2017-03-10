'use strict';

const React = require('react');

const soundcheck = require('../../soundcheck');
const Router = soundcheck.components.Router;
const AudioInput = soundcheck.components.AudioInput;
const FIR = soundcheck.components.FIR;
const Spectrum = soundcheck.components.Spectrum;

class App extends React.Component {
  render() {
    return <div>
      <Router components={[
        {
          Component: AudioInput,
          id: 'input',
          inserts: {
            post: [ 'fft' ]
          },
          props: { buffer: 1024 }
        },
        { Component: Spectrum, id: 'fft', props: { size: 4096 } },
        { Component: FIR, id: 'fir' }
      ]}/>
    </div>;
  }
}
module.exports = App;
