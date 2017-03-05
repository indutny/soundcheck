'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const components = {};
exports.components = components;

components.Router = require('./soundcheck/components/router');
components.AudioInput = require('./soundcheck/components/audio-input');
components.Spectrum = require('./soundcheck/components/spectrum');
components.FIR = require('./soundcheck/components/fir');
components.App = require('./soundcheck/components/app');

ReactDOM.render(<components.App/>, document.getElementById('root'));
