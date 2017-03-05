'use strict';

const assert = require('assert');
const React = require('react');

class AudioComponent {
  constructor(id) {
    this.id = id;
    this._buffers = [];

    this.inserts = {
      pre: [],
      post: []
    };
    this.insertCallback = null;
  }

  addInserts(inserts) {
    this.inserts.pre = this.inserts.pre.concat(inserts.pre);
    this.inserts.post = this.inserts.pre.concat(inserts.post);
  }

  insert(outputs, inputs) {
    let next = this._createBuffers(outputs);
    let current = outputs;
    let last = inputs;

    function swap() {
      const t = next;
      next = current;
      current = t;
    }

    const pre = this.inserts.pre;
    const post = this.inserts.post;
    const hasOwn = this.insertCallback !== null;
    if ((pre.length + post.length + (hasOwn ? 1 : 0)) % 2 === 0)
      swap();

    for (let i = 0; i < pre.length; i++) {
      pre[i].insert(current, last);
      last = current;

      swap();
    }

    if (hasOwn) {
      this.insertCallback(current, last);
      last = current;
      swap();
    }

    for (let i = 0; i < post.length; i++) {
      post[i].insert(current, last);
      last = current;
      swap();
    }

    assert(next === outputs);
  }

  _createBuffers(outputs) {
    let i;

    // "Re-size" existing buffers
    for (i = 0; i < this._buffers.length; i++)
      if (this._buffers[i].length !== outputs[i].length)
        this._buffers[i] = new Float64Array(outputs[i]);

    // Create new ones
    for (; i < outputs.length; i++)
      this._buffers[i] = new Float64Array(outputs[i]);

    return this._buffers;
  }

  passthrough(outputs, inputs) {
    assert.equal(inputs.length, outputs.length,
                 'Pass through input/output mismatch');
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const output = outputs[i];
      assert.equal(output.length, input.length, 'Pass through data mismatch');
      for (let j = 0; j < input.length; j++)
        output[j] = input[j];
    }
  }

  setInsertCallback(cb) {
    this.insertCallback = cb;
  }
}

class Router extends React.Component {
  constructor() {
    super();

    this.ctx = new window.AudioContext();
  }

  render() {
    const graph = new Map();

    this.props.components.forEach(({ id }) => {
      graph.set(id, new AudioComponent(id));
    });

    function findInsert(insert) {
      assert(graph.has(insert), `Unknown insert: "${insert}"`);
      return graph.get(insert);
    }

    return <section className="router">
      {this.props.components.map(({ Component, id, inserts, props }) => {
        const audio = graph.get(id);

        if (inserts) {
          audio.addInserts({
            pre: (inserts.pre || []).map(findInsert),
            post: (inserts.post || []).map(findInsert)
          });
        }

        return <Component key={id}
                          audioContext={this.ctx}
                          onAudioFeed={(outputs, inputs) => {
                            audio.insert(outputs, inputs);
                          }}
                          onInsertCallback={(cb) => {
                            audio.setInsertCallback(cb);
                          }}
                          onPassThrough={(outputs, inputs) => {
                            audio.passthrough(outputs, inputs);
                          }}
                          {...props} />
      })}
    </section>;
  }
}
module.exports = Router;
