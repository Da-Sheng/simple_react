import { scheduleTask } from '../react/polyfillIdle';

let nextUnitOfWork = null;

function render(element, container) {
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element]
        }
    }
}

const createDom = (fiber) => {
    const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);
    const isProperty = name => name !== 'children' && !name.startsWith('on');
    const isEvent = name => name.startsWith('on');

    Object.keys(fiber.props).forEach(name => {
        if (isProperty(name)) {
            dom[name] = fiber.props[name];
        }
        if (isEvent(name)) {
            const eventType = name.toLowerCase().substring(2);
            dom.addEventListener(eventType, fiber.props[name]);
        }
    });

    return dom;
}

function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
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
    if (fiber.parent) {
        fiber.parent.dom.appendChild(fiber.dom);
    }
    // 遍历子元素
    const elements = fiber.props.children;
    let index = 0;
    let prevSibling = null;

    while (index < elements.length) {
        const element = elements[index];
        // 创建新的fiber
        const newFiber = {
            type: element.type,
            props: element.props,
            // 父元素
            parent: fiber,
            dom: null
        }
        // 第一个子元素
        if (index === 0) {
            fiber.child = newFiber;
        } else {
            // 其他子元素
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
        index++;
    }
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

// function commitRoot() {
//     commitWork(nextUnitOfWork);
//     nextUnitOfWork = null;
// }

scheduleTask(workLoop, performance.now());

export default {
    render
}