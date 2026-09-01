import React, { useState, useRef, useEffect, useCallback } from 'react';
import logo from './logo.png';
import { supabase } from './supabase';
import { Upload, Download, Copy, Check, File as FileIcon, Loader2, Type, Archive, Flame, HardDrive, Trash2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import JSZip from 'jszip';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import localforage from 'localforage';

import { db } from './firebase';
import { 
  doc, 
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

import { generateKeyString, encryptData, decryptData } from './utils/crypto';

const themes = {
  indigo: {
    name: 'Indigo',
    gradient: 'from-indigo-600 to-purple-600',
    bgPrimary: 'bg-indigo-600 hover:bg-indigo-700',
    bgLight: 'bg-indigo-50 hover:bg-indigo-100',
    textPrimary: 'text-indigo-600',
    selection: 'selection:bg-indigo-200',
    borderFocus: 'focus:border-indigo-500',
    ringFocus: 'focus:ring-indigo-500',
    bgIcon: 'bg-indigo-100',
    shadow: 'shadow-indigo-200',
    bgGradientPrimary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
  },
  sunset: {
    name: 'Sunset',
    gradient: 'from-orange-500 to-red-500',
    bgPrimary: 'bg-orange-500 hover:bg-orange-600',
    bgLight: 'bg-orange-50 hover:bg-orange-100',
    textPrimary: 'text-orange-600',
    selection: 'selection:bg-orange-200',
    borderFocus: 'focus:border-orange-500',
    ringFocus: 'focus:ring-orange-500',
    bgIcon: 'bg-orange-100',
    shadow: 'shadow-orange-200',
    bgGradientPrimary: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
  },
  cyberpunk: {
    name: 'Cyberpunk',
    gradient: 'from-pink-500 to-cyan-500',
    bgPrimary: 'bg-pink-500 hover:bg-pink-600',
    bgLight: 'bg-pink-50 hover:bg-pink-100',
    textPrimary: 'text-pink-600',
    selection: 'selection:bg-pink-200',
    borderFocus: 'focus:border-pink-500',
    ringFocus: 'focus:ring-pink-500',
    bgIcon: 'bg-pink-100',
    shadow: 'shadow-pink-200',
    bgGradientPrimary: 'bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600'
  },
  forest: {
    name: 'Forest',
    gradient: 'from-emerald-500 to-teal-500',
    bgPrimary: 'bg-emerald-500 hover:bg-emerald-600',
    bgLight: 'bg-emerald-50 hover:bg-emerald-100',
    textPrimary: 'text-emerald-600',
    selection: 'selection:bg-emerald-200',
    borderFocus: 'focus:border-emerald-500',
    ringFocus: 'focus:ring-emerald-500',
    bgIcon: 'bg-emerald-100',
    shadow: 'shadow-emerald-200',
    bgGradientPrimary: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'text' | 'retrieve'
  const [appTheme, setAppTheme] = useState('indigo');
  const t = themes[appTheme];

  // Upload State
  const [files, setFiles] = useState([]);
  const [textData, setTextData] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedId, setUploadedId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Options
  const [expiresIn, setExpiresIn] = useState('24'); // hours (0 = never)
  const [maxDownloads, setMaxDownloads] = useState('0'); // 0 = unlimited

  const fileInputRef = useRef(null);

  // Retrieve State
  const [retrieveId, setRetrieveId] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievedText, setRetrievedText] = useState('');
  
  // Animation State
  const [burnStatus, setBurnStatus] = useState('none'); // 'none' | 'burning' | 'destroyed'

  // Vault State
  const [vaultItems, setVaultItems] = useState([]);
  const [selectedVaultItem, setSelectedVaultItem] = useState(null);

  const loadVaultItems = useCallback(async () => {
    try {
      const keys = await localforage.keys();
      const items = [];
      for (const key of keys) {
        if (key.startsWith('vault_')) {
          const item = await localforage.getItem(key);
          if (item) items.push({ ...item, storageKey: key });
        }
      }
      items.sort((a, b) => b.savedAt - a.savedAt);
      setVaultItems(items);
    } catch (err) {
      console.error('Error loading vault:', err);
    }
  }, []);

  useEffect(() => {
    loadVaultItems();
  }, [loadVaultItems]);

  const saveToVault = async (name, content, type) => {
    const key = `vault_${Date.now()}`;
    await localforage.setItem(key, {
      name,
      content,
      type, // 'text' or 'file'
      savedAt: Date.now()
    });
    loadVaultItems();
  };

  const deleteVaultItem = async (storageKey) => {
    await localforage.removeItem(storageKey);
    setSelectedVaultItem(null);
    loadVaultItems();
    toast.info('Removed from vault');
  };

  // Handlers for Upload
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setUploadedId('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setUploadedId('');
    }
  };

  const handleUpload = async () => {
    if (activeTab === 'upload' && files.length === 0) return;
    if (activeTab === 'text' && !textData.trim()) return;
    
    setIsUploading(true);

    try {
      let finalBlob;
      let originalName;

      if (activeTab === 'text') {
        finalBlob = new Blob([textData], { type: 'text/plain' });
        originalName = 'clipboard_text';
      } else {
        if (files.length === 1) {
          finalBlob = files[0];
          originalName = files[0].name;
        } else {
          toast.info('Zipping files...');
          const zip = new JSZip();
          files.forEach(f => zip.file(f.name, f));
          finalBlob = await zip.generateAsync({ type: 'blob' });
          originalName = 'files.zip';
        }
      }

      const arrayBuffer = await finalBlob.arrayBuffer();
      
      // Generate a unique 6-digit PIN
      let pin;
      while (true) {
        pin = await generateKeyString();
        const docRef = doc(db, 'files', pin);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) break; // Ensure it's unique
      }
      
      const encryptedBuffer = await encryptData(arrayBuffer, pin);
      const encryptedBlob = new Blob([encryptedBuffer]);

      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.enc`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, encryptedBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw new Error('Supabase Storage Error: ' + uploadError.message);

      let expiresAt = null;
      if (expiresIn !== '0') {
        expiresAt = Date.now() + parseInt(expiresIn) * 60 * 60 * 1000;
      }

      await setDoc(doc(db, 'files', pin), {
        originalName,
        supabasePath: fileName,
        size: encryptedBlob.size,
        uploadedAt: serverTimestamp(),
        type: activeTab,
        expiresAt,
        maxDownloads: parseInt(maxDownloads),
        remainingDownloads: parseInt(maxDownloads),
        theme: appTheme // Save the selected theme!
      });

      setUploadedId(pin);
      toast.success('Uploaded securely!');
      
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error uploading.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearUpload = () => {
    setFiles([]);
    setTextData('');
    setUploadedId('');
    setAppTheme('indigo');
    setBurnStatus('none');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uploadedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.info('ID copied to clipboard');
  };

  const copyRetrievedText = () => {
    navigator.clipboard.writeText(retrievedText);
    toast.info('Text copied to clipboard');
  };

  // Burn Animation Helper
  const triggerBurnAnimation = async () => {
    setBurnStatus('burning');
    
    // Play confetti explosion (fire colors)
    const duration = 1500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#ff8c00', '#ffd700']
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#ff8c00', '#ffd700']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Wait for visual effect to finish
    await new Promise(resolve => setTimeout(resolve, duration));
  };

  // Handlers for Retrieve
  const handleRetrieve = async (e) => {
    e.preventDefault();
    if (!retrieveId.trim()) return;

    setIsRetrieving(true);
    setRetrievedText('');
    setBurnStatus('none');
    
    try {
      const pin = retrieveId.trim();
      const docId = pin;
      const keyStr = pin; // The PIN acts as the decryption password

      const fileRef = doc(db, 'files', docId);
      const fileDoc = await getDoc(fileRef);
      
      if (!fileDoc.exists()) throw new Error('Not found. It may have expired or been deleted.');

      const data = fileDoc.data();
      
      // Load the sender's theme!
      if (data.theme && themes[data.theme]) {
        setAppTheme(data.theme);
      }
      
      if (data.expiresAt && Date.now() > data.expiresAt) {
        await deleteDoc(fileRef);
        await supabase.storage.from('uploads').remove([data.supabasePath]);
        throw new Error('This item has expired and was deleted.');
      }
      
      if (data.maxDownloads > 0 && data.remainingDownloads <= 0) {
        await deleteDoc(fileRef);
        await supabase.storage.from('uploads').remove([data.supabasePath]);
        throw new Error('Download limit reached. Item deleted.');
      }

      let isFinalDownload = false;
      if (data.maxDownloads > 0) {
        const remaining = data.remainingDownloads - 1;
        if (remaining === 0) {
          isFinalDownload = true;
          await deleteDoc(fileRef);
          setTimeout(() => supabase.storage.from('uploads').remove([data.supabasePath]), 10000);
        } else {
          await setDoc(fileRef, { remainingDownloads: remaining }, { merge: true });
        }
      }

      if (isFinalDownload) {
        await triggerBurnAnimation();
      } else {
        toast.info('Downloading encrypted data...');
      }

      const { data: blobData, error: downloadError } = await supabase.storage
        .from('uploads')
        .download(data.supabasePath);
      
      if (downloadError) throw downloadError;

      if (!isFinalDownload) toast.info('Decrypting locally...');
      
      const encryptedBuffer = await blobData.arrayBuffer();
      const decryptedBuffer = await decryptData(encryptedBuffer, keyStr);

      if (data.type === 'text' || data.originalName === 'clipboard_text') {
        const text = new TextDecoder().decode(decryptedBuffer);
        setRetrievedText(text);
        await saveToVault(data.originalName, text, 'text');
        if (isFinalDownload) setBurnStatus('destroyed');
        else toast.success('Text retrieved & saved to Vault!');
      } else {
        // Try to read as text for vault storage
        let textContent = null;
        try {
          const textAttempt = new TextDecoder('utf-8', { fatal: true }).decode(decryptedBuffer);
          textContent = textAttempt;
        } catch (e) {
          // Not a text file, that's fine
        }

        const blob = new Blob([decryptedBuffer]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (textContent) {
          await saveToVault(data.originalName, textContent, 'text');
        } else {
          await saveToVault(data.originalName, '[Binary file - view offline not supported]', 'file');
        }
        
        if (isFinalDownload) setBurnStatus('destroyed');
        else toast.success('Download complete & saved to Vault!');
      }
      
      setRetrieveId('');
    } catch (error) {
      toast.error(error.message || 'Error retrieving item. Invalid PIN?');
    } finally {
      setIsRetrieving(false);
    }
  };

  const renderOptions = () => (
    <div className="space-y-4 mb-4 text-left">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Expires In</label>
          <select value={expiresIn} onChange={e => setExpiresIn(e.target.value)} className={`w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 ${t.ringFocus} text-slate-700`}>
            <option value="1">1 Hour</option>
            <option value="24">24 Hours</option>
            <option value="168">7 Days</option>
            <option value="0">Never</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Limit</label>
          <select value={maxDownloads} onChange={e => setMaxDownloads(e.target.value)} className={`w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 ${t.ringFocus} text-slate-700`}>
            <option value="1">1 Download (Burn)</option>
            <option value="10">10 Downloads</option>
            <option value="0">Unlimited</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Theme / Vibe</label>
        <div className="flex gap-2">
          {Object.entries(themes).map(([key, themeData]) => (
            <button
              key={key}
              onClick={() => setAppTheme(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border-2 ${
                appTheme === key ? `border-transparent text-white ${themeData.bgGradientPrimary}` : `border-slate-200 text-slate-500 hover:bg-slate-50`
              }`}
            >
              {themeData.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${t.selection}`}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className={`w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 ${burnStatus === 'burning' ? 'animate-pulse scale-95' : ''}`}>
        
        {/* Header / Tabs */}
        <div className="flex border-b border-slate-200/50">
          <button
            onClick={() => { setActiveTab('upload'); setUploadedId(''); setBurnStatus('none'); }}
            className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'upload' ? `bg-white ${t.textPrimary} shadow-sm` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <Upload size={18} /> File
          </button>
          <button
            onClick={() => { setActiveTab('text'); setUploadedId(''); setBurnStatus('none'); }}
            className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'text' ? `bg-white ${t.textPrimary} shadow-sm` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <Type size={18} /> Text
          </button>
          <button
            onClick={() => { setActiveTab('retrieve'); setBurnStatus('none'); }}
            className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'retrieve' ? `bg-white ${t.textPrimary} shadow-sm` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <Download size={18} /> Retrieve
          </button>
          <button
            onClick={() => { setActiveTab('vault'); setBurnStatus('none'); loadVaultItems(); }}
            className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'vault' ? `bg-white ${t.textPrimary} shadow-sm` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <HardDrive size={18} /> Vault
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8">
          
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="border border-white/60 rounded-[2rem] mt-[-20px] transition-transform hover:scale-105 duration-300">
              <img src={logo} alt="Online Clipboard Logo" className="w-24 h-24 rounded-[1.8rem] object-cover" />
            </div>
            <h1 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${t.gradient} mb-2 transition-all duration-500`}>
              Online Clipboard
            </h1>
            <p className="text-slate-500 text-sm">
              E2E Encrypted • Secure Sharing
            </p>
          </div>

          {(activeTab === 'upload' || activeTab === 'text') ? (
            <div className="space-y-6">
              
              {!uploadedId ? (
                <>
                  {activeTab === 'upload' && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 
                        ${isDragging ? `${t.textPrimary} ${t.bgLight} scale-[1.02]` : files.length > 0 ? `${t.borderLight} ${t.bgLight}` : `border-slate-300 hover:border-slate-400 hover:bg-slate-50/30`}`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange}
                        multiple
                      />
                      
                      {files.length > 0 ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className={`w-12 h-12 ${t.bgIcon} ${t.textPrimary} rounded-full flex items-center justify-center`}>
                            {files.length > 1 ? <Archive size={24} /> : <FileIcon size={24} />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                              {files.length > 1 ? `${files.length} files selected` : files[0].name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-1">
                            <Upload size={24} />
                          </div>
                          <p className="text-sm font-medium">Click to browse or drag and drop</p>
                          <p className="text-xs opacity-70">Supports multiple files</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'text' && (
                    <textarea
                      value={textData}
                      onChange={e => setTextData(e.target.value)}
                      placeholder="Paste your text or code snippet here..."
                      className={`w-full h-40 p-4 bg-white border border-slate-200 rounded-2xl resize-none outline-none focus:ring-2 ${t.ringFocus} text-sm text-slate-700 font-mono transition-all duration-300`}
                    />
                  )}

                  {renderOptions()}

                  <div className="flex gap-3">
                    {(files.length > 0 || textData) && (
                      <button 
                        onClick={clearUpload}
                        disabled={isUploading}
                        className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={handleUpload}
                      disabled={(activeTab === 'upload' && files.length === 0) || (activeTab === 'text' && !textData) || isUploading}
                      className={`flex-[2] flex items-center justify-center gap-2 py-3 px-4 ${t.bgGradientPrimary} text-white rounded-xl font-medium shadow-lg ${t.shadow} transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100`}
                    >
                      {isUploading ? (
                        <><Loader2 size={18} className="animate-spin" /> Encrypting...</>
                      ) : (
                        'Upload Securely'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <Check size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Upload Complete</h3>
                  <p className="text-sm text-slate-500 mb-4 text-center">Your data is encrypted. Share this PIN or QR code.</p>
                  
                  <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <QRCodeSVG value={uploadedId} size={140} level="M" />
                  </div>

                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-1 flex items-center justify-between mb-6">
                    <span className={`font-mono text-sm font-bold ${t.textPrimary} tracking-wider pl-4 py-2 truncate max-w-[200px]`}>
                      {uploadedId}
                    </span>
                    <button 
                      onClick={copyToClipboard}
                      className={`p-3 bg-white border border-slate-200 rounded-lg ${t.bgLight} ${t.textPrimary} transition-colors shadow-sm flex items-center gap-2 text-sm font-medium flex-shrink-0`}
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>

                  <button 
                    onClick={clearUpload}
                    className={`w-full py-3 px-4 font-medium ${t.textPrimary} ${t.bgLight} rounded-xl transition-colors`}
                  >
                    Upload Another
                  </button>
                </div>
              )}

            </div>
          ) : activeTab === 'retrieve' ? (
            <div className="space-y-6">
              {!retrievedText ? (
                burnStatus === 'destroyed' ? (
                  <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                      <Flame size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Self-Destruct Complete</h3>
                    <p className="text-sm text-slate-500 mb-6 text-center">
                      This file was set to "Burn after reading". It has been permanently deleted from our servers.
                    </p>
                    <button 
                      onClick={() => { setRetrievedText(''); setBurnStatus('none'); }}
                      className={`w-full py-3 px-4 font-medium ${t.textPrimary} ${t.bgLight} rounded-xl transition-colors`}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRetrieve} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 block">
                        Secure PIN
                      </label>
                      <input 
                        type="text" 
                        value={retrieveId}
                        onChange={(e) => setRetrieveId(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 582914"
                        className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 ${t.ringFocus} ${t.borderFocus} transition-all outline-none font-mono text-center tracking-widest text-lg`}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!retrieveId.trim() || isRetrieving}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 ${t.bgGradientPrimary} text-white rounded-xl font-medium shadow-lg ${t.shadow} transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100`}
                    >
                      {isRetrieving ? (
                        <><Loader2 size={18} className="animate-spin" /> {burnStatus === 'burning' ? 'Destroying...' : 'Retrieving...'}</>
                      ) : (
                        <><Download size={18} /> Retrieve Data</>
                      )}
                    </button>
                  </form>
                )
              ) : (
                <div className="animate-in fade-in zoom-in duration-300">
                  {burnStatus === 'destroyed' && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
                      <Flame size={20} className="flex-shrink-0" />
                      <p className="text-sm font-medium leading-tight">This message has self-destructed and is no longer on the server.</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-slate-700">Retrieved Text</h3>
                    <button onClick={copyRetrievedText} className={`text-xs flex items-center gap-1 ${t.textPrimary} font-medium`}>
                      <Copy size={14} /> Copy
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={retrievedText}
                    className={`w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none outline-none text-sm text-slate-700 font-mono mb-4 focus:ring-2 ${t.ringFocus}`}
                  />
                  <button 
                    onClick={() => { setRetrievedText(''); setBurnStatus('none'); }}
                    className="w-full py-3 px-4 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Vault Tab */
            <div className="space-y-4">
              {selectedVaultItem ? (
                <div className="animate-in fade-in zoom-in duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-slate-700 truncate max-w-[200px]">{selectedVaultItem.name}</h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { navigator.clipboard.writeText(selectedVaultItem.content); toast.info('Copied!'); }}
                        className={`text-xs flex items-center gap-1 ${t.textPrimary} font-medium`}
                      >
                        <Copy size={14} /> Copy
                      </button>
                      <button 
                        onClick={() => deleteVaultItem(selectedVaultItem.storageKey)}
                        className="text-xs flex items-center gap-1 text-red-500 font-medium"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Saved {new Date(selectedVaultItem.savedAt).toLocaleString()}
                  </p>
                  <textarea
                    readOnly
                    value={selectedVaultItem.content}
                    className={`w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none outline-none text-sm text-slate-700 font-mono mb-4 focus:ring-2 ${t.ringFocus}`}
                  />
                  <button 
                    onClick={() => setSelectedVaultItem(null)}
                    className="w-full py-3 px-4 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Back to Vault
                  </button>
                </div>
              ) : vaultItems.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-slate-400">
                  <HardDrive size={48} className="mb-4 opacity-30" />
                  <p className="text-sm font-medium">Your Vault is empty</p>
                  <p className="text-xs mt-1 text-center">Retrieved files and text will be automatically saved here for offline access.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">
                    {vaultItems.length} item{vaultItems.length !== 1 ? 's' : ''} saved locally
                  </p>
                  {vaultItems.map((item) => (
                    <button
                      key={item.storageKey}
                      onClick={() => setSelectedVaultItem(item)}
                      className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-left group"
                    >
                      <div className={`w-10 h-10 ${t.bgIcon} ${t.textPrimary} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        {item.type === 'text' ? <Type size={18} /> : <FileIcon size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">{new Date(item.savedAt).toLocaleString()}</p>
                      </div>
                      <Trash2 
                        size={16} 
                        className="text-slate-300 group-hover:text-red-400 transition-colors flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteVaultItem(item.storageKey); }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;
