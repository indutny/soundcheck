'use strict';

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
      input[i] = Math.sin(2 * Math.PI * (off + i) * 1000 / this.sampleRate) * 0.2;
      input[i] += Math.sin(2 * Math.PI * (off + i) * 100 / this.sampleRate) * 0.2;
    }
    this.off += input.length;
    this.off %= input.length * 512;
    this.props.onAudioFeed([ output ], [ input ]);
  }

  render() {
    return <section className="router-component router-component-audio-input">
      AudioInput
    </section>;
  }
}
module.exports = AudioInput;
