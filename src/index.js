import React from '../react';
import ReactDOM from '../react-dom/client';
import '../react/polyfillIdle';

const updateValue = (e) => {
    reRender(e.target.value);
}
const reRender = (value) => {
    const element = (<h1 title="title">
        <input type="text" value={value} onInput={updateValue} />
        Hello, {value}!
    </h1>);
    ReactDOM.render(element, document.getElementById('root'));
}
// const element = <h1 title="title">
//     Hello, React!
//     <a onClick={() => console.log('click')} href="javascript:void(0)">I am a a</a>
//     <div>
//         <h2>I am a h2</h2>
//     </div>
//     <div>
//         <h2>I am a h2</h2>
//     </div>
//     <div>
//         <h2>I am a h2</h2>
//     </div>
// </h1>;
// console.log('element: ', element);

// ReactDOM.render(element, document.getElementById('root'));
reRender('React!');