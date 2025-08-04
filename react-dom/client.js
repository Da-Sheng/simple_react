import { scheduleTask } from '../react/polyfillIdle';

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = null;

const isProperty = name => name !== 'children' && !name.startsWith('on');
const isEvent = name => name.startsWith('on');
function render(element, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [element] // 根元素
        },
        alternate: currentRoot
    }
    nextUnitOfWork = wipRoot;
    deletions = [];
}

function reconcileChildren(wipFiber, elements) {
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling = null;

    while (index < elements.length || oldFiber != null) {
        const element = elements[index];
        let newFiber = null;
        const sameType = oldFiber && element && oldFiber.type === element.type;
        // 更新
        if (sameType) {
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: 'UPDATE'
            }
        }
        // 添加
        if (element && !sameType) {
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: 'PLACEMENT'
            }
        }
        // 删除
        if (oldFiber && !sameType) {
            oldFiber.effectTag = 'DELETION';
            deletions.push(oldFiber);
        }
        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }
        // 添加到fiber树
        if (index === 0) {
            wipFiber.child = newFiber;
        } else if (element) {
            // 其他子元素
            prevSibling.sibling = newFiber;
        }
        index++;
        prevSibling = newFiber;
    }
}

// 更新dom
function updateDom(dom, prevProps, nextProps) {
    // 删除旧的属性
    Object.keys(prevProps).forEach(name => {
        if (!(name in nextProps)) {
            if (isEvent(name)) {
                dom.removeEventListener(name.toLowerCase().substring(2), prevProps[name]);
            } else {
                dom[name] = null;
            }
        }
    })
    
    // 添加新的属性
    Object.keys(nextProps).forEach(name => {
        if (prevProps[name] !== nextProps[name]) {
            if (isProperty(name)) {
                dom[name] = nextProps[name];
            }
        }
    })
    // 删除旧的事件
    Object.keys(prevProps).forEach(name => {
        if (isEvent(name)) {
            dom.removeEventListener(name.toLowerCase().substring(2), prevProps[name]);
        }
    })
    // 添加事件
    Object.keys(nextProps).forEach(name => {
        if (isEvent(name)) {
            console.log('name', name)
            dom.addEventListener(name.toLowerCase().substring(2), nextProps[name]);
        }
    })
    // 添加ref
    if (typeof prevProps.ref === 'function') {
        prevProps.ref(null);
    }
    if (typeof nextProps.ref === 'function') {
        nextProps.ref(dom);
    }
}

const createDom = (fiber) => {
    const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);

    updateDom(dom, {}, fiber.props);


    return dom;
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }
    const domParent = fiber.parent.dom;

    if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    } else if (fiber.effectTag === 'DELETION') {
        domParent.removeChild(fiber.dom);
    }
    
    // 递归子元素
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function commitRoot() {
    // 提交根元素
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    deletions = [];
    // 清空wipRoot
    wipRoot = null;
}

function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }
    scheduleTask(workLoop, performance.now());
}
// 执行单元任务 执行一个单元任务, 并返回下一个单元任务
function performUnitOfWork(fiber) {
    // 创建dom
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }
    // 将dom添加到父元素
    // if (fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom);
    // }
    // 遍历子元素
    const elements = fiber.props.children;
    reconcileChildren(fiber, elements);
    // 如果有子元素，则返回子元素
    if (fiber.child) {
        return fiber.child;
    }
    // 如果没有子元素，则返回兄弟元素
    let nextFiber = fiber;
    while (nextFiber) {
        // 如果有兄弟元素，则返回兄弟元素
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        // 如果没有兄弟元素, 则往上找父元素
        nextFiber = nextFiber.parent;
    }
    // 如果没有, 则返回null
    return null;
}

scheduleTask(workLoop, performance.now());

export default {
    render
}