import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const FILE_ICONS = {
  'image/jpeg':'🖼️','image/png':'🖼️','image/gif':'🖼️','image/webp':'🖼️',
  'application/pdf':'📄','video/mp4':'🎬','video/webm':'🎬',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'📝',
  'application/msword':'📝',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'📊',
  'application/vnd.ms-excel':'📊',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':'📊',
  'text/plain':'📃','folder':'📁',
  'default':'📎'
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
  const dragRef = useRef();

  const showMsg = (m,t=3000) => { setMsg(m); setTimeout(()=>setMsg(''),t); };

  const fetchFiles = () => {
    axios.get(`${API}/drive/files?parent_id=${parentId}&view=${view}`).then(r=>setFiles(r.data)).catch(()=>{});
    axios.get(`${API}/drive/stats`).then(r=>setStats(r.data)).catch(()=>{});
  };
  useEffect(()=>{ fetchFiles(); },[parentId,view]);

  const uploadFiles = async (selectedFiles) => {
    if(!selectedFiles?.length) return;
    setUploading(true); setProgress(0);
    const arr = Array.from(selectedFiles);
    for(let i=0;i<arr.length;i++){
      const f = arr[i];
      const reader = new FileReader();
      await new Promise(res => {
        reader.onload = async ev => {
          try {
            await axios.post(`${API}/drive/files`,{
              name: f.name,
              mime: f.type||'application/octet-stream',
              size: f.size,
              data: ev.target.result,
              parent_id: parentId,
              shared_with: 'all',
            });
          } catch(e){ showMsg(`Failed: ${f.name}`); }
          setProgress(Math.round((i+1)/arr.length*100));
          res();
        };
        reader.readAsDataURL(f);
      });
    }
    setUploading(false); fetchFiles();
    showMsg(`✅ ${arr.length} file${arr.length>1?'s':''} uploaded!`);
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
    await axios.post(`${API}/drive/files/${id}/star`);
    fetchFiles();
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
    dragRef.current?.classList.remove('drag-over');
    uploadFiles(e.dataTransfer.files);
  };

  const tabs = [
    {id:'all',label:'📁 All Files'},
    {id:'mine',label:'👤 My Files'},
    {id:'shared',label:'🌐 Shared'},
    {id:'starred',label:'⭐ Starred'},
  ];

  return (
    <div className="container">
      {/* Header */}
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">📁 Team Drive</h1>
          <p className="page-sub">Shared workspace for all staff · {stats.used_str||'0 B'} used</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-secondary" onClick={()=>setShowNewFolder(true)}>📁 New Folder</button>
          <button className="btn btn-primary" onClick={()=>fileRef.current.click()} disabled={uploading}>
            {uploading?`Uploading ${progress}%`:'⬆️ Upload Files'}
          </button>
          <input ref={fileRef} type="file" multiple style={{display:'none'}} onChange={e=>uploadFiles(e.target.files)}/>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Stats bar */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[['📁','Total',stats.total||0],['👤','Mine',stats.mine||0],['🌐','Shared',stats.shared||0],['⭐','Starred',stats.starred||0]].map(([icon,label,val])=>(
          <div key={label} className="card" style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:22}}>{icon}</span>
            <div><div style={{fontWeight:800,fontSize:18,color:'var(--navy)'}}>{val}</div>
            <div style={{fontSize:12,color:'var(--muted)'}}>{label}</div></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{marginBottom:16}}>
        {tabs.map(t=>(
          <button key={t.id} className={`tab-btn${view===t.id?' active':''}`}
            onClick={()=>{setView(t.id);setParentId('');setBreadcrumb([{id:'',name:'My Drive'}]);}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length>1 && (
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:14,flexWrap:'wrap'}}>
          {breadcrumb.map((b,i)=>(
            <React.Fragment key={i}>
              <button onClick={()=>goToBreadcrumb(i)}
                style={{background:'none',border:'none',cursor:'pointer',
                  color:i===breadcrumb.length-1?'var(--navy)':'var(--muted)',
                  fontWeight:i===breadcrumb.length-1?700:400,fontSize:14,fontFamily:'DM Sans,sans-serif'}}>
                {b.name}
              </button>
              {i<breadcrumb.length-1 && <span style={{color:'var(--muted)'}}>›</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Drop zone + file grid */}
      <div ref={dragRef} onDragOver={e=>{e.preventDefault();dragRef.current.classList.add('drag-over');}}
        onDragLeave={()=>dragRef.current?.classList.remove('drag-over')}
        onDrop={onDrop}
        style={{minHeight:300,borderRadius:14,border:'2px dashed transparent',transition:'all 0.2s'}}>

        {/* New Folder inline */}
        {showNewFolder && (
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,background:'white',
            borderRadius:10,padding:'12px 16px',boxShadow:'var(--shadow)'}}>
            <span style={{fontSize:24}}>📁</span>
            <input className="input" value={folderName} onChange={e=>setFolderName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&createFolder()} autoFocus
              style={{flex:1,maxWidth:300}}/>
            <button className="btn btn-primary btn-sm" onClick={createFolder}>Create</button>
            <button className="btn btn-secondary btn-sm" onClick={()=>setShowNewFolder(false)}>Cancel</button>
          </div>
        )}

        {files.length===0 ? (
          <div style={{textAlign:'center',padding:60,color:'var(--muted)'}}>
            <div style={{fontSize:64,marginBottom:12}}>📂</div>
            <h3 style={{fontWeight:700,marginBottom:6}}>No files here yet</h3>
            <p style={{marginBottom:20}}>Drag & drop files or click Upload Files</p>
            <button className="btn btn-primary" onClick={()=>fileRef.current.click()}>⬆️ Upload Files</button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
            {files.map(f=>(
              <div key={f.id} className="card" style={{padding:0,overflow:'hidden',cursor:'pointer',
                transition:'transform 0.18s,box-shadow 0.18s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 10px 28px rgba(5,19,60,0.14)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>

                {/* Thumbnail */}
                <div style={{height:120,background:'#f0f4ff',display:'flex',alignItems:'center',
                  justifyContent:'center',position:'relative',overflow:'hidden'}}
                  onClick={()=>f.type==='folder'?openFolder(f):(isPreviewable(f.mime)?setPreview(f):window.open(f.url,'_blank'))}>
                  {isImage(f.mime)&&f.url
                    ? <img src={f.url} alt={f.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <span style={{fontSize:48}}>{getIcon(f.mime,f.type)}</span>}
                  {/* Star */}
                  <button onClick={e=>{e.stopPropagation();starFile(f.id);}}
                    style={{position:'absolute',top:6,right:6,background:'rgba(255,255,255,0.85)',
                      border:'none',borderRadius:'50%',width:28,height:28,cursor:'pointer',
                      fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {f.starred?'⭐':'☆'}
                  </button>
                </div>

                {/* Info */}
                <div style={{padding:'10px 12px'}}>
                  {renaming===f.id ? (
                    <div style={{display:'flex',gap:6}}>
                      <input className="input" value={renameName} onChange={e=>setRenameName(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&renameFile(f.id)} style={{flex:1,fontSize:12,padding:'4px 8px'}} autoFocus/>
                      <button className="btn btn-primary btn-sm" style={{padding:'4px 8px'}} onClick={()=>renameFile(f.id)}>✓</button>
                    </div>
                  ) : (
                    <div style={{fontWeight:600,fontSize:13,marginBottom:4,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={f.name}>
                      {f.name}
                    </div>
                  )}
                  <div style={{fontSize:11,color:'var(--muted)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span>{f.size_str||f.created_at}</span>
                    <span style={{background:f.shared_with==='all'?'#f0fdf4':f.shared_with==='dept'?'#eff6ff':'#f9fafb',
                      color:f.shared_with==='all'?'#16a34a':f.shared_with==='dept'?'#2563eb':'#6b7280',
                      padding:'1px 6px',borderRadius:20,fontSize:10,fontWeight:600}}>
                      {f.shared_with==='all'?'Everyone':f.shared_with==='dept'?'Team':'Private'}
                    </span>
                  </div>
                  {/* Actions */}
                  <div style={{display:'flex',gap:4,marginTop:8,flexWrap:'wrap'}}>
                    {f.url && (
                      <a href={f.url} download={f.name} onClick={e=>e.stopPropagation()}
                        style={{fontSize:10,background:'var(--bg)',color:'var(--navy)',
                          padding:'3px 8px',borderRadius:20,textDecoration:'none',fontWeight:600,border:'1px solid var(--border)'}}>
                        ⬇️
                      </a>
                    )}
                    <button onClick={()=>{setRenaming(f.id);setRenameName(f.name);}}
                      style={{fontSize:10,background:'var(--bg)',color:'var(--navy)',
                        padding:'3px 8px',borderRadius:20,border:'1px solid var(--border)',cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
                      ✏️
                    </button>
                    <button onClick={()=>setShareTarget(f)}
                      style={{fontSize:10,background:'var(--bg)',color:'var(--navy)',
                        padding:'3px 8px',borderRadius:20,border:'1px solid var(--border)',cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
                      🔗
                    </button>
                    <button onClick={()=>deleteFile(f)}
                      style={{fontSize:10,background:'#fee2e2',color:'#dc2626',
                        padding:'3px 8px',borderRadius:20,border:'1px solid #fca5a5',cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share modal */}
      {shareTarget && (
        <div style={{position:'fixed',inset:0,background:'rgba(5,19,60,0.5)',display:'flex',
          alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={()=>setShareTarget(null)}>
          <div className="card" style={{width:360}} onClick={e=>e.stopPropagation()}>
            <h3 style={{fontWeight:700,marginBottom:4}}>🔗 Share "{shareTarget.name}"</h3>
            <p style={{color:'var(--muted)',fontSize:13,marginBottom:20}}>Who can access this file?</p>
            {[['all','🌐 Everyone','All staff across BIZAXL & SERIA','#f0fdf4','#16a34a'],
              ['dept','🏷️ My Department','Only people in your department','#eff6ff','#2563eb'],
              ['private','🔒 Only Me','Private — only you can see it','#f9fafb','#6b7280']
            ].map(([val,label,desc,bg,color])=>(
              <div key={val} onClick={()=>shareFile(shareTarget.id,val)}
                style={{padding:'12px 14px',borderRadius:10,marginBottom:8,cursor:'pointer',
                  background:shareTarget.shared_with===val?bg:'white',
                  border:`2px solid ${shareTarget.shared_with===val?color:'var(--border)'}`,
                  transition:'all 0.15s'}}>
                <div style={{fontWeight:700,color,fontSize:14}}>{label}</div>
                <div style={{fontSize:12,color:'var(--muted)'}}>{desc}</div>
              </div>
            ))}
            <button className="btn btn-secondary w-full" style={{marginTop:8,justifyContent:'center'}}
              onClick={()=>setShareTarget(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div style={{position:'fixed',inset:0,background:'rgba(5,19,60,0.85)',display:'flex',
          flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}
          onClick={()=>setPreview(null)}>
          <div style={{background:'white',borderRadius:16,overflow:'hidden',maxWidth:'90vw',maxHeight:'90vh',
            display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',
              borderBottom:'1px solid var(--border)'}}>
              <span style={{fontWeight:700}}>{preview.name}</span>
              <div style={{display:'flex',gap:10}}>
                <a href={preview.url} download={preview.name} className="btn btn-secondary btn-sm">⬇️ Download</a>
                <button className="btn btn-secondary btn-sm" onClick={()=>setPreview(null)}>✕</button>
              </div>
            </div>
            <div style={{flex:1,overflow:'auto',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
              {isImage(preview.mime)
                ? <img src={preview.url} alt={preview.name} style={{maxWidth:'100%',maxHeight:'70vh',objectFit:'contain',borderRadius:8}}/>
                : preview.mime==='application/pdf'
                  ? <iframe src={preview.url} title={preview.name} style={{width:'80vw',height:'70vh',border:'none'}}/>
                  : preview.mime==='video/mp4'
                    ? <video src={preview.url} controls style={{maxWidth:'100%',maxHeight:'70vh'}}/>
                    : <p>Preview not available. <a href={preview.url} target="_blank" rel="noreferrer">Open file</a></p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
