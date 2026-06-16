import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const FILE_ICONS = {
  'image/jpeg':'🖼️','image/png':'🖼️','image/gif':'🖼️','image/webp':'🖼️',
  'application/pdf':'📄','video/mp4':'🎬','video/webm':'🎬',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'📝',
  'application/msword':'📝',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'📊',
  'text/plain':'📃','folder':'📁','default':'📎'
};
const getIcon = (mime,type) => type==='folder'?'📁':(FILE_ICONS[mime]||FILE_ICONS['default']);
const isImage = mime => ['image/jpeg','image/png','image/gif','image/webp'].includes(mime);
const isPreviewable = mime => isImage(mime)||mime==='application/pdf'||mime==='video/mp4';
function humanSize(b){
  if(!b) return '';
  if(b<1024) return `${b} B`;
  if(b<1024**2) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1024**2).toFixed(1)} MB`;
}

export default function DrivePage() {
  const { user, API } = useAuth();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({});
  const [view, setView] = useState('all');
  const [parentId, setParentId] = useState('');
  const [breadcrumb, setBreadcrumb] = useState([{id:'',name:'My Drive'}]);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('New Folder');
  const [shareTarget, setShareTarget] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameName, setRenameName] = useState('');
  const fileRef = useRef();
  const dropRef = useRef();
  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };

  const fetchFiles = () => {
    axios.get(`${API}/drive/files?parent_id=${parentId}&view=${view}`).then(r=>setFiles(r.data)).catch(()=>{});
    axios.get(`${API}/drive/stats`).then(r=>setStats(r.data)).catch(()=>{});
  };
  useEffect(()=>{ fetchFiles(); },[parentId, view]);

  const uploadFiles = async (selectedFiles) => {
    if(!selectedFiles?.length) return;
    setUploading(true); setProgress(0);
    const arr = Array.from(selectedFiles);
    for(let i=0; i<arr.length; i++){
      const f = arr[i];
      const reader = new FileReader();
      await new Promise(res => {
        reader.onload = async ev => {
          try {
            await axios.post(`${API}/drive/files`,{
              name: f.name, mime: f.type||'application/octet-stream',
              size: f.size, data: ev.target.result,
              parent_id: parentId, shared_with:'all',
            });
          } catch(e){ showMsg(`Failed: ${f.name}`); }
          setProgress(Math.round((i+1)/arr.length*100)); res();
        };
        reader.readAsDataURL(f);
      });
    }
    setUploading(false); fetchFiles(); showMsg(`${arr.length} file${arr.length>1?'s':''} uploaded`);
  };

  const createFolder = async () => {
    if(!folderName.trim()) return;
    await axios.post(`${API}/drive/files`,{name:folderName,type:'folder',parent_id:parentId,shared_with:'all'});
    setShowNewFolder(false); setFolderName('New Folder'); fetchFiles();
  };

  const openFolder = (f) => {
    setParentId(f.id);
    setBreadcrumb(b=>[...b,{id:f.id,name:f.name}]);
    setView('all');
  };

  const goToBreadcrumb = (idx) => {
    const crumb = breadcrumb[idx];
    setParentId(crumb.id);
    setBreadcrumb(b=>b.slice(0,idx+1));
  };

  const starFile = async (id) => {
    await axios.post(`${API}/drive/files/${id}/star`); fetchFiles();
  };

  const deleteFile = async (f) => {
    if(!window.confirm(`Delete "${f.name}"?`)) return;
    await axios.delete(`${API}/drive/files/${f.id}`);
    fetchFiles(); showMsg('Deleted');
  };

  const shareFile = async (id, sw) => {
    await axios.put(`${API}/drive/files/${id}/share`,{shared_with:sw});
    setShareTarget(null); fetchFiles();
  };

  const renameFile = async (id) => {
    if(!renameName.trim()) return;
    await axios.put(`${API}/drive/files/${id}/rename`,{name:renameName});
    setRenaming(null); fetchFiles();
  };

  const onDrop = (e) => {
    e.preventDefault();
    dropRef.current?.classList.remove('drag-over');
    uploadFiles(e.dataTransfer.files);
  };

  const VIEWS = [
    {id:'all', label:'All Files'},
    {id:'mine', label:'My Files'},
    {id:'shared', label:'Shared'},
    {id:'starred', label:'Starred'},
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">Team Drive</h1>
          <p className="page-subtitle">Shared workspace for all staff · {stats.used_str||'0 B'} used</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-outline" onClick={()=>setShowNewFolder(true)}>New Folder</button>
          <button className="btn btn-primary" onClick={()=>fileRef.current.click()} disabled={uploading}>
            {uploading ? `Uploading ${progress}%` : 'Upload Files'}
          </button>
          <input ref={fileRef} type="file" multiple style={{display:'none'}} onChange={e=>uploadFiles(e.target.files)}/>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Stats */}
      <div className="grid-4" style={{marginBottom:20}}>
        {[['Total',stats.total||0],['Mine',stats.mine||0],['Shared',stats.shared||0],['Starred',stats.starred||0]].map(([l,v])=>(
          <div key={l} className="card card-sm" style={{textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:800,color:'var(--navy)'}}>{v}</div>
            <div style={{fontSize:12,color:'var(--gray-400)',marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* View tabs — clean design */}
      <div style={{display:'flex', gap:6, marginBottom:20}}>
        {VIEWS.map(v=>(
          <button key={v.id} onClick={()=>{ setView(v.id); setParentId(''); setBreadcrumb([{id:'',name:'My Drive'}]); }}
            className={`btn btn-sm`}
            style={{
              background: view===v.id ? 'var(--navy)' : 'white',
              color: view===v.id ? 'var(--mint)' : 'var(--gray-400)',
              border: `1px solid ${view===v.id ? 'var(--navy)' : 'var(--border)'}`,
              fontWeight: view===v.id ? 700 : 500,
            }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 1 && (
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:14,flexWrap:'wrap'}}>
          {breadcrumb.map((b,i)=>(
            <React.Fragment key={i}>
              <button onClick={()=>goToBreadcrumb(i)}
                style={{background:'none',border:'none',cursor:'pointer',padding:'2px 4px',
                  color:i===breadcrumb.length-1?'var(--navy)':'var(--gray-400)',
                  fontWeight:i===breadcrumb.length-1?700:400,fontSize:13,fontFamily:'DM Sans,sans-serif'}}>
                {b.name}
              </button>
              {i<breadcrumb.length-1 && <span style={{color:'var(--gray-400)',fontSize:12}}>›</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div ref={dropRef}
        onDragOver={e=>{e.preventDefault();dropRef.current.style.borderColor='var(--mint)';}}
        onDragLeave={()=>{if(dropRef.current)dropRef.current.style.borderColor='transparent';}}
        onDrop={onDrop}
        style={{minHeight:200,borderRadius:'var(--radius-lg)',border:'2px dashed transparent',transition:'border-color 0.2s'}}>

        {showNewFolder && (
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,background:'white',
            borderRadius:'var(--radius)',padding:'12px 16px',border:'1px solid var(--border)',boxShadow:'var(--shadow)'}}>
            <span style={{fontSize:20}}>📁</span>
            <input className="input" value={folderName} style={{flex:1,maxWidth:280}}
              onChange={e=>setFolderName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&createFolder()} autoFocus/>
            <button className="btn btn-primary btn-sm" onClick={createFolder}>Create</button>
            <button className="btn btn-outline btn-sm" onClick={()=>setShowNewFolder(false)}>Cancel</button>
          </div>
        )}

        {files.length===0 ? (
          <div style={{textAlign:'center',padding:'60px 20px',border:'2px dashed var(--border)',borderRadius:'var(--radius-lg)',background:'white'}}>
            <div style={{fontSize:48,marginBottom:12,opacity:0.4}}>📂</div>
            <h3 style={{fontWeight:600,marginBottom:6,color:'var(--navy)'}}>No files here</h3>
            <p style={{color:'var(--gray-400)',marginBottom:20,fontSize:14}}>Drag & drop files or click Upload</p>
            <button className="btn btn-primary" onClick={()=>fileRef.current.click()}>Upload Files</button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
            {files.map(f=>(
              <div key={f.id} className="card" style={{padding:0,overflow:'hidden',cursor:'pointer',
                transition:'transform 0.15s,box-shadow 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='var(--shadow-md)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
                <div style={{height:110,background:'var(--gray-100)',display:'flex',alignItems:'center',
                  justifyContent:'center',position:'relative',overflow:'hidden'}}
                  onClick={()=>f.type==='folder'?openFolder(f):(isPreviewable(f.mime)?setPreview(f):window.open(f.url,'_blank'))}>
                  {isImage(f.mime)&&f.url
                    ? <img src={f.url} alt={f.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <span style={{fontSize:40}}>{getIcon(f.mime,f.type)}</span>}
                  <button onClick={e=>{e.stopPropagation();starFile(f.id);}}
                    style={{position:'absolute',top:6,right:6,background:'rgba(255,255,255,0.9)',
                      border:'none',borderRadius:'50%',width:26,height:26,cursor:'pointer',
                      fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',
                      boxShadow:'var(--shadow)'}}>
                    {f.starred?'⭐':'☆'}
                  </button>
                </div>
                <div style={{padding:'10px 12px'}}>
                  {renaming===f.id ? (
                    <div style={{display:'flex',gap:4}}>
                      <input className="input" value={renameName} style={{flex:1,fontSize:12,height:28,padding:'4px 8px'}}
                        onChange={e=>setRenameName(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&renameFile(f.id)} autoFocus/>
                      <button className="btn btn-primary btn-sm" style={{height:28,padding:'4px 8px'}} onClick={()=>renameFile(f.id)}>✓</button>
                    </div>
                  ) : (
                    <div style={{fontWeight:600,fontSize:13,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={f.name}>
                      {f.name}
                    </div>
                  )}
                  <div style={{fontSize:11,color:'var(--gray-400)',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span>{f.size_str||f.created_at}</span>
                    <span style={{background:f.shared_with==='all'?'rgba(20,241,177,0.1)':f.shared_with==='dept'?'#eff6ff':'var(--gray-100)',
                      color:f.shared_with==='all'?'#059669':f.shared_with==='dept'?'var(--blue)':'var(--gray-400)',
                      padding:'1px 6px',borderRadius:20,fontSize:10,fontWeight:600}}>
                      {f.shared_with==='all'?'Everyone':f.shared_with==='dept'?'Team':'Private'}
                    </span>
                  </div>
                  <div style={{display:'flex',gap:4}}>
                    {f.url && (
                      <a href={f.url} download={f.name} onClick={e=>e.stopPropagation()}
                        className="btn btn-outline btn-sm" style={{fontSize:11,height:26,padding:'4px 8px',flex:1,justifyContent:'center'}}>
                        Download
                      </a>
                    )}
                    <button onClick={()=>{setRenaming(f.id);setRenameName(f.name);}}
                      className="btn btn-outline btn-sm" style={{fontSize:11,height:26,padding:'4px 8px'}}>✏️</button>
                    <button onClick={()=>setShareTarget(f)}
                      className="btn btn-outline btn-sm" style={{fontSize:11,height:26,padding:'4px 8px'}}>🔗</button>
                    <button onClick={()=>deleteFile(f)}
                      className="btn btn-danger btn-sm" style={{fontSize:11,height:26,padding:'4px 8px'}}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share modal */}
      {shareTarget && (
        <div className="modal-overlay" onClick={()=>setShareTarget(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Share "{shareTarget.name}"</h3>
              <button className="btn btn-outline btn-sm" onClick={()=>setShareTarget(null)}>✕</button>
            </div>
            <p style={{color:'var(--gray-400)',fontSize:13,marginBottom:16}}>Who can access this file?</p>
            {[['all','Everyone','All staff across bizaxl & Seria'],
              ['dept','My Department','Only people in your department'],
              ['private','Only Me','Private — only you can see it']
            ].map(([val,label,desc])=>(
              <div key={val} onClick={()=>shareFile(shareTarget.id,val)}
                style={{padding:'12px 14px',borderRadius:'var(--radius)',marginBottom:8,cursor:'pointer',
                  background:shareTarget.shared_with===val?'rgba(20,241,177,0.06)':'white',
                  border:`1.5px solid ${shareTarget.shared_with===val?'var(--mint)':'var(--border)'}`,
                  transition:'all 0.15s'}}>
                <div style={{fontWeight:600,fontSize:14}}>{label}</div>
                <div style={{fontSize:12,color:'var(--gray-400)'}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="modal-overlay" onClick={()=>setPreview(null)}>
          <div style={{background:'white',borderRadius:'var(--radius-xl)',overflow:'hidden',
            maxWidth:'90vw',maxHeight:'90vh',display:'flex',flexDirection:'column',
            boxShadow:'0 20px 60px rgba(5,19,60,0.3)'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'14px 20px',display:'flex',justifyContent:'space-between',
              alignItems:'center',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontWeight:600,fontSize:14}}>{preview.name}</span>
              <div style={{display:'flex',gap:8}}>
                <a href={preview.url} download={preview.name} className="btn btn-outline btn-sm">Download</a>
                <button className="btn btn-outline btn-sm" onClick={()=>setPreview(null)}>✕</button>
              </div>
            </div>
            <div style={{flex:1,overflow:'auto',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
              {isImage(preview.mime)
                ? <img src={preview.url} alt={preview.name} style={{maxWidth:'100%',maxHeight:'70vh',objectFit:'contain',borderRadius:'var(--radius)'}}/>
                : preview.mime==='application/pdf'
                  ? <iframe src={preview.url} title={preview.name} style={{width:'80vw',height:'70vh',border:'none'}}/>
                  : <video src={preview.url} controls style={{maxWidth:'100%',maxHeight:'70vh'}}/>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
