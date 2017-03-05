'use strict';

const React = require('react');

class AudioInput extends React.Component {
  constructor(props) {
    super(props);

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

    this.props.onInsert(output, input);
  }

  render() {
    return <section className="router-component audio-input">
    </section>;
  }
}
module.exports = AudioInput;
