
import React, { useMemo } from 'react';
import { getAllResults } from '../services/storageService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TestResult } from '../types';

interface GroupedData {
  [key: string]: {
    totalScore: number;
    count: number;
  };
}

const StatisticsPage: React.FC = () => {
    const allResults = getAllResults();

    const statsByAge = useMemo(() => {
        if (!allResults.length) return [];
        const grouped = allResults.reduce<GroupedData>((acc, result) => {
            const ageGroup = result.userInfo.ageGroup;
            if (!acc[ageGroup]) {
                acc[ageGroup] = { totalScore: 0, count: 0 };
            }
            acc[ageGroup].totalScore += result.totalScore;
            acc[ageGroup].count++;
            return acc;
        }, {});
        
        return Object.entries(grouped).map(([name, data]) => ({
            name,
            '평균 점수': parseFloat((data.totalScore / data.count).toFixed(2))
        })).sort((a,b) => a.name.localeCompare(b.name));

    }, [allResults]);

    const statsByGender = useMemo(() => {
        if (!allResults.length) return [];
        const grouped = allResults.reduce<GroupedData>((acc, result) => {
            const gender = result.userInfo.gender;
            if (!acc[gender]) {
                acc[gender] = { totalScore: 0, count: 0 };
            }
            acc[gender].totalScore += result.totalScore;
            acc[gender].count++;
            return acc;
        }, {});
        
        return Object.entries(grouped).map(([name, data]) => ({
            name,
            '평균 점수': parseFloat((data.totalScore / data.count).toFixed(2))
        }));

    }, [allResults]);

    if (allResults.length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-xl text-center">
                <h1 className="text-2xl font-bold text-gray-700">통계 데이터가 없습니다.</h1>
                <p className="text-gray-500 mt-2">테스트를 먼저 진행해주세요.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-12">
            <div className="bg-white p-8 rounded-lg shadow-xl">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">전체 결과 통계</h1>
                <p className="mb-8 text-gray-600">총 <span className="font-bold text-indigo-600">{allResults.length}</span>건의 테스트 결과가 누적되었습니다.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">연령대별 평균 점수</h2>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={statsByAge}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 10]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="평균 점수" fill="#818cf8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">성별 평균 점수</h2>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={statsByGender}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 10]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="평균 점수" fill="#34d399" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPage;
