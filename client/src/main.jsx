/* Purrfect Stack | COMP229
 * Developers: Gyubin Mun 301520556; Yosuke Nakamura 301526834;
 * Juan Rojas 301520306; Tolga Unal 301439216; Yuhan Su 301533347.
 * React application. Libraries: React (Meta), Vite, Bootstrap contributors.
 * Photography: Unsplash. All data operations use the existing Express API.
 */
import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap-grid.min.css';
import '../css/style.css';

const formatDate = value => new Date(value).toLocaleString('en-CA');
const localDate = value => {const d=new Date(value); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
function identity(token){try{return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{return null;}}

// Labelled controlled inputs keep form state inside React.
function Field({label,name,value,onChange,type='text',required=true,...props}){return <label>{label}<input name={name} type={type} value={value || ''} onChange={e=>onChange(name,e.target.value)} required={required} {...props}/></label>;}
function Modal({children,onClose}){const ref=useRef();useEffect(()=>{ref.current.showModal();},[]);return <dialog ref={ref} onCancel={onClose}><button id="close" onClick={onClose}>Close</button>{children}</dialog>;}

function App(){
  const [base,setBase]=useState(()=>localStorage.getItem('cafe-api')||import.meta.env.VITE_API_URL||'https://comp229-booking-system-application.onrender.com');
  const [token,setToken]=useState(()=>sessionStorage.getItem('cafe-token')||'');
  const [view,setView]=useState(null),[afterLogin,setAfterLogin]=useState('dashboard'),[editing,setEditing]=useState(null);
  const [busyTimes,setBusyTimes]=useState([]),[availabilityLoading,setAvailabilityLoading]=useState(true),[availabilityError,setAvailabilityError]=useState('');
  const [records,setRecords]=useState([]),[user,setUser]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [form,setForm]=useState({}),[filter,setFilter]=useState('all');
  const currentUser=identity(token);
  const change=(name,value)=>setForm(previous=>({...previous,[name]:value}));
  function logout(){setToken('');sessionStorage.removeItem('cafe-token');setRecords([]);setUser(null);setView(null);}
  // Authorization stays on the server. A timeout always clears loading state.
  async function api(path,method='GET',data,secure=false){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),60000);try{const response=await fetch(base+path,{method,signal:controller.signal,headers:{...(data?{'Content-Type':'application/json'}:{}),...(secure?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});const result=await response.json();if(response.status===401&&secure){logout();throw Error('Your session has expired. Please log in again.');}if(!response.ok||result.success===false)throw Error(response.status===409?'That time is already booked. Choose another time.':result.message||'Request failed.');return result;}catch(err){if(err.name==='AbortError')throw Error('The server took too long to respond. Please retry.');if(err instanceof TypeError)throw Error('Cannot connect to the café server. Please try again later.');throw err;}finally{clearTimeout(timer);}}
  async function refreshAvailability(){setAvailabilityLoading(true);setAvailabilityError('');try{setBusyTimes((await api('/api/bookings/public')).data);}catch(err){setAvailabilityError(err.message);}finally{setAvailabilityLoading(false);}}
  useEffect(()=>{refreshAvailability();},[base]);
  useEffect(()=>{if(message){const timer=setTimeout(()=>setMessage(''),4500);return()=>clearTimeout(timer);}},[message]);
  function navigate(next,record=null){setError('');setEditing(record);setForm(next==='booking'?{title:record?.title||'Cat café visit',catName:record?.catName||'',description:record?.description||'',startDate:record?localDate(record.startDate):'',endDate:record?localDate(record.endDate):''}:{});if(['booking','dashboard','profile'].includes(next)&&!token){setAfterLogin(next);setView('login');return;}setView(next);}
  useEffect(()=>{let active=true;async function load(){if(!['profile','dashboard'].includes(view)||!token)return;setLoading(true);try{if(view==='dashboard'){const result=await api('/api/bookings','GET',null,true);if(active)setRecords(result.data);}else{if(!currentUser?.id)throw Error('Please log in again.');const result=await api('/api/users/'+encodeURIComponent(currentUser.id),'GET',null,true);if(active){setUser(result.data);setForm({firstName:result.data.firstName||'',lastName:result.data.lastName||'',email:result.data.email||'',password:''});}}}catch(err){if(active)setError(err.message);}finally{if(active)setLoading(false);}}load();return()=>{active=false;};},[view,token,base]);
  async function submit(event){event.preventDefault();setError('');setLoading(true);try{
    if(view==='login'||view==='signup'){if(view==='signup')await api('/api/users','POST',form);const result=await api('/api/users/signin','POST',{email:form.email,password:form.password});sessionStorage.setItem('cafe-token',result.token);setToken(result.token);setForm(afterLogin==='booking'?{title:'Cat café visit',catName:'',description:'',startDate:'',endDate:''}:{});setView(afterLogin);}
    if(view==='profile'){const data={...form};if(!data.password)delete data.password;await api('/api/users/'+encodeURIComponent(currentUser.id),'PUT',data,true);setMessage('Profile updated.');setView(null);}
    if(view==='booking'){if(!form.catName?.trim()||!form.title?.trim())throw Error('Enter a cat name and visit title.');if(new Date(form.endDate)<=new Date(form.startDate))throw Error('End time must be after start time.');await api('/api/bookings'+(editing?'/'+encodeURIComponent(editing.id):''),editing?'PUT':'POST',{...form,startDate:new Date(form.startDate).toISOString(),endDate:new Date(form.endDate).toISOString()},true);setMessage(editing?'Reservation updated.':'Reservation requested.');setView('dashboard');refreshAvailability();}
  }catch(err){setError(err.message);}finally{setLoading(false);}}
  async function cancel(){setLoading(true);setError('');try{await api('/api/bookings/'+encodeURIComponent(editing.id),'DELETE',null,true);setMessage('Reservation cancelled.');setView('dashboard');refreshAvailability();}catch(err){setError(err.message);}finally{setLoading(false);}}
  const field=(label,name,props={})=><Field label={label} name={name} value={form[name]} onChange={change} {...props}/>;
  return <><header><a className="brand" href="#" aria-label="Purrfect Stack home">purrfect stack<span>CAT CAFÉ</span></a><nav aria-label="Main navigation"><a href="#visit">The café</a><a href="#availability-section">Availability</a><button onClick={()=>navigate('dashboard')}>Dashboard</button><button onClick={()=>navigate('profile')}>Profile</button><button onClick={()=>token?logout():navigate('login')}>{token?'Log out':'Log in'}</button><button className="primary" onClick={()=>navigate('booking')}>Reserve a visit</button></nav></header>
    <Home navigate={navigate} refreshAvailability={refreshAvailability} busyTimes={busyTimes} availabilityLoading={availabilityLoading} availabilityError={availabilityError}/>
    <footer><a className="brand" href="#">purrfect stack<span>CAT CAFÉ</span></a><p>Coffee. Cats. A little time out.</p><details><summary>Connection settings</summary><form onSubmit={e=>{e.preventDefault();try{const url=new URL(new FormData(e.currentTarget).get('url'));if(!['http:','https:'].includes(url.protocol))throw Error('Enter an HTTP or HTTPS URL.');const next=url.href.replace(/\/$/,'');if(next!==base)logout();localStorage.setItem('cafe-api',next);setBase(next);setMessage('API connection updated.');}catch(err){setMessage(err.message);}}}><label>Backend URL<input name="url" type="url" defaultValue={base} required/></label><button>Save connection</button></form></details></footer>
    {view&&<Modal onClose={()=>{if(!loading)setView(null);}}>
      <p className="eyebrow">{view==='booking'?'RESERVATIONS':'YOUR ACCOUNT'}</p>
      <h2>{{login:'Log in.',signup:'Create an account.',profile:'Your profile.',booking:editing?'Edit your visit.':'Plan your visit.',dashboard:'Booking dashboard',cancel:'Cancel this visit?'}[view]}</h2>
      {error&&<p className="error" role="alert">{error}</p>}
      {['login','signup','profile','booking'].includes(view)&&<form onSubmit={submit}>
        {(view==='signup'||view==='profile')&&<div className="row">{field('First name','firstName',{autoComplete:'given-name'})}{field('Last name','lastName',{autoComplete:'family-name'})}</div>}
        {view!=='booking'&&<>{field('Email','email',{type:'email',autoComplete:'email'})}{field(view==='profile'?'New password (optional)':'Password','password',{type:'password',minLength:6,required:view!=='profile',autoComplete:view==='login'?'current-password':'new-password'})}</>}
        {view==='booking'&&<>{field('Cat name','catName')}{field('Visit title','title')}<div className="row">{field('Start time','startDate',{type:'datetime-local'})}{field('End time','endDate',{type:'datetime-local'})}</div><small>Times use your device’s timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</small><label>Notes (optional)<textarea value={form.description||''} onChange={e=>change('description',e.target.value)}/></label><p>Reservations start as pending until the café confirms them.</p></>}
        {view==='profile'&&<p>Leave the password empty to keep your current password.</p>}
        <button disabled={loading} className="primary">{loading?'Please wait…':{login:'Log in',signup:'Create account',profile:'Save profile',booking:editing?'Save changes':'Request reservation'}[view]}</button>
      </form>}
      {['login','signup'].includes(view)&&<p><button disabled={loading} onClick={()=>{setError('');setView(view==='login'?'signup':'login');}}>{view==='login'?'New here? Create an account':'Already a member? Log in'}</button></p>}
      {view==='dashboard'&&<><div className="dashboard-actions"><button onClick={()=>navigate('booking')}>New reservation</button><button onClick={()=>navigate('profile')}>Edit profile</button></div><label>Filter by status<select value={filter} onChange={e=>setFilter(e.target.value)}>{['all','pending','confirmed','cancelled'].map(s=><option key={s} value={s}>{s==='all'?'All reservations':s}</option>)}</select></label>{loading?<p>Loading reservations…</p>:<><p>{records.length} reservations</p>{records.filter(r=>filter==='all'||r.status===filter).map(r=><article className="booking" key={r.id}><h3>{r.title}</h3><span className={'status-label status-'+r.status}>{r.status}</span><p>{r.catName}</p><p>{formatDate(r.startDate)} — {formatDate(r.endDate)}</p><p>{r.description||'No notes.'}</p>{r.status!=='cancelled'&&<><button onClick={()=>navigate('booking',r)}>Edit reservation</button><button onClick={()=>navigate('cancel',r)}>Cancel reservation</button></>}</article>)}{!records.some(r=>filter==='all'||r.status===filter)&&<p className="notice">No reservations match this status.</p>}</>}</>}
      {view==='cancel'&&<><p>{editing.title} with {editing.catName}</p><button disabled={loading} onClick={()=>navigate('dashboard')}>Keep visit</button> <button className="primary" disabled={loading} onClick={cancel}>{loading?'Cancelling…':'Cancel reservation'}</button></>}
    </Modal>}
    {message&&<div id="toast" role="status" style={{display:'block'}}>{message}</div>}
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);


// Public café content rendered by React.
function Home({navigate,refreshAvailability,busyTimes,availabilityLoading,availabilityError}){return <main>
<section className="hero">
<div className="hero-copy"><p className="eyebrow">COFFEE & CAT COMPANY</p><h1>A table for you.<br/>A windowsill<br/>for them.</h1><p>Explore booking availability and reserve time<br/>to spend with cats at a café.</p><button className="primary" onClick={() => navigate("booking")}>Reserve a visit</button><a className="textlink" href="#visit">Before you come</a><p className="hero-note">Please book ahead to spend time with the cats.</p></div>
<figure className="hero-photo"><img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1400&q=85" alt="A tabby cat resting with its paws tucked beneath its face" fetchPriority="high"/><figcaption>A quieter corner of your day.</figcaption></figure>
</section>
<section className="intro" id="visit"><p className="eyebrow">AT THE CAFÉ</p><div><h2>Good company.<br/>On their terms.</h2><p>Some cats will come over to say hello. Others will find a sunny spot and stay there. Give them a little space, keep your voice low, and let them decide.</p><p>Choose a cat and a time when you book. You can check busy times below, and manage your reservation from Dashboard.</p></div><figure className="detail-photo"><img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80" alt="Coffee served in a ceramic cup" loading="lazy"/><figcaption>Take your time.</figcaption></figure></section>
<section className="planning" id="availability-section"><div className="section-head"><div><p className="eyebrow">RESERVATIONS</p><h2>Find a time to visit.</h2></div><p>The times shown are already booked.<br/>Choose another time for your reservation.</p></div><div className="availability-layout"><aside><h3>Before you book</h3><p>Have the cat’s name and your preferred start and end times ready.</p><p>Your request starts as pending until the café confirms it.</p><button className="primary" onClick={() => navigate("booking")}>Make a reservation</button></aside><div className="schedule"><div className="schedule-head"><h3>Busy times</h3><button onClick={refreshAvailability}>Refresh</button></div><div aria-live="polite">{availabilityLoading ? <p>Loading availability…</p> : availabilityError ? <p className="error">{availabilityError}</p> : busyTimes.length ? busyTimes.map((b,i) => <p key={i}><strong>{b.catName}</strong> · {formatDate(b.startDate)} — {formatDate(b.endDate)} · Busy</p>) : <p>No upcoming busy times are listed.</p>}</div></div></div></section>
<section className="house-notes"><h2>A few house notes.</h2><div><article><h3>Let them come to you</h3><p>Offer a hand to sniff. Give a cat room to walk away whenever it wants.</p></article><article><h3>Leave naps undisturbed</h3><p>A sleeping cat is a happy cat. There will be time to say hello later.</p></article><article><h3>Plans changed?</h3><p>Update or cancel your visit in Dashboard so the time can be used again.</p></article></div></section>
<section className="project-team"><p className="eyebrow">ABOUT THE PROJECT</p><h2>Purrfect Stack</h2><p>A web-based cat café booking system, developed for COMP229 Web Application Development.</p><div className="container-fluid px-0"><div className="row"><p className="col-md-6">Gyubin Mun — Front-end Developer<br/>Yosuke Nakamura — Back-end Developer<br/>Juan Rojas — Developer</p><p className="col-md-6">Tolga Unal — Project Manager &amp; Back-end Developer<br/>Yuhan Su — Software Tester</p></div></div></section></main>;}
