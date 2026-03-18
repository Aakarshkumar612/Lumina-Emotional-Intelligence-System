import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/lumina/Sidebar';
import { NewSession } from '@/components/lumina/NewSession';
import { History, type HistoryEntry } from '@/components/lumina/History';
import { About } from '@/components/lumina/About';
import type { PredictionResult } from '@/api/emotionApi';

type Page = 'session' | 'history' | 'about';

const STORAGE_KEY = 'lumina-history';

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>('session');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const handleResult = useCallback((res: PredictionResult, formData: Record<string, any>) => {
    setResult(res);
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      result: res,
      journalText: formData.journalText || '',
      timestamp: new Date().toISOString(),
      formData,
    };
    setHistory((prev) => [entry, ...prev]);
  }, []);

  const handleNewSession = useCallback(() => {
    setResult(null);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <main className="flex-1 md:ml-16 lg:ml-60 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
          {currentPage === 'session' && (
            <NewSession result={result} onResult={handleResult} onNewSession={handleNewSession} />
          )}
          {currentPage === 'history' && (
            <History history={history} onNavigate={setCurrentPage} />
          )}
          {currentPage === 'about' && <About />}
        </div>
      </main>
    </div>
  );
};

export default Index;
