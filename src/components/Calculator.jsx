import { useState } from 'react';

const Calculator = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(true);
  const [calculated, setCalculated] = useState(false);

  const clearAll = () => {
    setDisplay('0');
    setExpression('');
    setWaitingForOperand(true);
    setCalculated(false);
  };

  const inputDigit = (digit) => {
    if (calculated) {
      setDisplay(String(digit));
      setExpression(String(digit));
      setCalculated(false);
    } else if (waitingForOperand) {
      setDisplay(String(digit));
      setExpression(expression + digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit);
      setExpression(expression + digit);
    }
  };

  const inputDot = () => {
    if (calculated) {
      setDisplay('0.');
      setExpression('0.');
      setCalculated(false);
      setWaitingForOperand(false);
    } else if (waitingForOperand) {
      setDisplay('0.');
      setExpression(expression + '0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
      setExpression(expression + '.');
    }
  };

  const performOperation = (nextOperator) => {
    if (calculated) {
      setExpression(display + nextOperator);
    } else {
      setExpression(expression + nextOperator);
    }
    setDisplay(nextOperator);
    setWaitingForOperand(true);
    setCalculated(false);
  };

  const handleEquals = () => {
    try {
      const evalExpression = expression.replace(/×/g, '*').replace(/÷/g, '/');
      const result = eval(evalExpression);
      
      setDisplay(String(result));
      setExpression(`${expression}=${result}`);
      setWaitingForOperand(true);
      setCalculated(true);
    } catch (error) {
      setDisplay('Error');
      setWaitingForOperand(true);
      setCalculated(true);
    }
  };

  const calculateSqrt = () => {
    const inputValue = parseFloat(display);
    const result = Math.sqrt(inputValue);
    setDisplay(String(result));
    setExpression(`√(${display})=${result}`);
    setWaitingForOperand(true);
    setCalculated(true);
  };

  const calculatePower = () => {
    const inputValue = parseFloat(display);
    const result = Math.pow(inputValue, 2);
    setDisplay(String(result));
    setExpression(`${display}²=${result}`);
    setWaitingForOperand(true);
    setCalculated(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 w-64 mt-3 mx-auto shadow-md">
      <div className="p-2">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-bold dark:text-white">Scientific Calculator</h3>
          <button 
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center text-xs"
          >
            ×
          </button>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded mb-1 h-12">
          <div className="text-xs text-gray-500 dark:text-gray-400 h-4 overflow-hidden">{expression}</div>
          <div className="text-right text-lg font-mono truncate">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-0.5">
          <button onClick={clearAll} className="bg-red-500 text-white text-xs py-1 rounded hover:bg-red-600">C</button>
          <button onClick={calculateSqrt} className="bg-gray-300 dark:bg-gray-700 text-xs py-1 rounded">√</button>
          <button onClick={calculatePower} className="bg-gray-300 dark:bg-gray-700 text-xs py-1 rounded">x²</button>
          <button onClick={() => performOperation('/')} className="bg-orange-400 text-white text-xs py-1 rounded">÷</button>

          <button onClick={() => inputDigit(7)} className="bg-gray-200 dark:bg-gray-600 text-xs py-1 rounded">7</button>
          <button onClick={() => inputDigit(8)} className="bg-gray-200 dark:bg-gray-600 text-xs py-1 rounded">8</button>
          <button onClick={() => inputDigit(9)} className="bg-gray-200 dark:bg-gray-600 text-xs py-1 rounded">9</button>
          <button onClick={() => performOperation('*')} className="bg-orange-400 text-white text-xs py-1 rounded">×</button>

          <button onClick={() => inputDigit(4)} className="bg-gray-200 dark:bg-gray-600 text-xs py-1 rounded">4</button>
          <button onClick={() => inputDigit(5)} className="bg-gray-200 dark:bg-gray-600 text-xs py-1 rounded">5</button>
          <button onClick={() => inputDigit(6)} className="bg-gray-200 dark:bg-gray-600 text-xs py-1 rounded">6</button>
          <button onClick={() => performOperation('-')} className="bg-orange-400 text-white text-xs py-1 rounded">−</button>

          <button onClick={() => inputDigit(1)} className="bg-gray-200 dark:bg-gray-600 text-xs py-1 rounded">1</button>
          <button onClick={() => inputDigit(2)} className="bg-gray-200 dark:bg-gray-600 text-xs py-1 rounded">2</button>
          <button onClick={() => inputDigit(3)} className="bg-gray-200 dark:bg-gray-600 text-xs py-1 rounded">3</button>
          <button onClick={() => performOperation('+')} className="bg-orange-400 text-white text-xs py-1 rounded">+</button>

          <button onClick={() => inputDigit(0)} className="bg-gray-200 dark:bg-gray-600 text-xs py-1 rounded col-span-2">0</button>
          <button onClick={inputDot} className="bg-gray-200 dark:bg-gray-600 text-xs py-1 rounded">.</button>
          <button onClick={handleEquals} className="bg-orange-500 text-white text-xs py-1 rounded">=</button>
        </div>
      </div>
    </div>
  );
};

export default Calculator;