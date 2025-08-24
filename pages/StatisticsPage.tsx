
import React, { useMemo, useState } from 'react';
import { getAllResults } from '../services/storageService';
import { getAllQuestionsForResults } from '../services/questionService';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserInfo } from '../types';

// Define a type for the processed statistics structure
type CategoryStats = { [category: string]: { correct: number; total: number } };
type ProcessedStats = Map<string, CategoryStats>;

const AGE_GROUP_ORDER: UserInfo['ageGroup'][] = ['10대', '20대', '30대', '40대', '50대', '60대', '70대 이상'];
const GENDER_ORDER: UserInfo['gender'][] = ['남성', '여성', '기타'];

const StatisticsPage: React.FC = () => {
    const allResults = getAllResults();
    const allQuestions = useMemo(() => getAllQuestionsForResults(), []);

    const [selectedAge, setSelectedAge] = useState('All');
    const [selectedGender, setSelectedGender] = useState('All');
    
    const questionIdToCategory = useMemo(() => {
        return new Map(allQuestions.map(q => [q.id, q.category]));
    }, [allQuestions]);

    const categories = useMemo(() => {
        const categoryOrder = ['지남력', '기억력', '주의집중 및 계산', '언어 기능', '집행 기능', '이름대기'];
        const uniqueCategories = Array.from(new Set(allQuestions.map(q => q.category)));
        return uniqueCategories.sort((a, b) => {
            const indexA = categoryOrder.indexOf(a);
            const indexB = categoryOrder.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [allQuestions]);

    const processedStats = useMemo<ProcessedStats>(() => {
        const stats: ProcessedStats = new Map();

        const initCategoryStats = (): CategoryStats => {
            const catStats: CategoryStats = {};
            categories.forEach(cat => {
                catStats[cat] = { correct: 0, total: 0 };
            });
            return catStats;
        };

        for (const result of allResults) {
            const { ageGroup, gender } = result.userInfo;
            const keys = [
                'All|All',
                `${ageGroup}|All`,
                `All|${gender}`,
                `${ageGroup}|${gender}`
            ];

            keys.forEach(key => {
                if (!stats.has(key)) {
                    stats.set(key, initCategoryStats());
                }
            });

            for (const answer of result.answers) {
                const category = questionIdToCategory.get(answer.questionId);
                if (category) {
                    keys.forEach(key => {
                        const groupStats = stats.get(key)!;
                        groupStats[category].total += 1;
                        groupStats[category].correct += answer.score;
                    });
                }
            }
        }
        return stats;
    }, [allResults, categories, questionIdToCategory]);

    const chartData = useMemo(() => {
        const overallStats = processedStats.get('All|All');
        const selectedKey = `${selectedAge}|${selectedGender}`;
        const selectedStats = processedStats.get(selectedKey);

        if (!selectedStats || !overallStats) {
            return [];
        }

        return categories.map(cat => {
            const overallCorrect = overallStats[cat]?.correct ?? 0;
            const overallTotal = overallStats[cat]?.total ?? 0;
            const selectedCorrect = selectedStats[cat]?.correct ?? 0;
            const selectedTotal = selectedStats[cat]?.total ?? 0;

            const hasSelectedData = selectedTotal > 0;

            return {
                category: cat,
                '전체 평균': overallTotal > 0 ? parseFloat(((overallCorrect / overallTotal) * 100).toFixed(1)) : 0,
                '선택 그룹': hasSelectedData ? parseFloat(((selectedCorrect / selectedTotal) * 100).toFixed(1)) : 0,
                hasData: hasSelectedData
            };
        });
    }, [processedStats, selectedAge, selectedGender, categories]);
    
    const hasDataForSelection = chartData.some(d => d.hasData);

    const availableAgeGroups = useMemo(() => ['All', ...AGE_GROUP_ORDER], []);
    const availableGenders = useMemo(() => ['All', ...GENDER_ORDER], []);


    if (allResults.length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-xl text-center">
                <h1 className="text-2xl font-bold text-gray-700">통계 데이터가 없습니다.</h1>
                <p className="text-gray-500 mt-2">테스트를 먼저 진행해주세요.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">결과 통계 분석</h1>
            <p className="mb-6 text-gray-600">
                총 <span className="font-bold text-indigo-600">{allResults.length}</span>건의 테스트 결과를 바탕으로,
                선택한 그룹과 전체 사용자 그룹의 인지 영역별 평균 점수(백분율)를 비교합니다.
            </p>

            <div className="flex flex-wrap gap-4 p-4 mb-8 bg-gray-50 rounded-lg border">
                <div>
                    <label htmlFor="age-select" className="block text-sm font-medium text-gray-700 mb-1">연령대</label>
                    <select
                        id="age-select"
                        value={selectedAge}
                        onChange={(e) => setSelectedAge(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {availableAgeGroups.map(age => <option key={age} value={age}>{age === 'All' ? '전체' : age}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="gender-select" className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                    <select
                        id="gender-select"
                        value={selectedGender}
                        onChange={(e) => setSelectedGender(e.target.value)}
                         className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {availableGenders.map(gender => <option key={gender} value={gender}>{gender === 'All' ? '전체' : gender}</option>)}
                    </select>
                </div>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">인지 영역별 평균 점수 비교 (%)</h2>

            {hasDataForSelection ? (
                <ResponsiveContainer width="100%" height={500}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Radar name="선택 그룹" dataKey="선택 그룹" stroke="#818cf8" fill="#818cf8" fillOpacity={0.6} />
                        <Radar name="전체 평균" dataKey="전체 평균" stroke="#34d399" fill="#34d399" fillOpacity={0.6} />
                    </RadarChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-center text-gray-500 py-16">
                    <p>선택된 그룹에 대한 데이터가 없습니다.</p>
                </div>
            )}
        </div>
    );
};

export default StatisticsPage;
