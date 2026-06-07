import React from 'react';

const VALUES = [
  { icon:'🔍', title:'Truth & Honesty', desc:'We are transparent about what our software can and cannot do. We never over-promise or use misleading claims to win business.' },
  { icon:'❤️', title:'Compassion & Empathy', desc:'We listen with care and respond with kindness. We treat every customer as a fellow human, not just a ticket or a revenue number.' },
  { icon:'🙏', title:'Respect', desc:'We respect the courage and hard work of every MSME owner. We never talk down or treat them as "small" because of their current size.' },
  { icon:'⚡', title:'Reliability', desc:'When a small business depends on us, delays hurt real people. We commit to being consistently dependable — in our product, support, and promises.' },
  { icon:'🌱', title:'Empowerment', desc:'Our goal is not to make customers dependent on us forever, but to make them stronger, smarter, and more confident in their own business.' },
];

const PROMISES = [
  'Honest advice, even if it means we sell you less.',
  'Patient support that respects your pace and understanding.',
  'Solutions designed with real care for your challenges.',
  'A team that celebrates your wins as if they were our own.',
  'A partner that treats you with dignity and genuine respect.',
];

const STANDS = [
  ['Trust','through Truth'], ['Loyalty','through Honesty'], ['Respect','through Humility'],
  ['Connection','through Compassion'], ['Confidence','through Reliability'], ['Empowerment','through Patience'],
  ['Growth','through Transparency'], ['Peace','through Simplicity'], ['Partnership','through Warmth'],
  ['Dignity','through Respect'], ['Success','through Integrity'], ['Ease','through Clarity'],
];

export default function AboutPage() {
  return (
    <div className="page-container">
      {/* Hero */}
      <div style={{background:'var(--navy)', borderRadius:16, padding:'48px', marginBottom:28, position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
        <div style={{position:'absolute', bottom:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(20,241,177,0.05)'}}/>
        <img src="/static/logo.svg" alt="Bizaxl" style={{height:32, filter:'brightness(0) invert(1)', marginBottom:24}}/>
        <div style={{fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#14F1B1', marginBottom:12}}>Our Mission</div>
        <h1 style={{fontSize:32, fontWeight:700, color:'white', lineHeight:1.4, marginBottom:8, maxWidth:600}}>
          We don't just build software.
          <span style={{color:'#14F1B1'}}> We build confidence, dignity, and growth.</span>
        </h1>
        <p style={{color:'rgba(255,255,255,0.55)', fontSize:15, maxWidth:500}}>
          For every MSME in India — from the retailer who built from nothing to the manufacturer who scaled against all odds.
        </p>
      </div>

      <div className="grid-2" style={{marginBottom:28}}>
        {/* Contact */}
        <div className="card">
          <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:16}}>Contact Us</div>
          {[
            { label:'Email', value:'markcom@bizaxl.com', href:'mailto:markcom@bizaxl.com' },
            { label:'Phone', value:'+91 98867 11156', href:'tel:+919886711156' },
            { label:'Website', value:'bizaxl.com', href:'https://bizaxl.com' },
          ].map(c=>(
            <div key={c.label} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)'}}>
              <span style={{color:'var(--gray-400)', fontSize:14}}>{c.label}</span>
              <a href={c.href} target="_blank" rel="noreferrer" style={{color:'var(--navy)', fontWeight:600, fontSize:14, textDecoration:'none'}}>{c.value}</a>
            </div>
          ))}
        </div>

        {/* Guiding principle */}
        <div style={{background:'var(--navy)', borderRadius:'var(--radius-lg)', padding:24, position:'relative', overflow:'hidden'}}>
          <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
          <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#14F1B1', marginBottom:16}}>Guiding Principle</div>
          <h2 style={{fontSize:24, fontWeight:700, color:'white', lineHeight:1.4}}>
            Human First.<br/>
            <span style={{color:'#14F1B1'}}>AI Second.</span><br/>
            Always.
          </h2>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:12}}>
            AI removes repetitive work. Human judgment, care, and relationships remain at the center of everything we do.
          </p>
        </div>
      </div>

      {/* Core values */}
      <div className="card" style={{marginBottom:24}}>
        <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:20}}>Our 5 Core Values</div>
        <div style={{display:'flex', flexDirection:'column', gap:0}}>
          {VALUES.map((v,i)=>(
            <div key={v.title} style={{display:'flex', gap:16, padding:'16px 0', borderBottom: i<VALUES.length-1?'1px solid var(--border)':'none'}}>
              <div style={{width:40, height:40, borderRadius:'var(--radius)', background:'var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0}}>
                {v.icon}
              </div>
              <div>
                <div style={{fontWeight:700, marginBottom:4}}>{v.title}</div>
                <p style={{fontSize:14, color:'var(--gray-400)', lineHeight:1.6}}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{marginBottom:24}}>
        {/* The Bizaxl Promise */}
        <div className="card">
          <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:16}}>The Bizaxl Promise</div>
          {PROMISES.map((p,i)=>(
            <div key={i} style={{display:'flex', gap:12, padding:'10px 0', borderBottom: i<PROMISES.length-1?'1px solid var(--border)':'none'}}>
              <div style={{width:20, height:20, borderRadius:'50%', background:'rgba(20,241,177,0.15)', border:'1px solid rgba(20,241,177,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1}}>
                <div style={{width:6, height:6, borderRadius:'50%', background:'#14F1B1'}}/>
              </div>
              <p style={{fontSize:14, color:'var(--navy)', lineHeight:1.6}}>{p}</p>
            </div>
          ))}
        </div>

        {/* What we stand for */}
        <div className="card">
          <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:16}}>What We Stand For</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            {STANDS.map(([main,sub])=>(
              <div key={main} style={{padding:'10px 12px', background:'var(--gray-100)', borderRadius:'var(--radius)', borderLeft:'2px solid #14F1B1'}}>
                <div style={{fontWeight:700, fontSize:13, color:'var(--navy)'}}>{main}</div>
                <div style={{fontSize:12, color:'var(--gray-400)'}}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Before every message */}
      <div style={{background:'var(--navy)', borderRadius:'var(--radius-lg)', padding:28, position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
        <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'#14F1B1', marginBottom:16}}>Before Every Message — Ask Yourself</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          {['Does this sound warm and human?','Am I being fully honest?','Have I shown respect and empathy?','Would I say this to a family member who runs a business?'].map(q=>(
            <div key={q} style={{display:'flex', gap:10, alignItems:'center', padding:'12px 14px', background:'rgba(255,255,255,0.05)', borderRadius:'var(--radius)', border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{width:18, height:18, borderRadius:4, background:'rgba(20,241,177,0.2)', border:'1px solid rgba(20,241,177,0.4)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <span style={{fontSize:10, color:'#14F1B1'}}>✓</span>
              </div>
              <span style={{fontSize:13, color:'rgba(255,255,255,0.8)'}}>{q}</span>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center', marginTop:16, fontStyle:'italic', color:'rgba(255,255,255,0.4)', fontSize:13}}>
          "Warmth in every interaction." — Bizaxl Communication Standard
        </div>
      </div>
    </div>
  );
}
