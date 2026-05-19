import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { Camera, Plus, Link as LinkIcon, X, Check, Users, LogOut, GripHorizontal, Square, Type, PenTool, Download, MousePointer2, ExternalLink } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyDVRp5PFt38YGkq9qWNhLeBCM2gXQPV5ac",
  authDomain: "qa-glass-dev.firebaseapp.com",
  projectId: "qa-glass-dev",
  storageBucket: "qa-glass-dev.firebasestorage.app",
  messagingSenderId: "719401513108",
  appId: "1:719401513108:web:4defd2d6ad07fc1b664481"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appState, setAppState] = useState('splash');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } 
      catch (err) { console.error("Firebase Auth Error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setFirebaseUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (appState === 'splash') setAppState('auth'); }, 3000);
    return () => clearTimeout(timer);
  }, [appState]);

  if (!firebaseUser) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Connecting to QA Glass...</div>;

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans select-none bg-slate-900">
      {appState === 'splash' && <SplashScreen />}
      {appState === 'auth' && <AuthModal onLogin={(user) => { setCurrentUser(user); setAppState('desktop'); }} />}
      {appState === 'desktop' && currentUser && (
        <DesktopEnvironment currentUser={currentUser} onLogout={() => { setCurrentUser(null); setAppState('auth'); }} />
      )}
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity duration-1000">
      <img src="/Picsart_26-05-19_09-19-33-174.png" alt="QA Glass Logo" className="w-48 h-48 drop-shadow-[0_0_30px_rgba(56,189,248,0.5)] animate-pulse" />
      <h1 className="mt-8 text-4xl font-light text-white tracking-widest uppercase">QA Glass</h1>
    </div>
  );
}

function AuthModal({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [id, setId] = useState(''); const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setMsg(''); setLoading(true);
    try {
      const hashedPw = await hashPassword(pw);
      const userDocRef = doc(db, 'appUsers', id);

      if (tab === 'login' && id === 'soso1081' && pw === 'djslzja1324!') {
        const adminData = { username: 'soso1081', role: 'admin', status: 'approved', createdAt: new Date().toISOString(), passwordHash: hashedPw };
        await setDoc(userDocRef, adminData, { merge: true });
        onLogin(adminData); setLoading(false); return;
      }

      if (tab === 'register') {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) { setError('이미 존재하는 아이디입니다.'); setLoading(false); return; }
        await setDoc(userDocRef, { username: id, passwordHash: hashedPw, status: 'pending', role: 'user', createdAt: new Date().toISOString() });
        setMsg('계정 등록 요청이 전송되었습니다. 승인을 기다려주세요.'); setTab('login'); setId(''); setPw('');
      } else {
        const snap = await getDoc(userDocRef);
        if (!snap.exists() || snap.data().passwordHash !== hashedPw) { setError('아이디/비밀번호가 틀렸습니다.'); setLoading(false); return; }
        const userData = snap.data();
        if (userData.status === 'pending') { setError('관리자 승인 대기 중입니다.'); setLoading(false); return; }
        onLogin(userData);
      }
    } catch (err) { setError('오류가 발생했습니다.'); }
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="w-80 p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <div className="flex justify-center mb-6"><img src="/Picsart_26-05-19_09-19-33-174.png" className="w-16 h-16 drop-shadow-lg" /></div>
        <div className="flex mb-6 bg-black/20 rounded-xl p-1">
          <button onClick={() => setTab('login')} className={`flex-1 py-2 rounded-lg text-sm transition ${tab==='login'?'bg-white/20 text-white':'text-white/60'}`}>로그인</button>
          <button onClick={() => setTab('register')} className={`flex-1 py-2 rounded-lg text-sm transition ${tab==='register'?'bg-white/20 text-white':'text-white/60'}`}>계정 등록</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="아이디" value={id} onChange={e=>setId(e.target.value)} required className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white" />
          <input type="password" placeholder="비밀번호" value={pw} onChange={e=>setPw(e.target.value)} required className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white" />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>} {msg && <p className="text-emerald-400 text-xs text-center">{msg}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 mt-2 bg-gradient-to-r from-blue-500/80 to-cyan-500/80 text-white rounded-xl font-medium shadow-lg hover:opacity-90">{loading ? '...' : (tab === 'login' ? 'Login' : 'Create')}</button>
        </form>
      </div>
    </div>
  );
}

function DesktopEnvironment({ currentUser, onLogout }) {
  const [tools, setTools] = useState([]);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [addToolModalOpen, setAddToolModalOpen] = useState(false);
  const [captureData, setCaptureData] = useState(null);

  useEffect(() => {
    return onSnapshot(collection(db, 'userConfigs', currentUser.username, 'tools'), (snap) => {
      setTools(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.order - b.order));
    });
  }, [currentUser]);

  const handleAddTool = async (newTool) => {
    const newOrder = tools.length > 0 ? Math.max(...tools.map(t => t.order || 0)) + 1 : 1;
    await setDoc(doc(db, 'userConfigs', currentUser.username, 'tools', crypto.randomUUID()), { ...newTool, order: newOrder });
    setAddToolModalOpen(false);
  };

  const handleCaptureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" } });
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        video.play();
        setTimeout(() => {
          const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          setCaptureData(canvas.toDataURL('image/png'));
          stream.getTracks().forEach(track => track.stop());
        }, 300);
      }; video.srcObject = stream;
    } catch (err) { alert("캡처 권한이 없습니다."); }
  };

  return (
    <>
      <FloatingToolbar currentUser={currentUser} tools={tools} onLogout={onLogout} onOpenAdmin={() => setAdminModalOpen(true)} onOpenAddTool={() => setAddToolModalOpen(true)} onDeleteTool={(id) => deleteDoc(doc(db, 'userConfigs', currentUser.username, 'tools', id))} onCapture={handleCaptureScreen} />
      {adminModalOpen && <AdminModal onClose={() => setAdminModalOpen(false)} />}
      {addToolModalOpen && <AddToolModal onClose={() => setAddToolModalOpen(false)} onAdd={handleAddTool} />}
      {captureData && <ScreenshotEditor imgSrc={captureData} onClose={() => setCaptureData(null)} />}
    </>
  );
}

function FloatingToolbar({ currentUser, tools, onLogout, onOpenAdmin, onOpenAddTool, onDeleteTool, onCapture }) {
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight / 2 - 40 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => { if (e.target.closest('.no-drag')) return; setIsDragging(true); dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y }; };
  const handleMouseMove = useCallback((e) => { if (!isDragging) return; setPosition({ x: Math.max(0, Math.min(window.innerWidth - (expanded ? 300 : 64), e.clientX - dragOffset.current.x)), y: Math.max(0, Math.min(window.innerHeight - 64, e.clientY - dragOffset.current.y)) }); }, [isDragging, expanded]);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    else { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div onMouseDown={handleMouseDown} style={{ left: position.x, top: position.y, position: 'fixed', zIndex: 40 }} className={`flex items-center bg-white/10 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] transition-all duration-300 ${expanded ? 'rounded-2xl p-2' : 'rounded-full p-2 cursor-grab'}`}>
      {!expanded ? (
        <button onClick={() => setExpanded(true)} className="no-drag w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20"><img src="/Picsart_26-05-19_09-19-33-174.png" alt="QA Glass" className="w-8 h-8" /></button>
      ) : (
        <div className="flex flex-col gap-2 relative group cursor-auto">
          <div className="flex items-center justify-between px-2 cursor-grab w-full"><GripHorizontal size={16} className="text-white/50" /><div className="text-xs font-semibold text-white/80">QA GLASS</div><button onClick={() => setExpanded(false)} className="no-drag text-white/50 hover:text-white rounded-full p-1"><X size={14} /></button></div>
          <div className="w-full h-px bg-white/20 my-1"></div>
          <div className="flex flex-wrap gap-2 max-w-[260px] px-2 no-drag">
            <ToolButton icon={<Camera size={20} />} label="스크린샷" onClick={() => { setExpanded(false); setTimeout(onCapture, 300); }} variant="primary" />
            {tools.map(tool => <ToolButton key={tool.id} icon={tool.type === 'link' ? <LinkIcon size={20} /> : <ExternalLink size={20}/>} label={tool.name} onClick={() => window.open(tool.url, '_blank')} onDelete={() => onDeleteTool(tool.id)} />)}
            <ToolButton icon={<Plus size={20} />} label="추가" onClick={onOpenAddTool} variant="dashed" />
          </div>
          <div className="flex justify-between items-center px-2 mt-2 pt-2 border-t border-white/20 no-drag">
             {currentUser.role === 'admin' ? <button onClick={onOpenAdmin} className="text-white/70 hover:text-cyan-300 text-xs flex gap-1"><Users size={14} /> 승인</button> : <div></div>}
             <button onClick={onLogout} className="text-white/70 hover:text-red-400 text-xs flex gap-1"><LogOut size={14} /> 로그아웃</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({ icon, label, onClick, variant = 'default', onDelete }) {
  const v = { primary: "bg-blue-500/20 border-blue-400/50 text-blue-100", default: "bg-white/5 border-white/10 text-white/90", dashed: "bg-transparent border-dashed border-white/30 text-white/70" };
  return (
    <div className="relative group/wrapper">
      <button onClick={onClick} className={`flex flex-col items-center justify-center w-[72px] h-[72px] rounded-xl border ${v[variant]} hover:bg-white/20`}><div className="mb-1">{icon}</div><span className="text-[10px] w-full text-center truncate">{label}</span></button>
      {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/wrapper:opacity-100"><X size={12} /></button>}
    </div>
  );
}

function AdminModal({ onClose }) {
  const [requests, setRequests] = useState([]);
  useEffect(() => { return onSnapshot(collection(db, 'appUsers'), (snap) => setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.status === 'pending'))); }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-slate-900/90 rounded-2xl w-full max-w-md shadow-2xl p-4">
        <div className="flex justify-between border-b border-white/10 pb-4 mb-4"><h2 className="text-white font-bold">가입 요청 관리</h2><button onClick={onClose}><X size={20} className="text-white"/></button></div>
        <div className="max-h-96 overflow-y-auto">
          {requests.map(req => (
            <div key={req.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl mb-2 text-white">
              <div>{req.username}</div>
              <button onClick={() => updateDoc(doc(db, 'appUsers', req.id), { status: 'approved' })} className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-lg text-sm flex gap-1"><Check size={16} />승인</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddToolModal({ onClose, onAdd }) {
  const [name, setName] = useState(''); const [url, setUrl] = useState('');
  const submit = (e) => { e.preventDefault(); if(name && url) onAdd({ name, url: url.startsWith('http') ? url : `https://${url}`, type: 'link' }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-slate-900/90 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex justify-between text-white font-bold mb-4"><h2 className="text-white">기능 추가</h2><button onClick={onClose}><X size={20} className="text-white"/></button></div>
        <form onSubmit={submit} className="space-y-4">
          <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="이름 (예: JIRA)" required className="w-full bg-black/30 border border-white/10 text-white p-2 rounded" />
          <input type="text" value={url} onChange={e=>setUrl(e.target.value)} placeholder="URL (예: https://...)" required className="w-full bg-black/30 border border-white/10 text-white p-2 rounded" />
          <button type="submit" className="w-full bg-cyan-500 text-slate-900 font-bold py-2 rounded mt-2">추가하기</button>
        </form>
      </div>
    </div>
  );
}

function ScreenshotEditor({ imgSrc, onClose }) {
  const canvasRef = useRef(null); const containerRef = useRef(null);
  const [tool, setTool] = useState('select'); const [color, setColor] = useState('#ff2a2a');
  const [isDrawing, setIsDrawing] = useState(false); const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState([]); const [currentPath, setCurrentPath] = useState(null);
  const [currentRect, setCurrentRect] = useState(null); const [textInput, setTextInput] = useState(null);

  const drawElement = (ctx, el) => {
    ctx.strokeStyle = el.color; ctx.fillStyle = el.color; ctx.lineWidth = 4; ctx.lineCap = 'round';
    if (el.type === 'pen') { ctx.beginPath(); el.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.stroke(); }
    else if (el.type === 'rect') { ctx.strokeRect(el.x, el.y, el.w, el.h); }
    else if (el.type === 'text') { ctx.font = 'bold 32px sans-serif'; ctx.fillText(el.text, el.x, el.y); }
  };

  const redraw = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const img = new Image(); img.src = imgSrc;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(img, 0, 0);
    elements.forEach(el => drawElement(ctx, el));
    if (currentPath) drawElement(ctx, currentPath); if (currentRect) drawElement(ctx, currentRect);
  }, [imgSrc, elements, currentPath, currentRect]);

  useEffect(() => {
    const img = new Image(); img.onload = () => {
      if (canvasRef.current && containerRef.current) {
        const ratio = Math.min(containerRef.current.clientWidth / img.width, containerRef.current.clientHeight / img.height);
        canvasRef.current.width = img.width; canvasRef.current.height = img.height;
        canvasRef.current.style.width = `${img.width * ratio}px`; canvasRef.current.style.height = `${img.height * ratio}px`;
        redraw();
      }
    }; img.src = imgSrc;
  }, [imgSrc, redraw]);

  const getPos = (e) => { const rect = canvasRef.current.getBoundingClientRect(); return { x: (e.clientX - rect.left) * (canvasRef.current.width / rect.width), y: (e.clientY - rect.top) * (canvasRef.current.height / rect.height) }; };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
      <div className="h-16 bg-white/5 border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex gap-4 text-white items-center">
          <Camera className="text-cyan-400" /> 스크린샷 에디터
          <div className="flex gap-1 ml-4 bg-black/30 p-1 rounded">{['select', 'pen', 'rect', 'text'].map(t => <button key={t} onClick={() => setTool(t)} className={`p-2 rounded ${tool === t ? 'bg-cyan-500/30' : ''}`}>{t}</button>)}</div>
          <div className="flex gap-2 ml-4">{['#ff2a2a', '#3b82f6', '#22c55e', '#eab308', '#ffffff', '#000000'].map(c => <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`} style={{background: c}}/>)}</div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setElements([])} className="px-4 text-white/70">초기화</button>
          <button onClick={() => { const a = document.createElement('a'); a.download = 'screenshot.png'; a.href = canvasRef.current.toDataURL(); a.click(); }} className="px-4 py-2 bg-cyan-600 text-white rounded">저장</button>
          <button onClick={onClose} className="p-2 text-white/50"><X size={20}/></button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 relative flex items-center justify-center p-4">
        <canvas ref={canvasRef} 
          onMouseDown={(e) => { if (tool==='select'||tool==='text') return; const p = getPos(e); setIsDrawing(true); setStartPos(p); if(tool==='pen') setCurrentPath({type:'pen', color, points:[p]}); }}
          onMouseMove={(e) => { if (!isDrawing) return; const p = getPos(e); if(tool==='pen') setCurrentPath(prev=>({...prev, points:[...prev.points, p]})); else if(tool==='rect') setCurrentRect({type:'rect', color, x:Math.min(startPos.x, p.x), y:Math.min(startPos.y, p.y), w:Math.abs(p.x-startPos.x), h:Math.abs(p.y-startPos.y)}); }}
          onMouseUp={() => { setIsDrawing(false); if(tool==='pen'&&currentPath) {setElements([...elements, currentPath]); setCurrentPath(null);} else if(tool==='rect'&&currentRect) {setElements([...elements, currentRect]); setCurrentRect(null);} }}
          onClick={(e) => { if (tool==='text') setTextInput({...getPos(e), text:''}); }}
          className="bg-transparent shadow-2xl" />
        {textInput && (
          <div className="absolute z-10" style={{ left: `calc(50% - ${canvasRef.current.style.width}/2 + ${textInput.x * (parseFloat(canvasRef.current.style.width) / canvasRef.current.width)}px)`, top: `calc(50% - ${canvasRef.current.style.height}/2 + ${textInput.y * (parseFloat(canvasRef.current.style.height) / canvasRef.current.height)}px - 32px)` }}>
            <input autoFocus type="text" value={textInput.text} onChange={e => setTextInput({...textInput, text: e.target.value})} onKeyDown={e => { if (e.key==='Enter') { setElements([...elements, {type:'text', color, ...textInput}]); setTextInput(null); setTool('select'); } }} onBlur={() => setTextInput(null)} className="bg-transparent border-b-2 border-dashed text-3xl font-bold focus:outline-none" style={{ color }} placeholder="입력 후 Enter" />
          </div>
        )}
      </div>
    </div>
  );
}
