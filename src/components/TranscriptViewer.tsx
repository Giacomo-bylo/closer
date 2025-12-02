import React, { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptItem {
  role: 'agent' | 'user';
  content: string;
}

interface TranscriptViewerProps {
  transcript: TranscriptItem[] | string;
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ transcript }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse transcript if string
  const transcriptList: TranscriptItem[] = Array.isArray(transcript)
    ? transcript
    : typeof transcript === 'string' && transcript.startsWith('[')
      ? JSON.parse(transcript)
      : [];

  if (!transcriptList || transcriptList.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-bylo-blue" />
          <span>Trascrizione completa ({transcriptList.length} messaggi)</span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="p-4 bg-white max-h-96 overflow-y-auto space-y-4">
          {transcriptList.map((msg, idx) => (
            <div key={idx} className={cn('flex gap-3', msg.role === 'agent' ? 'flex-row' : 'flex-row-reverse')}>
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                msg.role === 'agent' ? 'bg-bylo-blue text-white' : 'bg-slate-200 text-slate-600'
              )}>
                {msg.role === 'agent' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                msg.role === 'agent' 
                  ? 'bg-blue-50 text-slate-800 rounded-tl-none' 
                  : 'bg-slate-100 text-slate-800 rounded-tr-none'
              )}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscriptViewer;
