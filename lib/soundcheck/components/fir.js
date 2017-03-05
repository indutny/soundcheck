'use strict';

const React = require('react');

class FIR extends React.Component {
  constructor(props) {
    super(props);

    this.w1 = 0;
    this.w2 = 0;

    props.onInsertCallback((out, input) => { this.onInsert(out, input) });
  }

  render() {
    return <section className="router-component router-component-fir">
    </section>;
  }

  onInsert(outputs, inputs) {
    let w1 = this.w1;
    let w2 = this.w2;
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const out = outputs[i];
      for (let j = 0; j < input.length; j++) {
        const w0 = input[j];
        out[j] = (w0 + w1 + w2) / 3;
        w2 = w1;
        w1 = w0;
      }
    }
    this.w1 = w1;
    this.w2 = w2;
  }
}
module.exports = FIR;
