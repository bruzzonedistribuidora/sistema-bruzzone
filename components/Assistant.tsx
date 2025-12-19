import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { askAssistant } from '../services/geminiService';

const Assistant: React.FC = () => {
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
        {role: 'model', text: 'Hola, soy FerreBot. ¿En qué te puedo ayudar hoy? Puedo buscar productos, dar consejos técnicos o explicar códigos de error de ARCA.'}
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
        setLoading(true);

        const history = messages.map(m => m.text);
        const response = await askAssistant(history, userMsg);
        
        setMessages(prev => [...prev, {role: 'model', text: response}]);
        setLoading(false);
    };

    return (
        <div className="p-8 h-screen flex flex-col max-w-4xl mx-auto">
             <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Asistente Virtual</h2>
                <p className="text-gray-500 mt-1">IA entrenada en ferretería y construcción</p>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-ferre-dark' : 'bg-ferre-orange'}`}>
                                    {m.role === 'user' ? <User size={16} className="text-white"/> : <Bot size={16} className="text-white"/>}
                                </div>
                                <div className={`p-4 rounded-xl text-sm leading-relaxed shadow-sm ${
                                    m.role === 'user' 
                                    ? 'bg-white text-gray-800 rounded-tr-none' 
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                             <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-ferre-orange flex items-center justify-center">
                                    <Bot size={16} className="text-white"/>
                                </div>
                                <div className="bg-white p-4 rounded-xl rounded-tl-none shadow-sm border border-gray-100 text-sm text-gray-500 italic">
                                    Escribiendo...
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
                
                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Pregunta sobre stock, equivalencias o normativas..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-ferre-orange focus:border-transparent outline-none"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={loading || !input}
                            className="bg-ferre-orange text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Assistant;