
import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, BarChart2, AlertTriangle, CheckCircle } from 'lucide-react';

const HomePage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-white p-12 rounded-lg shadow-xl max-w-4xl w-full">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">섬성 여고 AI 인지 능력 평가 서비스</h1>
                <p className="text-lg text-gray-600 mb-8">
                    삼성여고 AI 인지  능력 평가 서비스는 음성 기반 상호작용을 통해 사용자의 인지 능력을 평가하는 서비스입니다.
                    테스트를 통해 자신의 인지 상태를 확인하고, 종합적인 통계 데이터를 통해 다른 사용자 그룹과 비교 분석해볼 수 있습니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <Link to="/test" className="group bg-indigo-500 text-white p-8 rounded-lg hover:bg-indigo-600 transition duration-300 transform hover:scale-105 shadow-lg">
                        <PlayCircle className="w-16 h-16 mx-auto mb-4 text-indigo-200 group-hover:text-white" />
                        <h2 className="text-2xl font-semibold mb-2">테스트 수행</h2>
                        <p className="text-indigo-100">음성 안내에 따라 인지 능력 평가 테스트를 시작합니다.</p>
                    </Link>
                    <Link to="/statistics" className="group bg-teal-500 text-white p-8 rounded-lg hover:bg-teal-600 transition duration-300 transform hover:scale-105 shadow-lg">
                        <BarChart2 className="w-16 h-16 mx-auto mb-4 text-teal-200 group-hover:text-white" />
                        <h2 className="text-2xl font-semibold mb-2">결과 리포팅 통계</h2>
                        <p className="text-teal-100">성별, 연령대별 전체 사용자 통계 및 분석 결과를 확인합니다.</p>
                    </Link>
                </div>

                <div className="text-left bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                        <AlertTriangle className="w-6 h-6 mr-3 text-yellow-500" />
                        주의사항
                    </h3>
                    <ul className="space-y-3 text-gray-600">
                        <li className="flex items-start">
                            <CheckCircle className="w-5 h-5 mr-2 mt-1 text-green-500 flex-shrink-0" />
                            <span>본 테스트는 전문적인 의학적 진단을 대체할 수 없습니다. 결과에 대한 우려가 있을 경우, 반드시 전문의와 상담하시기 바랍니다.</span>
                        </li>
                        <li className="flex items-start">
                            <CheckCircle className="w-5 h-5 mr-2 mt-1 text-green-500 flex-shrink-0" />
                            <span>정확한 음성 인식을 위해 조용한 환경에서 테스트를 진행해 주시고, 마이크 사용 권한을 허용해 주셔야 합니다.</span>
                        </li>
                         <li className="flex items-start">
                            <CheckCircle className="w-5 h-5 mr-2 mt-1 text-green-500 flex-shrink-0" />
                            <span>각 문항에 대해 충분히 생각하신 후, 명확한 발음으로 답변해 주세요.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
