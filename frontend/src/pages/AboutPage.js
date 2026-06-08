import React, { useState } from 'react';

const VALUES = [
  { icon:'🔍', title:'Truth & Honesty', desc:'We are completely transparent about what our software can and cannot do. We never over-promise. Honesty may cost us in the short term — but it earns lasting loyalty, and that is the only kind of growth we want.' },
  { icon:'❤️', title:'Compassion & Empathy', desc:'Running a small business is hard. We never forget that. We listen with care, respond with kindness, and treat every customer as a fellow human being — not a ticket or a revenue number.' },
  { icon:'🙏', title:'Respect', desc:'We respect the courage and hard work of every MSME owner. We never talk down to them, use confusing jargon, or treat them as "small" because of their current size. Every customer deserves dignity.' },
  { icon:'⚡', title:'Reliability', desc:'When a small business depends on us, delays hurt real people and real families. We commit to being consistently dependable — in our product, our support, and our promises.' },
  { icon:'🌱', title:'Empowerment', desc:'Our goal is not to make customers dependent on us forever. It is to make them stronger, smarter, and more confident in their own business. We celebrate their independence.' },
];

const PRINCIPLES = [
  { title:'Human First. AI Second. Always.', desc:'AI removes repetitive work. Human judgment, care, and relationships will always remain at the center of everything we do at Bizaxl.' },
  { title:'Warmth in Every Interaction', desc:'Every email, every call, every message should feel like it\'s coming from a caring partner — not a cold corporation. We reject robotic, blunt, or jargon-filled language.' },
  { title:'Long-term Relationship over Short-term Profit', desc:'We would rather lose a sale today than win it by misleading a customer. We are here for the lifetime relationship, not the quick win.' },
  { title:'Radical Transparency', desc:'We openly share our product roadmap, known limitations, pricing logic, and data practices. We welcome honest feedback — even the difficult kind.' },
  { title:'Continuous Humility', desc:'We acknowledge that we don\'t know everything. We learn from our customers, admit mistakes quickly, and keep improving.' },
];

const STANDS = [
  ['Trust','through Truth'], ['Loyalty','through Honesty'], ['Respect','through Humility'],
  ['Connection','through Compassion'], ['Confidence','through Reliability'], ['Empowerment','through Patience'],
  ['Growth','through Transparency'], ['Peace','through Simplicity'], ['Partnership','through Warmth'],
  ['Dignity','through Respect'], ['Success','through Integrity'], ['Ease','through Clarity'],
];

const PROMISES = [
  'Honest advice, even if it means we sell you less.',
  'Patient support that respects your pace and understanding.',
  'Solutions designed with real care for your challenges.',
  'A team that celebrates your wins as if they were our own.',
  'A partner that treats you with dignity and genuine respect.',
];

const CHECKS = [
  'Does this sound warm and human?',
  'Am I being fully honest?',
  'Have I shown respect and empathy?',
  'Would I say this to a family member who runs a business?',
];

const TABS = ['Mission','Values','Principles','Promise','Team Note'];

export default function AboutPage() {
  const [tab, setTab] = useState('Mission');

  return (
    <div className="page-container">
      {/* Hero */}
      <div style={{background:'var(--navy)', borderRadius:16, padding:'44px 48px', marginBottom:24, position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
        <div style={{position:'absolute', bottom:-80, right:-80, width:260, height:260, borderRadius:'50%', background:'rgba(20,241,177,0.04)'}}/>
        <img src="/static/logo.svg" alt="Bizaxl" style={{height:30, filter:'brightness(0) invert(1)', marginBottom:20}}/>
        <p style={{fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--mint)', marginBottom:12}}>Our Mission</p>
        <h1 style={{fontSize:26, fontWeight:700, color:'white', lineHeight:1.5, maxWidth:620, marginBottom:12}}>
          We don't just build software.<br/>
          <span style={{color:'var(--mint)'}}>We build confidence, dignity, and growth.</span>
        </h1>
        <p style={{color:'rgba(255,255,255,0.55)', fontSize:14, maxWidth:580, lineHeight:1.8, marginBottom:24}}>
          For every MSME in India — from the retailer who built from nothing to the manufacturer who scaled against all odds — Bizaxl exists as their <strong style={{color:'rgba(255,255,255,0.8)'}}>Business Growth Engine</strong>.
        </p>
        <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
          {[['markcom@bizaxl.com','mailto:markcom@bizaxl.com'],['+91 98867 11156','tel:+919886711156'],['bizaxl.com','https://bizaxl.com']].map(([label,href])=>(
            <a key={label} href={href} target="_blank" rel="noreferrer"
              style={{color:'var(--mint)', fontSize:13, fontWeight:600, textDecoration:'none', padding:'6px 14px', background:'rgba(20,241,177,0.08)', borderRadius:8, border:'1px solid rgba(20,241,177,0.2)'}}>
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Tab nav */}
      <div className="tabs" style={{marginBottom:24}}>
        {TABS.map(t=>(
          <button key={t} className={`tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>{t}</button>
        ))}
      </div>

      {/* Mission */}
      {tab==='Mission' && (
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          <div className="card">
            <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:16}}>Who We Are</div>
            <p style={{fontSize:15, lineHeight:1.9, color:'var(--navy)', marginBottom:16}}>
              Bizaxl is a <strong>Business Growth Engine built for Indian MSMEs</strong>.
            </p>
            <p style={{fontSize:14, lineHeight:1.9, color:'var(--gray-400)', marginBottom:14}}>
              We know that behind every small business is a real person — carrying stress, responsibility, and big dreams for their family. That's why we don't just solve software problems. We show up as partners. We listen before we speak. We care before we sell.
            </p>
            <p style={{fontSize:14, lineHeight:1.9, color:'var(--gray-400)'}}>
              In a world rushing toward AI and automation, we believe technology should never distance us from our humanity. It should free business owners from drudgery so they can focus on what truly matters — their dreams, their families, and their growth.
            </p>
          </div>

          <div className="grid-2">
            <div style={{background:'var(--navy)', borderRadius:'var(--radius-lg)', padding:24, position:'relative', overflow:'hidden'}}>
              <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#14F1B1,#114EFF)'}}/>
              <p style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--mint)', marginBottom:14}}>Guiding Principle</p>
              <h3 style={{fontSize:22, fontWeight:700, color:'white', lineHeight:1.5}}>Human First.<br/><span style={{color:'var(--mint)'}}>AI Second. Always.</span></h3>
              <p style={{color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:10, lineHeight:1.7}}>AI removes repetitive work. Human judgment, care, and relationships will always remain at the center of everything we do at Bizaxl.</p>
            </div>

            <div className="card">
              <p style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:14}}>What We Stand For</p>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                {STANDS.map(([main,sub])=>(
                  <div key={main} style={{padding:'8px 12px', background:'var(--gray-100)', borderRadius:'var(--radius)', borderLeft:'2px solid var(--mint)'}}>
                    <div style={{fontWeight:700, fontSize:12, color:'var(--navy)'}}>{main}</div>
                    <div style={{fontSize:11, color:'var(--gray-400)'}}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Values */}
      {tab==='Values' && (
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <div className="card" style={{padding:'16px 20px', borderLeft:'3px solid var(--mint)', background:'rgba(20,241,177,0.03)'}}>
            <p style={{fontSize:14, color:'var(--navy)', lineHeight:1.7, fontStyle:'italic'}}>
              "These are not just words on a page. These are the five commitments that guide every decision, every product, and every conversation at Bizaxl."
            </p>
          </div>
          {VALUES.map((v,i)=>(
            <div key={v.title} className="card" style={{display:'flex', gap:16, alignItems:'flex-start'}}>
              <div style={{width:44, height:44, background:'var(--gray-100)', borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0}}>
                {v.icon}
              </div>
              <div>
                <h3 style={{fontWeight:700, fontSize:15, marginBottom:6}}>{v.title}</h3>
                <p style={{fontSize:14, color:'var(--gray-400)', lineHeight:1.8}}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Principles */}
      {tab==='Principles' && (
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          {PRINCIPLES.map((p,i)=>(
            <div key={p.title} className="card">
              <div style={{display:'flex', gap:14, alignItems:'flex-start'}}>
                <div style={{width:28, height:28, borderRadius:'50%', background:'rgba(20,241,177,0.12)', border:'1px solid rgba(20,241,177,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2}}>
                  <span style={{fontSize:12, color:'var(--mint)', fontWeight:800}}>{i+1}</span>
                </div>
                <div>
                  <h3 style={{fontWeight:700, fontSize:15, marginBottom:6, color:'var(--navy)'}}>{p.title}</h3>
                  <p style={{fontSize:14, color:'var(--gray-400)', lineHeight:1.8}}>{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Promise */}
      {tab==='Promise' && (
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          <div style={{background:'var(--navy)', borderRadius:'var(--radius-lg)', padding:'28px 32px', position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
            <p style={{fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--mint)', marginBottom:14}}>Our Commitment to You</p>
            <h2 style={{fontSize:22, fontWeight:700, color:'white', marginBottom:20}}>The Bizaxl Promise</h2>
            {PROMISES.map((p,i)=>(
              <div key={i} style={{display:'flex', gap:12, alignItems:'center', padding:'12px 0', borderBottom: i<PROMISES.length-1?'1px solid rgba(255,255,255,0.08)':'none'}}>
                <div style={{width:20, height:20, borderRadius:'50%', background:'rgba(20,241,177,0.15)', border:'1px solid rgba(20,241,177,0.4)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <div style={{width:6, height:6, borderRadius:'50%', background:'var(--mint)'}}/>
                </div>
                <p style={{fontSize:14, color:'rgba(255,255,255,0.8)', lineHeight:1.6}}>{p}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <p style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:16}}>What We Stand For</p>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8}}>
              {STANDS.map(([main,sub])=>(
                <div key={main} style={{padding:'10px 12px', background:'var(--gray-100)', borderRadius:'var(--radius)', borderLeft:'2px solid var(--mint)'}}>
                  <div style={{fontWeight:700, fontSize:13, color:'var(--navy)'}}>{main}</div>
                  <div style={{fontSize:12, color:'var(--gray-400)'}}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Note */}
      {tab==='Team Note' && (
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          <div className="card" style={{borderLeft:'3px solid var(--mint)'}}>
            <h2 style={{fontWeight:700, fontSize:18, marginBottom:8}}>A Note to Every Bizaxl Team Member</h2>
            <p style={{fontSize:14, color:'var(--gray-400)', lineHeight:1.8}}>
              This is not just a company document. This is who we are.
            </p>
          </div>

          <div style={{background:'var(--navy)', borderRadius:'var(--radius-lg)', padding:'28px 32px', position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
            <p style={{fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--mint)', marginBottom:16}}>Before Every Message — Ask Yourself</p>
            <div style={{display:'flex', flexDirection:'column', gap:10, marginBottom:24}}>
              {CHECKS.map((c,i)=>(
                <div key={i} style={{display:'flex', gap:12, alignItems:'center', padding:'12px 16px', background:'rgba(255,255,255,0.05)', borderRadius:'var(--radius)', border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{width:20, height:20, borderRadius:4, background:'rgba(20,241,177,0.2)', border:'1px solid rgba(20,241,177,0.4)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                    <span style={{fontSize:11, color:'var(--mint)', fontWeight:800}}>✓</span>
                  </div>
                  <span style={{fontSize:14, color:'rgba(255,255,255,0.85)'}}>{c}</span>
                </div>
              ))}
            </div>
            <div style={{borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:20}}>
              <p style={{fontSize:15, color:'white', lineHeight:1.8, marginBottom:8}}>
                Every customer you speak to has a person at Bizaxl.
              </p>
              <p style={{fontSize:18, fontWeight:700, color:'var(--mint)'}}>That person is you.</p>
              <p style={{fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:8}}>Make them feel it.</p>
            </div>
          </div>

          <div className="card">
            <p style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:14}}>Daily Commitment</p>
            <p style={{fontSize:14, color:'var(--navy)', lineHeight:1.8, fontStyle:'italic', marginBottom:10}}>
              "My customer has a person at Bizaxl. That person is me."
            </p>
            <p style={{fontSize:14, color:'var(--gray-400)', lineHeight:1.7}}>
              Every customer should feel: <strong style={{color:'var(--navy)'}}>I have my person at Bizaxl.</strong>
            </p>
            <div style={{marginTop:14, padding:'12px 16px', background:'var(--gray-100)', borderRadius:'var(--radius)', fontSize:12, color:'var(--gray-400)', fontStyle:'italic', textAlign:'center'}}>
              "These values guide every decision, every product, every interaction." — bizaxl.com
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
