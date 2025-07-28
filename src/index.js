import React from '../react';
import ReactDOM from '../react-dom/client';
import '../react/polyfillIdle';

const element = <h1 title="title">Hello, React!<a onClick={() => console.log('click')} href="javascript:void(0)">I am a a</a></h1>;
console.log('element: ', element);

ReactDOM.render(element, document.getElementById('root'));