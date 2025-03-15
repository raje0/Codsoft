let display = document.getElementById('display');
let currentExpression = '';
let lastResult = null;

function appendNumber(num) {
    if (lastResult !== null) {
        currentExpression = '';
        lastResult = null;
    }
    currentExpression += num;
    display.value = currentExpression;
}

function appendOperator(operator) {
    if (currentExpression === '' && lastResult !== null) {
        currentExpression = lastResult;
    }
    currentExpression += operator;
    display.value = currentExpression;
    lastResult = null;
}

function clearDisplay() {
    currentExpression = '';
    lastResult = null;
    display.value = '';
}

function calculate() {
    try {
        lastResult = eval(currentExpression);
        display.value = lastResult;
        currentExpression = '';
    } catch (error) {
        display.value = 'Error';
        currentExpression = '';
        lastResult = null;
    }
}