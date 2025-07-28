let _task = [];
let isPerformingTask = false; // 是否正在执行任务

const channel = new MessageChannel();
const port = channel.port2;

function myTask1() {
    console.log('Perform Task 1');
}

function myTask2() {
    console.log('Perform Task 2');
}

function myTask3() {
    console.log('Perform Task 3');
}

export function scheduleTask(task, expirationTime) {
    _task.push({
        task,
        expirationTime,
    });
    if (!isPerformingTask) {
        isPerformingTask = true;
        port.postMessage(null); // 发送消息，通知浏览器执行任务
    }
}

function performTask(currentTime) {
    const frameTime = 1000 / 120;
    while (_task.length > 0 && performance.now() - currentTime < frameTime && isPerformingTask) {
        const { task, expirationTime } = _task.shift();
        if (performance.now() >= expirationTime) {
            task({ currentTime, timeRemaining: () => performance.now() - currentTime });
        } else {
            scheduleTask(task, expirationTime);
        }
    }
    if (_task.length > 0) {
        requestAnimationFrame(performTask);
    } else {
        isPerformingTask = false;
    }
}

channel.port1.onmessage = () => requestAnimationFrame(performTask);



scheduleTask(myTask1, performance.now() + 1000);
scheduleTask(myTask2, performance.now());
scheduleTask(myTask3, performance.now() + 3000);

export default {
    scheduleTask
}