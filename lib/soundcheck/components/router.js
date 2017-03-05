'use strict';

const React = require('react');

class Router extends React.Component {
  constructor() {
    super();

    this.ctx = new window.AudioContext();
  }

  render() {
    const inserts = [];

    return <section className="router">
      {this.props.components.map(({ Component, id, props }) => {
        let insertCb = null;
        const next = inserts.push((out, input) => { insertCb(out, input) });

        return <Component key={id}
                          audioContext={this.ctx}
                          onInsert={(out, input) => { inserts[next](out, input) }}
                          setInsertCallback={cb => insertCb = cb}
                          {...props} />
      })}
    </section>;
  }
}
module.exports = Router;
