import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TestPage from './pages/TestPage';
import ResultsPage from './pages/ResultsPage';
import StatisticsPage from './pages/StatisticsPage';
import DataManagementPage from './pages/DataManagementPage';
import { BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
    return (
        <HashRouter>
            <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
                <header className="bg-white shadow-md">
                    <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-indigo-600">
                             <BrainCircuit className="w-8 h-8" />
                            <span>Samsung Girls' High School Cognitive Insight AI</span>
                        </Link>
                        <div className="flex space-x-6">
                            <Link to="/" className="text-gray-600 hover:text-indigo-600 transition duration-300">홈</Link>
                            <Link to="/test" className="text-gray-600 hover:text-indigo-600 transition duration-300">테스트 수행</Link>
                            <Link to="/statistics" className="text-gray-600 hover:text-indigo-600 transition duration-300">결과 통계</Link>
                            <Link to="/data" className="text-gray-600 hover:text-indigo-600 transition duration-300">데이터 관리</Link>
                        </div>
                    </nav>
                </header>
                <main className="container mx-auto px-6 py-8">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/test" element={<TestPage />} />
                        <Route path="/results/:id" element={<ResultsPage />} />
                        <Route path="/statistics" element={<StatisticsPage />} />
                        <Route path="/data" element={<DataManagementPage />} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    );
};

export default App;
