import createElement from './createElement';
import ReactDOM from '../react-dom/client';

const React = {
    createElement,
    useState: ReactDOM.useState,
    useEffect: ReactDOM.useEffect
}

export default React;