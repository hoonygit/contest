import React, { useRef } from 'react';
import { getAllResults, replaceAllResults } from '../services/storageService';
import { TestResult } from '../types';
import { Download, Upload } from 'lucide-react';

const DataManagementPage: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = async () => {
        const results = getAllResults();
        if (results.length === 0) {
            alert('백업할 데이터가 없습니다.');
            return;
        }
        try {
            const dataStr = JSON.stringify(results, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, '');
            const suggestedFileName = `cognitive_insight_ai_backup_${timestamp}.json`;

            // Use File System Access API if available for a better user experience
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await (window as any).showSaveFilePicker({
                        suggestedName: suggestedFileName,
                        types: [{
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(dataBlob);
                    await writable.close();
                    alert('데이터 백업이 성공적으로 지정된 경로에 저장되었습니다.');
                } catch (err: any) {
                    // AbortError is thrown when the user cancels the file picker.
                    // We don't need to show an error message in that case.
                    if (err.name !== 'AbortError') {
                        console.error("Backup failed using File System Access API:", err);
                        alert('데이터 백업 중 오류가 발생했습니다.');
                    }
                }
            } else {
                // Fallback for browsers that do not support the API
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = suggestedFileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                alert('데이터 백업이 완료되었습니다. 파일이 다운로드 폴더에 저장됩니다.');
            }
        } catch (error) {
            console.error("Backup failed:", error);
            alert('데이터 백업 중 오류가 발생했습니다.');
        }
    };
    
    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error('파일을 읽을 수 없습니다.');
                }
                const data = JSON.parse(text);

                // Basic validation
                if (!Array.isArray(data) || (data.length > 0 && (typeof data[0].id === 'undefined' || typeof data[0].userInfo === 'undefined'))) {
                    throw new Error('유효하지 않은 백업 파일 형식입니다. 파일이 손상되었거나 잘못된 파일일 수 있습니다.');
                }

                if (window.confirm(`총 ${data.length}개의 테스트 결과를 복원하시겠습니까? \n주의: 현재 저장된 모든 데이터는 덮어씌워집니다.`)) {
                    replaceAllResults(data as TestResult[]);
                    alert('데이터 복원이 완료되었습니다. 변경 사항을 적용하기 위해 페이지를 새로고침합니다.');
                    window.location.reload();
                }
            } catch (error: any) {
                alert(`복원 중 오류가 발생했습니다: ${error.message}`);
            } finally {
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.onerror = () => {
            alert('파일을 읽는 중 오류가 발생했습니다.');
            if (event.target) {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-12 rounded-lg shadow-xl max-w-2xl w-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">데이터 백업 및 복원</h1>
                <p className="text-gray-600 mb-8">
                    테스트 결과를 파일로 내보내거나, 파일에서 가져올 수 있습니다.
                </p>
                
                <div className="space-y-6 text-left">
                    {/* Backup Section */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                            <Download className="w-6 h-6 mr-3 text-blue-500" />
                            데이터 백업
                        </h3>
                        <p className="text-gray-600 mb-4">
                            모든 테스트 결과를 하나의 JSON 파일로 저장합니다. 이 파일을 안전한 곳에 보관하세요.
                        </p>
                        <button onClick={handleBackup} className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300">
                            백업 파일 다운로드
                        </button>
                    </div>

                    {/* Restore Section */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                            <Upload className="w-6 h-6 mr-3 text-green-500" />
                            데이터 복원
                        </h3>
                        <p className="text-gray-600 mb-4">
                            이전에 백업한 JSON 파일을 선택하여 데이터를 복원합니다. <span className="font-bold text-red-500">주의: 현재 저장된 모든 데이터는 복원된 데이터로 대체됩니다.</span>
                        </p>
                        <button onClick={handleRestoreClick} className="w-full flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300">
                            백업 파일에서 복원
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManagementPage;