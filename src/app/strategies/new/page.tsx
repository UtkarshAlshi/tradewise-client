'use client';

import { useState } from 'react';
// import { useRouter } from 'next/navigation'; // Removed for compilation
// import Link from 'next/link'; // Removed for compilation

// --- 1. Define Frontend Types (must match backend DTOs) ---
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

// --- Constants for our form dropdowns ---
const INDICATORS = ['PRICE', 'SMA', 'EMA', 'RSI'];
const OPERATORS = ['GREATER_THAN', 'LESS_THAN', 'CROSSES_ABOVE', 'CROSSES_BELOW'];
const INDICATOR_B_TYPES = ['VALUE', 'INDICATOR'];

// --- Helper functions to create new, empty items ---
const createNewCondition = (): StrategyCondition => ({
  indicatorA: 'PRICE',
  indicatorAParams: { period: 14 }, // Default params
  operator: 'GREATER_THAN',
  indicatorBType: 'VALUE',
  indicatorBValue: '70',
  indicatorBParams: { period: 50 }, // Default params
});

const createNewRule = (): StrategyRule => ({
  action: 'BUY',
  actionAmountPercent: 100,
  priority: 1,
  conditions: [createNewCondition()],
});

// --- Component to render indicator parameters ---
const IndicatorParamsInput = ({
  params,
  onChange,
}: {
  params: { [key: string]: any };
  onChange: (key: string, value: any) => void;
}) => {
  // Only show 'period' input for now
  if (params.hasOwnProperty('period')) {
    return (
      <input
        type="number"
        value={params.period}
        onChange={(e) => onChange('period', parseInt(e.target.value) || 0)}
        className="w-20 px-2 py-1 bg-gray-600 text-white rounded-md text-sm"
        placeholder="Period"
      />
    );
  }
  return null; // No params needed for 'PRICE'
};

export default function NewStrategyPage() {
  // FIX: Use simple browser redirect to avoid build error
  const router = {
    push: (path: string) => {
      window.location.href = path;
    },
  };
  const [strategy, setStrategy] = useState<CreateStrategyRequest>({
    name: '',
    description: '',
    rules: [createNewRule()], // Start with one empty rule
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- 2. State Helper Functions ---

  // Handle simple text inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setStrategy({
      ...strategy,
      [e.target.name]: e.target.value,
    });
  };

  const handleRuleChange = (
    ruleIndex: number,
    field: string,
    value: string | number
  ) => {
    const newRules = [...strategy.rules];
    // Create a new object for the rule to ensure state update
    const updatedRule = { ...newRules[ruleIndex], [field]: value };
    newRules[ruleIndex] = updatedRule;
    setStrategy({ ...strategy, rules: newRules });
  };
  
  const handleConditionChange = (
    ruleIndex: number,
    condIndex: number,
    field: string,
    value: string | number
  ) => {
    const newRules = [...strategy.rules];
    const newConditions = [...newRules[ruleIndex].conditions];
    const newCondition = { ...newConditions[condIndex], [field]: value };

    // If changing indicator, reset params
    if (field === 'indicatorA' || (field === 'indicatorBValue' && newCondition.indicatorBType === 'INDICATOR')) {
      const needsParams = ['SMA', 'EMA', 'RSI'].includes(value as string);
      const paramField = field === 'indicatorA' ? 'indicatorAParams' : 'indicatorBParams';
      
      // Only reset if it needs params
      if (needsParams) {
        newCondition[paramField] = { period: 14 }; 
      } else {
        newCondition[paramField] = {};
      }
    }

    // If changing type to VALUE, clear indicatorBParams
    if(field === 'indicatorBType' && value === 'VALUE') {
      newCondition.indicatorBParams = {};
    }
    
    newConditions[condIndex] = newCondition;
    newRules[ruleIndex].conditions = newConditions;
    setStrategy({ ...strategy, rules: newRules });
  };
  
  const handleConditionParamChange = (
    ruleIndex: number,
    condIndex: number,
    paramSide: 'A' | 'B',
    key: string,
    value: any
  ) => {
    const newRules = [...strategy.rules];
    const newConditions = [...newRules[ruleIndex].conditions];
    const newCondition = { ...newConditions[condIndex] };

    if (paramSide === 'A') {
      newCondition.indicatorAParams = { ...newCondition.indicatorAParams, [key]: value };
    } else {
      newCondition.indicatorBParams = { ...newCondition.indicatorBParams, [key]: value };
    }

    newConditions[condIndex] = newCondition;
    newRules[ruleIndex].conditions = newConditions;
    setStrategy({ ...strategy, rules: newRules });
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

  // --- THIS IS THE UPDATED SUBMIT FUNCTION ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to create a strategy.');
      setLoading(false);
      return;
    }

    // Clean up params based on indicator type
    const cleanedStrategy = {
      ...strategy,
      rules: strategy.rules.map(rule => ({
        ...rule,
        conditions: rule.conditions.map(cond => {
          const cleanCond = { ...cond };
          if (cleanCond.indicatorA === 'PRICE') {
            cleanCond.indicatorAParams = {};
          }
          if (cleanCond.indicatorBType === 'VALUE') {
            cleanCond.indicatorBParams = {};
          } else if (cleanCond.indicatorBType === 'INDICATOR' && cleanCond.indicatorBValue === 'PRICE') {
            cleanCond.indicatorBParams = {};
          }
          return cleanCond;
        })
      }))
    };

    console.log('Strategy to submit:', JSON.stringify(cleanedStrategy, null, 2));
    
    try {
      const res = await fetch('http://localhost:8080/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedStrategy), // Send the cleaned object
      });

      if (res.ok) {
        // Success! Redirect back to the strategies list
        router.push('/strategies');
      } else {
        // Handle errors from the backend
        const errorData = await res.json();
        setError(errorData.message || 'Failed to create strategy.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };
  // --- END OF UPDATE ---

  return (
    <div className="min-h-screen p-8">
      <nav className="mb-6">
        {/* FIX: Use 'a' tag to avoid 'next/link' build error */}
        <a href="/strategies" className="text-blue-400 hover:text-blue-300">
          &larr; Back to My Strategies
        </a>
      </nav>

      <h1 className="text-4xl font-bold mb-8">Create New Strategy</h1>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* --- Strategy Details --- */}
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

        {/* --- 4. The Dynamic Rules Builder --- */}
        <h2 className="text-2xl font-semibold mb-6">Rules</h2>
        {strategy.rules.map((rule, ruleIndex) => (
          <div key={ruleIndex} className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 relative">
            <button
              type="button"
              onClick={() => removeRule(ruleIndex)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-400 font-bold"
            >
              &times;
            </button>
            
            <h3 className="text-lg font-bold mb-4">
              Rule #{ruleIndex + 1}
            </h3>
            
            {/* --- Action --- */}
            <div className="grid grid-cols-2 gap-4 mb-4">
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
                  onChange={(e) => handleRuleChange(ruleIndex, 'actionAmountPercent', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                />
              </div>
            </div>

            {/* --- Conditions --- */}
            <h4 className="text-md font-semibold mb-4 text-blue-300">
              Conditions (IF ALL are true):
            </h4>
            
            {rule.conditions.map((condition, condIndex) => (
              <div key={condIndex} className="bg-gray-700 p-4 rounded-md mb-4 flex items-center gap-2 flex-wrap">
                <span className="text-lg font-mono">IF</span>
                
                {/* Indicator A */}
                <div className="flex gap-2 items-center">
                  <select
                    value={condition.indicatorA}
                    onChange={(e) => handleConditionChange(ruleIndex, condIndex, 'indicatorA', e.target.value)}
                    className="px-3 py-2 bg-gray-600 text-white rounded-md"
                  >
                    {INDICATORS.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                  {['SMA', 'EMA', 'RSI'].includes(condition.indicatorA) && (
                    <IndicatorParamsInput
                      params={condition.indicatorAParams}
                      onChange={(key, value) => handleConditionParamChange(ruleIndex, condIndex, 'A', key, value)}
                    />
                  )}
                </div>

                {/* Operator */}
                <select
                  value={condition.operator}
                  onChange={(e) => handleConditionChange(ruleIndex, condIndex, 'operator', e.target.value)}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md"
                >
                  {OPERATORS.map(op => <option key={op} value={op}>{op.replace('_', ' ')}</option>)}
                </select>

                {/* Indicator B Type (Dropdown) */}
                <select
                  value={condition.indicatorBType}
                  onChange={(e) => handleConditionChange(ruleIndex, condIndex, 'indicatorBType', e.target.value)}
                  className="px-3 py-2 bg-gray-600 text-white rounded-md"
                >
                  {INDICATOR_B_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>

                {/* Indicator B (Conditional Input) */}
                <div className="flex gap-2 items-center">
                  {condition.indicatorBType === 'VALUE' ? (
                    <input
                      type="number"
                      value={condition.indicatorBValue}
                      onChange={(e) => handleConditionChange(ruleIndex, condIndex, 'indicatorBValue', e.target.value)}
                      className="w-24 px-3 py-2 bg-gray-600 text-white rounded-md"
                    />
                  ) : (
                    <>
                      <select
                        value={condition.indicatorBValue}
                        onChange={(e) => handleConditionChange(ruleIndex, condIndex, 'indicatorBValue', e.target.value)}
                        className="px-3 py-2 bg-gray-600 text-white rounded-md"
                      >
                        {INDICATORS.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                      </select>
                      {['SMA', 'EMA', 'RSI'].includes(condition.indicatorBValue) && (
                        <IndicatorParamsInput
                          params={condition.indicatorBParams}
                          onChange={(key, value) => handleConditionParamChange(ruleIndex, condIndex, 'B', key, value)}
                        />
                      )}
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeCondition(ruleIndex, condIndex)}
                  className="text-red-500 hover:text-red-400 font-bold ml-auto"
                >
                  &times;
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addCondition(ruleIndex)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              + Add Condition
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addRule}
          className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md transition duration-200"
        >
          + Add New Rule
        </button>

        {/* --- 5. Save Button --- */}
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

