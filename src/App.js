import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Download, Copy, Check, File as FileIcon, Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'retrieve'
  
  // Upload State
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedId, setUploadedId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Retrieve State
  const [retrieveId, setRetrieveId] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);

  // Handlers for Upload
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadedId(''); // Reset if new file selected
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadedId('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      setUploadedId(response.data.id);
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uploadedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.info('ID copied to clipboard');
  };

  const clearUpload = () => {
    setFile(null);
    setUploadedId('');
    setUploadProgress(0);
  };

  // Handlers for Retrieve
  const handleRetrieve = async (e) => {
    e.preventDefault();
    if (!retrieveId.trim()) return;

    setIsRetrieving(true);
    try {
      // Quickly ping backend to ensure ID exists
      await axios.get(`${API_BASE_URL}/info/${retrieveId}`);
      
      // Trigger native browser download to handle any file size and keep exact names
      window.location.href = `${API_BASE_URL}/download/${retrieveId}`;
      
      toast.success('Download starting...');
      setRetrieveId('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error retrieving file. Invalid ID?');
    } finally {
      setIsRetrieving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 selection:bg-indigo-200">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden transition-all duration-300">
        
        {/* Header / Tabs */}
        <div className="flex border-b border-slate-200/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <Upload size={18} /> Upload
          </button>
          <button
            onClick={() => setActiveTab('retrieve')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'retrieve' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'}`}
          >
            <Download size={18} /> Retrieve
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
              Online Clipboard
            </h1>
            <p className="text-slate-500 text-sm">
              {activeTab === 'upload' ? 'Upload a file and get a unique ID to share.' : 'Enter a unique ID to retrieve your file.'}
            </p>
          </div>

          {activeTab === 'upload' ? (
            <div className="space-y-6">
              
              {!uploadedId ? (
                <>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 
                      ${isDragging ? 'border-indigo-500 bg-indigo-100 scale-[1.02]' : file ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'}`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    
                    {file ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                          <FileIcon size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        {isUploading && (
                          <div className="w-full max-w-[200px] mt-2">
                            <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 transition-all duration-300" 
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-slate-500">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-1">
                          <Upload size={24} />
                        </div>
                        <p className="text-sm font-medium">Click to browse or drag and drop</p>
                        <p className="text-xs opacity-70">Any file type up to 1 GB</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {file && (
                      <button 
                        onClick={clearUpload}
                        disabled={isUploading}
                        className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={handleUpload}
                      disabled={!file || isUploading}
                      className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isUploading ? (
                        <><Loader2 size={18} className="animate-spin" /> Uploading...</>
                      ) : (
                        'Upload File'
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
                  <p className="text-sm text-slate-500 mb-6 text-center">Your file is safely stored. Share this ID to let others download it.</p>
                  
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-1 flex items-center justify-between mb-6">
                    <span className="font-mono text-lg font-bold text-indigo-600 tracking-wider pl-4 py-2">
                      {uploadedId}
                    </span>
                    <button 
                      onClick={copyToClipboard}
                      className="p-3 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm flex items-center gap-2 text-sm font-medium text-slate-600"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <button 
                    onClick={clearUpload}
                    className="w-full py-3 px-4 font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                  >
                    Upload Another File
                  </button>
                </div>
              )}

            </div>
          ) : (
            <form onSubmit={handleRetrieve} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">
                  File ID
                </label>
                <input 
                  type="text" 
                  value={retrieveId}
                  onChange={(e) => setRetrieveId(e.target.value)}
                  placeholder="e.g. 1a2b3c4d"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none font-mono text-center tracking-widest text-lg"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!retrieveId.trim() || isRetrieving}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {isRetrieving ? (
                  <><Loader2 size={18} className="animate-spin" /> Retrieving...</>
                ) : (
                  <><Download size={18} /> Retrieve File</>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;
