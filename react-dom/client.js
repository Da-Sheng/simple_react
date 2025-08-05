import { scheduleTask } from '../react/polyfillIdle';

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = null;
let isRenderScheduled = false; // 标记是否已经调度了一个渲染任务

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
    scheduleTask(workLoop, performance.now());
}

let wipFiber = null;
let hookIndex = 0;

export function useState(initialState) {
    const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
    const hook = {
        state: oldHook ? oldHook.state : initialState,
        queue: []
    }
    const actions = oldHook ? oldHook.queue : [];
    actions.forEach(action => {
        if (typeof action === 'function') {
            hook.state = action(hook.state);
        } else {
            hook.state = action;
        }
    })
    const setState = (action) => {
        hook.queue.push(action);
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        }
        nextUnitOfWork = wipRoot;
        deletions = [];
        
        // 只有在当前没有进行中的渲染任务时，才调度一个新的任务
        // 因为workLoop中已经有条件判断，所以这里不需要重复调度
        if (!isRenderScheduled) {
            isRenderScheduled = true;
            scheduleTask(workLoop, performance.now());
        }
    }
    hookIndex++;
    wipFiber.hooks.push(hook);
    return [hook.state, setState];
}

export function useEffect(callback, deps) {
    const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
    
    // 创建新的effect hook
    const hook = {
        tag: 'effect',
        callback,
        deps,
        cleanup: undefined
    };
    
    // 如果有旧的hook，并且依赖项没有变化，则保留旧的cleanup函数
    if (oldHook) {
        const oldDeps = oldHook.deps;
        // 检查依赖项是否变化
        const depsChanged = !deps || 
            !oldDeps || 
            deps.length !== oldDeps.length || 
            deps.some((dep, i) => dep !== oldDeps[i]);
        
        if (!depsChanged) {
            // 依赖项没有变化，保留旧的cleanup函数，不执行effect
            hook.cleanup = oldHook.cleanup;
            hook.effectTag = 'NO_EFFECT';
        } else {
            // 依赖项变化，需要执行cleanup和effect
            hook.cleanup = oldHook.cleanup;
            hook.effectTag = 'UPDATE';
        }
    } else {
        // 首次渲染，需要执行effect
        hook.effectTag = 'PLACEMENT';
    }
    
    hookIndex++;
    wipFiber.hooks.push(hook);
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
    
    // 找到最近的有DOM节点的父节点
    let domParentFiber = fiber.parent;
    while (domParentFiber && !domParentFiber.dom) {
        domParentFiber = domParentFiber.parent;
    }
    const domParent = domParentFiber ? domParentFiber.dom : null;
    
    if (!domParent && fiber.dom) {
        return; // 如果找不到DOM父节点且当前fiber有DOM节点，则不处理
    }

    if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    }
    // 删除操作已经在commitRoot中处理
    
    // 递归子元素
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

// 处理删除操作
function commitDeletion(fiber) {
    if (!fiber) {
        return;
    }
    
    // 如果是函数组件，需要执行effect的清理函数
    if (fiber.type instanceof Function && fiber.hooks) {
        fiber.hooks.forEach(hook => {
            if (hook.tag === 'effect' && typeof hook.cleanup === 'function') {
                // 标记为删除，执行清理
                hook.effectTag = 'DELETION';
                hook.cleanup();
            }
        });
    }
    
    // 如果有DOM节点，找到父节点并删除
    if (fiber.dom) {
        let domParentFiber = fiber.parent;
        while (domParentFiber && !domParentFiber.dom) {
            domParentFiber = domParentFiber.parent;
        }
        if (domParentFiber && domParentFiber.dom) {
            domParentFiber.dom.removeChild(fiber.dom);
        }
    } else {
        // 递归处理子节点
        commitDeletion(fiber.child);
    }
    
    // 处理兄弟节点
    commitDeletion(fiber.sibling);
}

// 执行effects
function commitEffects(fiber) {
    if (!fiber) {
        return;
    }
    
    // 递归处理子节点和兄弟节点
    commitEffects(fiber.child);
    commitEffects(fiber.sibling);
    
    const componentFiber = fiber.type instanceof Function ? fiber : null;
    
    // 如果当前fiber是函数组件，执行其effects
    if (componentFiber) {
        // 执行需要清理的effects
        componentFiber.hooks && componentFiber.hooks.forEach(hook => {
            if (hook.tag === 'effect' && (hook.effectTag === 'UPDATE' || hook.effectTag === 'DELETION')) {
                // 如果有清理函数，执行它
                if (typeof hook.cleanup === 'function') {
                    hook.cleanup();
                }
            }
        });
        
        // 执行新的effects
        componentFiber.hooks && componentFiber.hooks.forEach(hook => {
            if (hook.tag === 'effect' && (hook.effectTag === 'PLACEMENT' || hook.effectTag === 'UPDATE')) {
                // 执行effect回调，并保存清理函数
                const cleanup = hook.callback();
                hook.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
            }
        });
    }
}

function commitRoot() {
    // 首先处理需要删除的节点
    deletions.forEach(commitDeletion);
    
    // 提交DOM更新
    commitWork(wipRoot.child);
    
    // 在DOM更新后执行effects
    commitEffects(wipRoot.child);
    
    currentRoot = wipRoot;
    deletions = [];
    // 清空wipRoot
    wipRoot = null;
    // 如果没有更多的工作，重置调度标志
    if (!nextUnitOfWork) {
        isRenderScheduled = false;
    }
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
    
    // 只有在有待处理工作时才调度新任务
    if (nextUnitOfWork || wipRoot) {
        scheduleTask(workLoop, performance.now());
    } else {
        // 当没有更多工作要做时，重置调度标志
        isRenderScheduled = false;
    }
}

function updateFunctionComponent(fiber) {
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }
    // 遍历子元素
    const elements = fiber.props.children;
    reconcileChildren(fiber, elements);
}

// 执行单元任务 执行一个单元任务, 并返回下一个单元任务
function performUnitOfWork(fiber) {
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }
    // 将dom添加到父元素
    // if (fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom);
    // }
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


export default {
    render,
    useState,
    useEffect
}