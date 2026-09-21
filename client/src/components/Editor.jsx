import React, { useRef, useEffect, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { FileCode, Loader2, ZoomIn, ZoomOut, Wifi, WifiOff } from 'lucide-react';

export default function Editor({
  activeFile,
  getYText,
  awareness,
  theme = 'dark',
  onRun,
  onToggleExplorer,
  onToggleOutput,
  onOpenTemplates,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    // Default font size: slightly larger for mobile screens
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 15;
    }
    return 14;
  });

  const [isOnline, setIsOnline] = useState(()=> {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (activeFile && editorRef.current) {
        const cached = localStorage.getItem('offline_${activeFile.id || activeFile.name}');
        if (cached && !editorRef.current.getValue()){
          editorRef.current.setValue(cached);
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventlistener('online', handleOnline);
    window.addEventlistener('offline', handleOffline);

    return () => {
      window.removeEventlistener('online', handleOnline);
      window.removeEventlistener('offline', handleOffline);
    };
  }, [activeFile]);

  useEffect(() => {
    if (!editorRef.current || !activeFile) return;
    const disposable = editorRef.current.onDidChnageModelContent(() => {
      setTimeout(() => {
        try{
          const currentContent = editorRef.current?.getValue();
          if (currentContent !== undefined) { 
            localStorage.setItem(
              'offline_${activeFile.id || activeFile.name}',
              currentContent
            );
        }
      } catch (e) {
        console.warn('LocalStorage linit reached or unavailable', e);
      }
    }, 0);
  });

  return () => disposable.dispose();
}, [activeFile]);

  const handleEditorDidMount= (editor, monaco)=>{
    editorRef.current=editor;
    editorRef.current=monaco;

    if (getYText && awareness&& activeFile){
      const yText= getYText(activeFile.id || activeFile.name);
      if (yText){
        if (bindingRef.current){
          bindingRef.current.destory();
        }

        bindingRef.current=new MonacoBinding(
          yText,
          editor.getModel(),
          new Set([editor]),
          awareness
        );
      }
    }

    setEditorReady(true);
  };

  useEffect(()=>{
    return ()=>{
      if (bindingRef.current){
        bindingRef.current.destroy();
      }
    };
  }, [activeFile]);

  const handleZoomIn=()=> setFontSize((prev)=> Math.min(prev + 1, 28));
  const handleZoomOut=()=> setFontSize((prev)=> Math.max(prev - 1, 10));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: theme==='dark' ? '#1e1e1e' : '#ffffff' }}>
      {/* Top Editor Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 14px',
          borderBottom:"1px solid #333",
          backgroundColor: theme==='dark' ? '#252526' : '#f3f3f3',
          color: theme==='dark' ? '#ccc' : '#333',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCode size={16}/>
          <span style={{ fontSize:'13px', fontWeight:'500'}}>
            {activeFile ? activeFile.name: 'No file selected'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Accetance Criteria: Visible and accurate online / offline indicator badge*/}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '3px 10px',
              borderRadius:'12px'
              alignItems: 'center',
              fontsize:"12px",
              fontWeight:"600",
              backgroundColor: isOnline ? 'rgbs(34, 197, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isOnline ? '#22c55e' : '#ef4444',
              border: '1px solid $isOnline' ? 'rgbs(34, 197, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
            }}
          >
            {isOnline ? <Wifi size={13} /> : <wifiOff size={13} />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          <button onClick={handleZoomOut} title='Zoom Out' style={{ background: 'transparent', border: 'none', color: 'inherit', cursor:'pointer'}}>
            <ZoomOut size={16}/>
          </button>
          <button onClick={handleZoomIn} title='Zoom In' style={{ background: 'transparent', border: 'none', color: 'inherit', cursor:'pointer'}}>
            <ZoomIn size={16}/>
          </button>

          {onRun && (
            <button onClick={onRun} style={{ background: '#007acc', border: 'none', color:'#fff', borderRadius}:'4px', padding: '4px 10px', cursor:'pointer', fontSize:'12px'}} >
              Run
            </button>
          ) : null}
        </div>
      </div>

      {/*Monaco code Editor canvas*/}
      <div style={{ flex: 1, position: 'relative' }} >
        <MonacoEditor
          height="100%"
          language={activeFile?.language || 'javascript'}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            fontsize: fontSize,
            minimap:{ enabled:true },
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
          onMount={handleEditorDidMount}
          loading={<loader2 size={24} className="animate-spin"/>}
        />
      </div>
    </div>
  );
}

    

    