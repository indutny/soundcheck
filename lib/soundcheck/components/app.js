'use strict';

const React = require('react');

const soundcheck = require('../../soundcheck');
const Router = soundcheck.components.Router;
const AudioInput = soundcheck.components.AudioInput;
const Spectrum = soundcheck.components.Spectrum;

class App extends React.Component {
  render() {
    return <div>
      <Router>
        <AudioInput/>
        <Spectrum/>
      </Router>
    </div>;
  }
}
module.exports = App;
