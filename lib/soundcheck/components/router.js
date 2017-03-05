'use strict';

const React = require('react');

class Router extends React.Component {
  render() {
    const children = React.Children.toArray(this.props.children);

    for (let i = 0; i < children.length - 1; i++)
      children[i].feedAudioTo(children[i].getAudioInput());

    return <section className="router">
      {this.props.children}
    </section>;
  }
}
module.exports = Router;
