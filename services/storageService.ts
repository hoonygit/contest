import { TestResult } from '../types';

const RESULTS_KEY = 'cognitiveTestResults';

export const saveResult = (result: TestResult): void => {
    const results = getAllResults();
    results.push(result);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
};

export const getAllResults = (): TestResult[] => {
    const resultsJson = localStorage.getItem(RESULTS_KEY);
    return resultsJson ? JSON.parse(resultsJson) : [];
};

export const getResultById = (id: string): TestResult | undefined => {
    const results = getAllResults();
    return results.find(result => result.id === id);
};

export const replaceAllResults = (results: TestResult[]): void => {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
};
