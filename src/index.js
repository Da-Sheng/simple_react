import React from 'react';  

const element = <h1 title="title">Hello, React!</h1>;

const node = document.createElement(element.type);
node.title = element.props.title;

const text = document.createTextNode('');
text.nodeValue = element.props.children;
 
node.appendChild(text);

const root = document.getElementById('root');
root.appendChild(node);


// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(element);