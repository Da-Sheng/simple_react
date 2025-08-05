import React from '../react';
import ReactDOM, { useState } from '../react-dom/client';
// import '../react/polyfillIdle';
// import React from "react";
// import ReactDOM from "react-dom";

// 父组件
function Parent() {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('Parent effect 执行');
    return () => {
      console.log('Parent effect 清理');
    };
  }, [count]);
  
  return (
    <div>
      <h1>Parent Component</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>更新Parent</button>
      
      {/* 添加两个兄弟组件 Child1A 和 Child1B */}
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <Child1A parentCount={count} />
        <Child1B parentCount={count} />
      </div>
    </div>
  );
}

// 子组件1A
function Child1A({ parentCount }) {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('Child1A effect 执行');
    return () => {
      console.log('Child1A effect 清理');
    };
  }, [count]);
  
  React.useEffect(() => {
    console.log('Child1A 第二个effect 执行 (依赖于parentCount)');
    return () => {
      console.log('Child1A 第二个effect 清理');
    };
  }, [parentCount]);
  
  return (
    <div style={{marginLeft: '20px', border: '1px solid blue', padding: '10px', width: '45%'}}>
      <h2>Child1A Component</h2>
      <p>自身Count: {count}</p>
      <p>父组件Count: {parentCount}</p>
      <button onClick={() => setCount(count + 1)}>更新Child1A</button>
      
      {/* 添加两个兄弟组件 Child2A 和 Child2B */}
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <Child2A parentCount={count} grandparentCount={parentCount} />
        <Child2B parentCount={count} grandparentCount={parentCount} />
      </div>
    </div>
  );
}

// 兄弟组件1B
function Child1B({ parentCount }) {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('Child1B effect 执行');
    return () => {
      console.log('Child1B effect 清理');
    };
  }, [count]);
  
  return (
    <div style={{marginLeft: '20px', border: '1px solid purple', padding: '10px', width: '45%'}}>
      <h2>Child1B Component (兄弟组件)</h2>
      <p>自身Count: {count}</p>
      <p>父组件Count: {parentCount}</p>
      <button onClick={() => setCount(count + 1)}>更新Child1B</button>
      <Child3B parentCount={count} />
    </div>
  );
}

// 子组件2A
function Child2A({ parentCount, grandparentCount }) {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('Child2A effect 执行');
    return () => {
      console.log('Child2A effect 清理');
    };
  }, [count]);
  
  return (
    <div style={{marginLeft: '20px', border: '1px solid green', padding: '10px', width: '45%'}}>
      <h3>Child2A Component</h3>
      <p>自身Count: {count}</p>
      <p>父组件Count: {parentCount}</p>
      <p>祖父组件Count: {grandparentCount}</p>
      <button onClick={() => setCount(count + 1)}>更新Child2A</button>
      <Child3A parentCount={count} />
    </div>
  );
}

// 兄弟组件2B
function Child2B({ parentCount, grandparentCount }) {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('Child2B effect 执行');
    return () => {
      console.log('Child2B effect 清理');
    };
  }, [count]);
  
  return (
    <div style={{marginLeft: '20px', border: '1px solid teal', padding: '10px', width: '45%'}}>
      <h3>Child2B Component (兄弟组件)</h3>
      <p>自身Count: {count}</p>
      <p>父组件Count: {parentCount}</p>
      <p>祖父组件Count: {grandparentCount}</p>
      <button onClick={() => setCount(count + 1)}>更新Child2B</button>
    </div>
  );
}

// 子组件3A
function Child3A({ parentCount }) {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('Child3A effect 执行');
    return () => {
      console.log('Child3A effect 清理');
    };
  }, [count]);
  
  React.useEffect(() => {
    console.log('Child3A 第二个effect 执行 (依赖于parentCount)');
    return () => {
      console.log('Child3A 第二个effect 清理');
    };
  }, [parentCount]);
  
  return (
    <div style={{marginLeft: '20px', border: '1px solid red', padding: '10px'}}>
      <h4>Child3A Component (最深层)</h4>
      <p>自身Count: {count}</p>
      <p>父组件Count: {parentCount}</p>
      <button onClick={() => setCount(count + 1)}>更新Child3A</button>
    </div>
  );
}

// 兄弟组件3B
function Child3B({ parentCount }) {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('Child3B effect 执行');
    return () => {
      console.log('Child3B effect 清理');
    };
  }, [count]);
  
  return (
    <div style={{marginLeft: '20px', border: '1px solid orange', padding: '10px'}}>
      <h4>Child3B Component (兄弟组件)</h4>
      <p>自身Count: {count}</p>
      <p>父组件Count: {parentCount}</p>
      <button onClick={() => setCount(count + 1)}>更新Child3B</button>
    </div>
  );
}

const reRender = () => {
  ReactDOM.render(<Parent />, document.getElementById('root'));
}

// 初始渲染
reRender();