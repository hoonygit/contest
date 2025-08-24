import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getResultById } from '../services/storageService';
import { getAllQuestionsForResults } from '../services/questionService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Question } from '../types';

const ResultsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const result = id ? getResultById(id) : undefined;
    const reportRef = useRef<HTMLDivElement>(null);
    
    // Here we get the full static list to reliably match question IDs.
    const allQuestions = getAllQuestionsForResults();

    if (!result) {
        return <div className="text-center text-xl">테스트 결과를 찾을 수 없습니다.</div>;
    }

    const chartData = result.answers.map((ans, index) => ({
        name: `문항 ${index + 1}`,
        점수: ans.score,
    }));
    
    const getQuestionById = (questionId: number): Question | undefined => {
        return allQuestions.find(q => q.id === questionId);
    }

    const exportToPDF = () => {
        const input = reportRef.current;
        if (input) {
            html2canvas(input, { scale: 2 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                
                const ratio = canvasHeight / canvasWidth;
                const imgHeight = pdfWidth * ratio;
                
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;

                while (heightLeft > 0) {
                    position -= pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                    heightLeft -= pdfHeight;
                }

                pdf.save(`cognitive-test-result-${result.id}.pdf`);
            });
        }
    };
    
    const exportToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";

        // Add user info
        csvContent += "사용자 정보\r\n";
        csvContent += `이름,"${result.userInfo.name}"\r\n`;
        csvContent += `성별,"${result.userInfo.gender}"\r\n`;
        csvContent += `연령대,"${result.userInfo.ageGroup}"\r\n`;
        csvContent += `테스트 일시,"${new Date(result.timestamp).toLocaleString('ko-KR')}"\r\n`;
        csvContent += `총점,"${result.totalScore} / ${result.answers.length}"\r\n`;
        csvContent += "\r\n"; // Empty line for separation
        
        csvContent += "문항 번호,질문,사용자 답변,정답,점수,AI 평가\n";
        
        result.answers.forEach((ans, index) => {
            const question = getQuestionById(ans.questionId);
            const row = [
                index + 1,
                `"${question ? question.text.replace(/"/g, '""') : ''}"`,
                `"${ans.userAnswer.replace(/"/g, '""')}"`,
                `"${question ? question.correctAnswer.replace(/"/g, '""') : ''}"`,
                ans.score,
                `"${ans.explanation.replace(/"/g, '""')}"`
            ].join(',');
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `cognitive-test-result-${result.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const overallScore = result.answers.reduce((acc, curr) => acc + curr.score, 0);
    const totalQuestions = result.answers.length;

    return (
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
            <div ref={reportRef} className="p-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">테스트 결과 리포트</h1>
                <p className="text-gray-500 mb-6">
                    {new Date(result.timestamp).toLocaleString('ko-KR')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-center">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">이름</p>
                        <p className="text-lg font-semibold">{result.userInfo.name}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">성별</p>
                        <p className="text-lg font-semibold">{result.userInfo.gender}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">연령대</p>
                        <p className="text-lg font-semibold">{result.userInfo.ageGroup}</p>
                    </div>
                </div>

                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-lg mb-8">
                    <h2 className="text-xl font-semibold text-indigo-800 mb-2">종합 결과</h2>
                    <p className="text-3xl font-bold text-indigo-600">{overallScore} / {totalQuestions} 점</p>
                    <p className="text-indigo-700 mt-1">
                        총 {totalQuestions}개 문항 중 {overallScore}개를 맞추셨습니다.
                    </p>
                </div>
                
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">문항별 점수 그래프</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} domain={[0, 1]} ticks={[0, 1]}/>
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="점수" fill="#4f46e5" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">문항별 상세 결과</h2>
                    <div className="space-y-4">
                        {result.answers.map((answer, index) => {
                            const question = getQuestionById(answer.questionId);
                            return (
                                <div key={index} className={`p-4 rounded-lg border ${answer.score === 1 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                                    <h3 className="font-semibold text-lg mb-2">문항 {index + 1}: {question?.text}</h3>
                                    <p><strong>사용자 답변:</strong> <span className="text-gray-700">{answer.userAnswer}</span></p>
                                    <p><strong>기대 답변:</strong> <span className="text-gray-700">{question?.correctAnswer}</span></p>
                                    <p><strong>AI 평가:</strong> <span className="text-gray-700">{answer.explanation}</span></p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
                <button onClick={exportToCSV} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    <FileSpreadsheet className="w-5 h-5 mr-2" />
                    CSV로 저장
                </button>
                <button onClick={exportToPDF} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                    <FileText className="w-5 h-5 mr-2" />
                    PDF로 저장
                </button>
            </div>
        </div>
    );
};

export default ResultsPage;