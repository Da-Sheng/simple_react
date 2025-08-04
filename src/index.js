import React from '../react';
import ReactDOM from '../react-dom/client';
// import '../react/polyfillIdle';
// import React from "react";

const updateValue = (e) => {
    reRender(e.target.value);
}
const App = ({ title, value }) => {
    return (
        <h1 title={title}>
            <input type="text" value={value} onInput={updateValue} />
            Hello, {value}!
        </h1>
    )
}

const reRender = (value) => {
    ReactDOM.render(<App title="title" value={value} />, document.getElementById('root'));
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