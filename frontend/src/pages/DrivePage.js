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

// Normalize legacy values ('all'/'dept') to new scheme for display
function normalizeShare(f, myDept) {
  let sw = f.shared_with;
  let depts = f.depts || [];
  let people = f.people || [];
  if (sw === 'all') sw = 'everyone';
  if (sw === 'dept') { sw = 'depts'; depts = depts.length ? depts : (myDept ? [myDept] : []); }
  return { sw, depts, people };
}

function shareLabel(f, myDept) {
  const { sw, depts, people } = normalizeShare(f, myDept);
  if (sw === 'everyone') return { text:'Everyone', bg:'rgba(20,241,177,0.1)', color:'#059669' };
  if (sw === 'private') return { text:'Private', bg:'var(--gray-100)', color:'var(--gray-400)' };
  if (sw === 'people') return { text: people.length ? `${people.length} people` : 'No one', bg:'#fdf4ff', color:'#7c3aed' };
  if (sw === 'depts') {
    if (depts.length === 1) return { text:depts[0], bg:'#eff6ff', color:'#1d4ed8' };
    if (depts.length > 1) return { text:`${depts.length} depts`, bg:'#eff6ff', color:'#1d4ed8' };
    return { text:'No one', bg:'var(--gray-100)', color:'var(--gray-400)' };
  }
  return { text:'Private', bg:'var(--gray-100)', color:'var(--gray-400)' };
}

export default function DrivePage() {
  const { user, API } = useAuth();
  const [files, setFiles] = useState([]);
  const [depts, setDepts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
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
  const [shareDraft, setShareDraft] = useState({ sw:'everyone', depts:[], people:[] });
  const [renaming, setRenaming] = useState(null);
  const [renameName, setRenameName] = useState('');
  const [uploadSharing, setUploadSharing] = useState({ sw:'everyone', depts:[], people:[] });
  const [showUploadShare, setShowUploadShare] = useState(false);
  const fileRef = useRef();
  const dropRef = useRef();
  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };
  const deptColor = (name) => depts.find(d=>d.name===name)?.color || '#71717b';

  const fetchFiles = () => {
    axios.get(`${API}/drive/files?parent_id=${parentId}&view=${view}`).then(r=>setFiles(r.data)).catch(()=>{});
    axios.get(`${API}/drive/stats`).then(r=>setStats(r.data)).catch(()=>{});
  };
  const fetchDepts = () => axios.get(`${API}/departments`).then(r=>setDepts(r.data)).catch(()=>{
    setDepts([{name:'Deployment'},{name:'Functional'},{name:'Marketing'},{name:'Research'}]);
  });
  useEffect(()=>{ fetchFiles(); },[parentId, view]);
  useEffect(()=>{ fetchDepts(); axios.get(`${API}/drive/users`).then(r=>setAllUsers(r.data)).catch(()=>{}); },[API]); // eslint-disable-line

  const buildSharePayload = (draft) => {
    if (draft.sw === 'everyone') return { shared_with:'everyone' };
    if (draft.sw === 'private') return { shared_with:'private' };
    if (draft.sw === 'mydept') return { shared_with:'depts', depts: user.department ? [user.department] : [] };
    if (draft.sw === 'people') return { shared_with:'people', people: draft.people||[] };
    return { shared_with:'depts', depts: draft.depts||[] };
  };

  const toggleDraftPerson = (uid) => {
    setShareDraft(d => ({ ...d, people: (d.people||[]).includes(uid) ? d.people.filter(x=>x!==uid) : [...(d.people||[]), uid] }));
  };

  const toggleUploadPerson = (uid) => {
    setUploadSharing(d => ({ ...d, people: (d.people||[]).includes(uid) ? d.people.filter(x=>x!==uid) : [...(d.people||[]), uid] }));
  };

  const uploadFiles = async (selectedFiles) => {
    if(!selectedFiles?.length) return;
    setUploading(true); setProgress(0);
    const arr = Array.from(selectedFiles);
    const sharePayload = buildSharePayload(uploadSharing);
    for(let i=0; i<arr.length; i++){
      const f = arr[i];
      const reader = new FileReader();
      await new Promise(res => {
        reader.onload = async ev => {
          try {
            await axios.post(`${API}/drive/files`,{
              name: f.name, mime: f.type||'application/octet-stream',
              size: f.size, data: ev.target.result,
              parent_id: parentId, ...sharePayload,
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
    const sharePayload = buildSharePayload(uploadSharing);
    await axios.post(`${API}/drive/files`,{name:folderName,type:'folder',parent_id:parentId,...sharePayload});
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

  const openShareModal = (f) => {
    const { sw, depts: fdepts, people: fpeople } = normalizeShare(f, user.department);
    let draftSw = sw;
    if (sw === 'depts' && fdepts.length === 1 && fdepts[0] === user.department) draftSw = 'mydept';
    setShareDraft({ sw: draftSw, depts: sw==='depts'?fdepts:[], people: sw==='people'?(fpeople||[]):[] });
    setShareTarget(f);
  };

  const saveShare = async () => {
    const payload = buildSharePayload(shareDraft);
    await axios.put(`${API}/drive/files/${shareTarget.id}/share`, payload);
    setShareTarget(null); fetchFiles(); showMsg('Sharing updated');
  };

  const toggleDraftDept = (name) => {
    setShareDraft(d => ({ ...d, depts: (d.depts||[]).includes(name) ? d.depts.filter(x=>x!==name) : [...(d.depts||[]), name] }));
  };

  const renameFile = async (id) => {
    if(!renameName.trim()) return;
    await axios.put(`${API}/drive/files/${id}/rename`,{name:renameName});
    setRenaming(null); fetchFiles();
  };

  const reuploadFile = async (f, file) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await axios.post(`${API}/drive/files/${f.id}/reupload`, {
          data: ev.target.result,
          mime: file.type || f.mime,
        });
        fetchFiles(); showMsg(`${f.name} re-uploaded successfully`);
      } catch(err) { showMsg('Re-upload failed'); }
    };
    reader.readAsDataURL(file);
  };

  const triggerReupload = (f) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = f.mime ? f.mime.split('/')[0] + '/*' : '*/*';
    input.onchange = (e) => { if(e.target.files[0]) reuploadFile(f, e.target.files[0]); };
    input.click();
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

  const SharingPicker = ({ draft, setDraft, isUpload }) => {
    const personToggle = isUpload ? toggleUploadPerson : toggleDraftPerson;
    const personList = draft.people || [];
    return (
    <div>
      {[
        ['everyone','Everyone','All staff across bizaxl & Seria'],
        ['mydept', user.department ? `My Department (${user.department})` : 'My Department', 'Only people in your own department'],
        ['depts','Specific Departments','Pick one or more departments who can access this'],
        ['people','Specific People','Pick individual people from the registered staff list'],
        ['private','Only Me','Private — only you can see it'],
      ].map(([val,label,desc])=>(
        <div key={val} onClick={()=>setDraft(d=>({...d, sw:val}))}
          style={{padding:'11px 13px',borderRadius:'var(--radius)',marginBottom:7,cursor:'pointer',
            background:draft.sw===val?'rgba(20,241,177,0.06)':'white',
            border:`1.5px solid ${draft.sw===val?'var(--mint)':'var(--border)'}`,
            transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:600,fontSize:13}}>{label}</div>
            <div style={{fontSize:11,color:'var(--gray-400)'}}>{desc}</div>
          </div>
          {draft.sw===val && <span style={{color:'var(--mint)',fontSize:14,fontWeight:700}}>✓</span>}
        </div>
      ))}
      {draft.sw === 'depts' && (
        <div style={{marginTop:6,marginBottom:10,paddingLeft:10}}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {depts.map(d=>{
              const sel = (draft.depts||[]).includes(d.name);
              return (
                <button key={d.name} type="button" onClick={()=>toggleDraftDept(d.name)}
                  style={{padding:'5px 12px',borderRadius:20,border:`1px solid ${sel?'var(--mint)':'var(--border)'}`,
                    background:sel?'rgba(20,241,177,0.1)':'white',color:sel?'#059669':'var(--gray-400)',
                    cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:'DM Sans,sans-serif'}}>
                  {sel?'✓ ':''}{d.name}
                </button>
              );
            })}
          </div>
          {(draft.depts||[]).length===0 && <p style={{fontSize:12,color:'#d97706',marginTop:6}}>Select at least one department.</p>}
        </div>
      )}
      {draft.sw === 'people' && (
        <div style={{marginTop:6,marginBottom:10,maxHeight:220,overflowY:'auto',border:'1px solid var(--border)',borderRadius:'var(--radius)'}}>
          {allUsers.length===0 ? (
            <div style={{padding:12,fontSize:13,color:'var(--gray-400)',textAlign:'center'}}>Loading users...</div>
          ) : allUsers.map(u=>{
            const sel = personList.includes(u.id);
            const dcolor = depts.find(d=>d.name===u.department)?.color||'#71717b';
            return (
              <div key={u.id} onClick={()=>personToggle(u.id)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',cursor:'pointer',
                  background:sel?'rgba(20,241,177,0.05)':'white',borderBottom:'1px solid #f3f4f6',transition:'background 0.1s'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:dcolor,color:'white',fontWeight:700,fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {u.name.charAt(0)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>
                  <div style={{fontSize:11,color:'#9ca3af'}}>{u.department||'—'}</div>
                </div>
                <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?'#14F1B1':'#d1d5db'}`,background:sel?'#14F1B1':'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {sel&&<span style={{fontSize:9,color:'#05133c',fontWeight:900}}>✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    );
  };

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
          <button className="btn btn-outline" onClick={()=>setShowUploadShare(!showUploadShare)}>
            Sharing: {uploadSharing.sw==='everyone'?'Everyone':uploadSharing.sw==='mydept'?'My Dept':uploadSharing.sw==='private'?'Private':uploadSharing.sw==='people'?`${(uploadSharing.people||[]).length} people`:`${(uploadSharing.depts||[]).length} dept(s)`}
          </button>
          <button className="btn btn-primary" onClick={()=>fileRef.current.click()} disabled={uploading}>
            {uploading ? `Uploading ${progress}%` : 'Upload Files'}
          </button>
          <input ref={fileRef} type="file" multiple style={{display:'none'}} onChange={e=>uploadFiles(e.target.files)}/>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Upload sharing picker — set before uploading */}
      {showUploadShare && (
        <div className="card" style={{marginBottom:20, borderTop:'3px solid var(--mint)', maxWidth:480}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
            <h3 style={{fontWeight:700, fontSize:15}}>Who can see files you upload?</h3>
            <button className="btn btn-outline btn-sm" onClick={()=>setShowUploadShare(false)}>Done</button>
          </div>
          <SharingPicker draft={uploadSharing} setDraft={setUploadSharing} isUpload={true}/>
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{marginBottom:20}}>
        {[['Total',stats.total||0],['Mine',stats.mine||0],['Shared',stats.shared||0],['Starred',stats.starred||0]].map(([l,v])=>(
          <div key={l} className="card card-sm" style={{textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:800,color:'var(--navy)'}}>{v}</div>
            <div style={{fontSize:12,color:'var(--gray-400)',marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div style={{display:'flex', gap:6, marginBottom:20}}>
        {VIEWS.map(v=>(
          <button key={v.id} onClick={()=>{ setView(v.id); setParentId(''); setBreadcrumb([{id:'',name:'My Drive'}]); }}
            className="btn btn-sm"
            style={{
              background:view===v.id?'var(--navy)':'white',
              color:view===v.id?'var(--mint)':'var(--gray-400)',
              border:`1px solid ${view===v.id?'var(--navy)':'var(--border)'}`,
              fontWeight:view===v.id?700:400,
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
            {files.map(f=>{
              const label = shareLabel(f, user.department);
              return (
              <div key={f.id} className="card" style={{padding:0,overflow:'hidden',cursor:'pointer',
                transition:'transform 0.15s,box-shadow 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='var(--shadow-md)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
                {/* File missing warning banner */}
                {f.url && f.type==='file' && !f.url.startsWith('http') && (
                  <div id={`missing-check-${f.id}`} style={{display:'none'}}/>
                )}
                <div style={{height:110,background:'var(--gray-100)',display:'flex',alignItems:'center',
                  justifyContent:'center',position:'relative',overflow:'hidden'}}
                  onClick={()=>f.type==='folder'?openFolder(f):(isPreviewable(f.mime)?setPreview(f):f.url?window.open(f.url,'_blank'):null)}>
                  {isImage(f.mime)&&f.url
                    ? <img src={f.url} alt={f.name} style={{width:'100%',height:'100%',objectFit:'cover'}}
                        onError={e=>{e.target.style.display='none'; e.target.nextSibling.style.display='flex';}}/>
                    : null}
                  <span style={{fontSize:40, display:isImage(f.mime)&&f.url?'none':'flex'}}>{getIcon(f.mime,f.type)}</span>
                  {f.type!=='folder' && (
                    <button onClick={e=>{e.stopPropagation();starFile(f.id);}}
                      style={{position:'absolute',top:6,right:6,background:'rgba(255,255,255,0.9)',
                        border:'none',borderRadius:'50%',width:26,height:26,cursor:'pointer',
                        fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',
                        boxShadow:'var(--shadow)'}}>
                      {f.starred?'⭐':'☆'}
                    </button>
                  )}
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
                    <span style={{background:label.bg, color:label.color, padding:'1px 6px',borderRadius:20,fontSize:10,fontWeight:600}} title={label.text}>
                      {label.text}
                    </span>
                  </div>
                  <div style={{display:'flex',gap:4}}>
                    {f.url && f.type==='file' ? (
                      <a href={f.url} download={f.name} onClick={e=>e.stopPropagation()}
                        className="btn btn-outline btn-sm" style={{fontSize:11,height:26,padding:'4px 8px',flex:1,justifyContent:'center'}}>
                        Download
                      </a>
                    ) : null}
                    <button onClick={()=>{setRenaming(f.id);setRenameName(f.name);}}
                      className="btn btn-outline btn-sm" style={{fontSize:11,height:26,padding:'4px 8px'}}>✏️</button>
                    <button onClick={()=>openShareModal(f)}
                      className="btn btn-outline btn-sm" style={{fontSize:11,height:26,padding:'4px 8px'}}>🔗</button>
                    <button onClick={()=>deleteFile(f)}
                      className="btn btn-danger btn-sm" style={{fontSize:11,height:26,padding:'4px 8px'}}>🗑</button>
                  </div>
                  {/* File missing warning */}
                  {!f.url && f.type==='file' && (
                    <div style={{marginTop:6, padding:'6px 8px', background:'#fef3c7', borderRadius:'var(--radius)', border:'1px solid #fde68a', display:'flex', alignItems:'center', justifyContent:'space-between', gap:6}}>
                      <span style={{fontSize:11, color:'#92400e'}}>⚠ File missing</span>
                      <button onClick={()=>triggerReupload(f)}
                        style={{fontSize:11, padding:'2px 8px', borderRadius:4, background:'#f59e0b', border:'none', cursor:'pointer', color:'white', fontFamily:'DM Sans,sans-serif', fontWeight:600}}>
                        Re-upload
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );})}
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
            <SharingPicker draft={shareDraft} setDraft={setShareDraft}/>
            <div style={{display:'flex', gap:8, marginTop:14}}>
              <button className="btn btn-primary" onClick={saveShare}>Save</button>
              <button className="btn btn-outline" onClick={()=>setShareTarget(null)}>Cancel</button>
            </div>
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
