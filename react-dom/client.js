function render(element, container) {
    const dom = 
        element.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(element.type);

    const isProperty = name => name !== 'children' && !name.startsWith('on');
    const isEvent = name => name.startsWith('on');

    Object.keys(element.props).forEach(name => {
        if (isProperty(name)) {
            dom[name] = element.props[name];
        }
        if (isEvent(name)) {
            const eventType = name.toLowerCase().substring(2);
            dom.addEventListener(eventType, element.props[name]);
        }
    });

    element.props.children.forEach(child => {
        render(child, dom);
    });

    container.appendChild(dom);
}

export default {
    render
}