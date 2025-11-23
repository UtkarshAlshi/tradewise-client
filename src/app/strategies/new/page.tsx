'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- 1. Define Types ---
interface StrategyCondition {
  indicatorA: string;
  indicatorAParams: { [key: string]: any };
  operator: string;
  indicatorBType: string;
  indicatorBValue: string;
  indicatorBParams: { [key: string]: any };
}

interface StrategyRule {
  action: string;
  actionAmountPercent: number;
  priority: number;
  conditions: StrategyCondition[];
}

interface CreateStrategyRequest {
  name: string;
  description: string;
  rules: StrategyRule[];
}

// --- 2. Define Constants for Dropdowns ---
const INDICATORS = [
  { value: 'PRICE', label: 'Price', needsPeriod: false },
  { value: 'SMA', label: 'SMA', needsPeriod: true },
  { value: 'EMA', label: 'EMA', needsPeriod: true },
  { value: 'RSI', label: 'RSI', needsPeriod: true },
];

const OPERATORS = [
  { value: 'GREATER_THAN', label: '>' },
  { value: 'LESS_THAN', label: '<' },
  { value: 'CROSSES_ABOVE', label: 'Crosses Above' },
  { value: 'CROSSES_BELOW', label: 'Crosses Below' },
];

const B_TYPES = [
  { value: 'VALUE', label: 'Number' },
  { value: 'INDICATOR', label: 'Indicator' },
];

// --- 3. Helper functions to create new items ---
const createNewCondition = (): StrategyCondition => ({
  indicatorA: 'PRICE',
  indicatorAParams: {},
  operator: 'GREATER_THAN',
  indicatorBType: 'VALUE',
  indicatorBValue: '0',
  indicatorBParams: {},
});

const createNewRule = (): StrategyRule => ({
  action: 'BUY',
  actionAmountPercent: 100,
  priority: 1,
  conditions: [createNewCondition()],
});

// --- 4. The Main Component ---
export default function NewStrategyPage() {
  const router = useRouter();
  const [strategy, setStrategy] = useState<CreateStrategyRequest>({
    name: '',
    description: '',
    rules: [createNewRule()],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- 5. State Helper Functions ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setStrategy({
      ...strategy,
      [e.target.name]: e.target.value,
    });
  };

  const addRule = () => {
    setStrategy({
      ...strategy,
      rules: [...strategy.rules, createNewRule()],
    });
  };

  const removeRule = (ruleIndex: number) => {
    setStrategy({
      ...strategy,
      rules: strategy.rules.filter((_, index) => index !== ruleIndex),
    });
  };

  const addCondition = (ruleIndex: number) => {
    const newRules = [...strategy.rules];
    newRules[ruleIndex].conditions.push(createNewCondition());
    setStrategy({ ...strategy, rules: newRules });
  };

  const removeCondition = (ruleIndex: number, condIndex: number) => {
    const newRules = [...strategy.rules];
    newRules[ruleIndex].conditions = newRules[ruleIndex].conditions.filter(
      (_, index) => index !== condIndex
    );
    setStrategy({ ...strategy, rules: newRules });
  };

  // --- Handle changes to a Rule (Action, Amount) ---
  const handleRuleChange = (
    ruleIndex: number,
    field: keyof StrategyRule,
    value: string | number
  ) => {
    const newRules = [...strategy.rules];
    (newRules[ruleIndex] as any)[field] = value;
    setStrategy({ ...strategy, rules: newRules });
  };

  // --- Handle changes to a Condition (Indicator, Operator, etc.) ---
  const handleConditionChange = (
    ruleIndex: number,
    condIndex: number,
    field: keyof StrategyCondition,
    value: string | number
  ) => {
    const newRules = [...strategy.rules];
    const condition = newRules[ruleIndex].conditions[condIndex];
    (condition as any)[field] = value;
    setStrategy({ ...strategy, rules: newRules });
  };
  
  // --- Handle changes to an Indicator's parameters (e.g., period) ---
  const handleParamChange = (
    ruleIndex: number,
    condIndex: number,
    paramSide: 'indicatorAParams' | 'indicatorBParams',
    paramName: string,
    value: string
  ) => {
    const newRules = [...strategy.rules];
    const condition = newRules[ruleIndex].conditions[condIndex];
    condition[paramSide][paramName] = parseInt(value) || 0;
    setStrategy({ ...strategy, rules: newRules });
  };

  // --- 6. Handle Form Submission ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(strategy),
      });

      if (res.ok) {
        // Success! Redirect back to the strategies list
        router.push('/strategies');
      } else {
        const errorMessage = await res.text();
        setError(`Error: ${errorMessage}`);
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  // --- 7. The Main Form JSX ---
  return (
    <div className="min-h-screen p-8">
      <nav className="mb-6">
        <Link href="/strategies" className="text-blue-400 hover:text-blue-300">
          &larr; Back to My Strategies
        </Link>
      </nav>

      <h1 className="text-4xl font-bold mb-8">Create New Strategy</h1>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* --- Strategy Details --- */}
        {/* ... (Same as before) ... */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Strategy Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={strategy.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={strategy.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600"
            />
          </div>
        </div>

        {/* --- The Dynamic Rules Builder --- */}
        <h2 className="text-2xl font-semibold mb-6">Rules</h2>
        {strategy.rules.map((rule, ruleIndex) => (
          <div key={ruleIndex} className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 relative">
            <button
              type="button"
              onClick={() => removeRule(ruleIndex)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-400 font-bold"
            >&times;</button>
            
            <h3 className="text-lg font-bold mb-4">
              IF ALL conditions are true...
            </h3>
            
            {/* --- Conditions --- */}
            {rule.conditions.map((condition, condIndex) => (
              <ConditionRow
                key={condIndex}
                condition={condition}
                onRemove={() => removeCondition(ruleIndex, condIndex)}
                onConditionChange={(field, value) => handleConditionChange(ruleIndex, condIndex, field, value)}
                onParamChange={(paramSide, paramName, value) => handleParamChange(ruleIndex, condIndex, paramSide, paramName, value)}
              />
            ))}
            
            <button
              type="button"
              onClick={() => addCondition(ruleIndex)}
              className="text-blue-400 hover:text-blue-300 text-sm mt-2"
            >+ Add Condition (AND)</button>
            
            {/* --- Action (THEN) --- */}
            <h3 className="text-lg font-bold mb-4 mt-6">THEN...</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
                <select
                  value={rule.action}
                  onChange={(e) => handleRuleChange(ruleIndex, 'action', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (%)</label>
                <input
                  type="number"
                  value={rule.actionAmountPercent}
                  onChange={(e) => handleRuleChange(ruleIndex, 'actionAmountPercent', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                />
              </div>
            </div>
          </div>
        ))}
        
        {/* We can disable adding more rules for our MVP to keep it simple */}
        {/* <button type="button" onClick={addRule} ... >+ Add New Rule (OR)</button> */}

        {/* --- Save Button --- */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md transition duration-200 disabled:bg-gray-500"
          >
            {loading ? 'Saving...' : 'Save Strategy'}
          </button>
          {error && <p className="text-center mt-4 text-red-400">{error}</p>}
        </div>
      </form>
    </div>
  );
}

// --- 8. The Reusable ConditionRow Component ---
interface ConditionRowProps {
  condition: StrategyCondition;
  onRemove: () => void;
  onConditionChange: (field: keyof StrategyCondition, value: string) => void;
  onParamChange: (paramSide: 'indicatorAParams' | 'indicatorBParams', paramName: string, value: string) => void;
}

function ConditionRow({ condition, onRemove, onConditionChange, onParamChange }: ConditionRowProps) {
  
  const indicatorAInfo = INDICATORS.find(i => i.value === condition.indicatorA);
  const indicatorBInfo = INDICATORS.find(i => i.value === condition.indicatorBValue);

  return (
    <div className="bg-gray-700 p-4 rounded-md mb-4 flex items-center gap-2 flex-wrap">
      <span className="text-lg font-mono">IF</span>

      {/* --- Indicator A --- */}
      <div className="flex gap-2">
        <select
          value={condition.indicatorA}
          onChange={(e) => onConditionChange('indicatorA', e.target.value)}
          className="px-3 py-2 bg-gray-600 text-white rounded-md"
        >
          {INDICATORS.map(ind => (
            <option key={ind.value} value={ind.value}>{ind.label}</option>
          ))}
        </select>
        {indicatorAInfo?.needsPeriod && (
          <input
            type="number"
            placeholder="Period"
            value={condition.indicatorAParams.period || ''}
            onChange={(e) => onParamChange('indicatorAParams', 'period', e.target.value)}
            className="w-20 px-3 py-2 bg-gray-600 text-white rounded-md"
          />
        )}
      </div>

      {/* --- Operator --- */}
      <select
        value={condition.operator}
        onChange={(e) => onConditionChange('operator', e.target.value)}
        className="px-3 py-2 bg-gray-600 text-white rounded-md"
      >
        {OPERATORS.map(op => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>

      {/* --- Indicator B Type --- */}
      <select
        value={condition.indicatorBType}
        onChange={(e) => onConditionChange('indicatorBType', e.target.value)}
        className="px-3 py-2 bg-gray-600 text-white rounded-md"
      >
        {B_TYPES.map(type => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </select>

      {/* --- Indicator B (Value or Indicator) --- */}
      {condition.indicatorBType === 'VALUE' ? (
        <input
          type="number"
          value={condition.indicatorBValue}
          onChange={(e) => onConditionChange('indicatorBValue', e.target.value)}
          className="w-24 px-3 py-2 bg-gray-600 text-white rounded-md"
        />
      ) : (
        <div className="flex gap-2">
          <select
            value={condition.indicatorBValue}
            onChange={(e) => onConditionChange('indicatorBValue', e.target.value)}
            className="px-3 py-2 bg-gray-600 text-white rounded-md"
          >
            {INDICATORS.map(ind => (
              <option key={ind.value} value={ind.value}>{ind.label}</option>
            ))}
          </select>
          {indicatorBInfo?.needsPeriod && (
            <input
              type="number"
              placeholder="Period"
              value={condition.indicatorBParams.period || ''}
              onChange={(e) => onParamChange('indicatorBParams', 'period', e.target.value)}
              className="w-20 px-3 py-2 bg-gray-600 text-white rounded-md"
            />
          )}
        </div>
      )}

      <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-400 font-bold ml-auto">&times;</button>
    </div>
  );
}