let globalIndex = 0;
const globalState = {};
const globalSubscribers = {}

function useState(initialState) {
    const index = globalIndex++;
    if (!globalState[index]) {
        globalState[index] = initialState;
        globalSubscribers[index] = new Set();
    }
    const setState = (newState) => {
        if (typeof newState === 'function') {
            newState = newState(globalState[index]);
        }
        globalState[index] = newState;
        for (const fn of globalSubscribers[index]) {
            fn(newState);
        }
    }

    const subscribe = (fn) => {
        globalSubscribers[index].add(fn);
        return () => {
            globalSubscribers[index].delete(fn);
        }
    }

    return [globalState[index], setState, subscribe];
}

const [count, setCount, subscribe] = useState(0);
const [count2, setCount2, subscribe2] = useState(2);

subscribe((newState) => {
    console.log('subscribe', newState);
})
subscribe2((newState) => {
    console.log('subscribe2', newState);
})

console.log('count', count);
setCount(count + 1);
setCount2(3)
setCount(count => count + 1);
setCount2(count => count + 1);
console.log('count2', count2);