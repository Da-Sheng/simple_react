import React from '../react';   
import ReactDOM from '../react-dom/client';

const element = <h1 title="title">Hello, React!<a href="https://www.baidu.com">I am a a</a></h1>;
console.log('element: ', element);

ReactDOM.render(element, document.getElementById('root'));