import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Clock, Users, DollarSign, CheckSquare, 
  Plus, Trash2, Download, ChevronLeft, Heart, 
  MapPin, X, ArrowRight, CalendarDays, 
  Settings, Archive, LogOut, Key, Edit3, Save, Copy, Link as LinkIcon, PieChart, Users as UsersIcon, Shield
} from 'lucide-react';

// --- КОНФИГУРАЦИЯ ---
const SITE_URL = 'https://wedding-plan.vercel.app'; // Потом заменим на новую ссылку

const COLORS = {
  primary: '#936142',
  secondary: '#AC8A69',
  bg: '#F9F7F5'
};

// --- ДАННЫЕ ---
const INITIAL_EXPENSES = [
  { category: 'Декор', name: 'Декор и флористика', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Площадка', name: 'Аренда мебели', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Фото и Видео', name: 'Фотограф', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Фото и Видео', name: 'Видеограф', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Программа', name: 'Ведущий + диджей', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Образ', name: 'Стилист', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Банкет', name: 'Торт', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Банкет', name: 'Свадебный ужин', plan: 0, fact: 0, paid: 0, note: '' },
  { category: 'Команда', name: 'Организация', plan: 0, fact: 0, paid: 0, note: '' },
];

const INITIAL_TIMING = [
  { time: '09:00', event: 'Пробуждение' },
  { time: '10:00', event: 'Сборы' },
  { time: '13:00', event: 'Фотосессия' },
  { time: '16:00', event: 'Церемония' },
  { time: '17:00', event: 'Банкет' },
  { time: '23:00', event: 'Финал' },
];

const TASK_TEMPLATES = [
  { text: 'Определить бюджет', pos: 0.0 },
  { text: 'Составить список гостей', pos: 0.1 },
  { text: 'Выбрать площадку', pos: 0.2 },
  { text: 'Найти фотографа', pos: 0.3 },
  { text: 'Выбрать платье', pos: 0.5 },
  { text: 'Заказать торт', pos: 0.7 },
  { text: 'Рассадка гостей', pos: 0.9 },
];

const INITIAL_FORM_STATE = {
  organizerName: '',
  organizerId: '',
  groomName: '',
  brideName: '',
  date: '',
  guestsCount: '',
  prepLocation: 'home',
  registrationType: 'official',
  venueName: '',
  clientPassword: ''
};

// --- UTILS ---
const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const toInputDate = (dateStr) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
const getDaysUntil = (dateStr) => Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
const formatCurrency = (val) => new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(val || 0);
const downloadCSV = (data, filename) => {
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + data.map(e => e.join(";")).join("\n");
  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- COMPONENTS ---
const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-[#EBE5E0] ${className} ${onClick ? 'cursor-pointer hover:border-[#AC8A69] active:scale-[0.99] transition-transform' : ''}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled }) => {
  const styles = variant === 'primary' 
    ? "bg-[#936142] text-white hover:bg-[#7D5238] shadow-lg shadow-[#936142]/20" 
    : variant === 'secondary'
    ? "bg-[#CCBBA9]/20 text-[#414942] hover:bg-[#CCBBA9]/30"
    : variant === 'danger'
    ? "bg-red-50 text-red-600 hover:bg-red-100"
    : "border border-[#AC8A69] text-[#936142] hover:bg-[#AC8A69]/10";
  return (
    <button onClick={onClick} disabled={disabled} className={`px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${styles} ${className} ${disabled ? 'opacity-50' : ''}`}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-semibold text-[#AC8A69] uppercase tracking-wider mb-2 ml-1">{label}</label>}
    <input className="w-full bg-[#F9F7F5] border-none rounded-xl p-4 text-[#414942] placeholder-[#CCBBA9] focus:ring-2 focus:ring-[#936142]/20 outline-none" {...props} />
  </div>
);

const AutoHeightTextarea = ({ value, onChange, className, placeholder }) => {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) { ref.current.style.height = '28px'; ref.current.style.height = `${ref.current.scrollHeight}px`; } }, [value]);
  return <textarea ref={ref} className={`${className} resize-none overflow-hidden block`} value={value} onChange={onChange} rows={1} placeholder={placeholder} />;
};

const Checkbox = ({ checked, onChange }) => (
  <div onClick={(e) => { e.stopPropagation(); onChange(!checked); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors ${checked ? 'bg-[#936142] border-[#936142]' : 'border-[#CCBBA9]'}`}>
    {checked && <CheckSquare size={14} color="white" />}
  </div>
);

const MoneyInput = ({ value, onChange, className }) => {
  const [focus, setFocus] = useState(false);
  const display = focus ? (value === 0 ? '' : value) : formatCurrency(value);
  return (
    <input className={`${className} outline-none bg-transparent`} value={display} onChange={(e) => { const val = e.target.value.replace(/\s/g, ''); onChange(val === '' ? 0 : isNaN(val) ? 0 : parseInt(val)); }} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} placeholder="0" />
  );
};

const DownloadMenu = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative print:hidden">
      <button onClick={() => setOpen(!open)} className="px-4 py-3 rounded-xl border border-[#AC8A69] text-[#936142] hover:bg-[#AC8A69]/5"><Download size={18}/></button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}/>
          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#EBE5E0] z-20 w-48 overflow-hidden">
            {['excel', 'csv', 'pdf'].map(type => (
              <button key={type} onClick={() => { onSelect(type); setIsOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-[#F9F7F5] text-[#414942] text-sm font-medium uppercase">{type}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- VIEWS ---

const SettingsModal = ({ project, onClose, onSave, onDelete, onArchive }) => {
  const [data, setData] = useState({ ...project });

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start p-4 bg-[#414942]/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative flex flex-col my-8 min-h-min mb-20">
        <div className="p-6 border-b border-[#EBE5E0] flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold text-[#414942]">Настройки</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#F9F7F5] rounded-full text-[#AC8A69]"><X size={20} /></button>
        </div>
        <div className="p-6">
           <div className="bg-[#936142] p-5 rounded-2xl mb-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-2">
                 <p className="text-xs font-bold uppercase tracking-widest opacity-80">Доступ для клиента</p>
                 <LinkIcon size={16} className="opacity-80"/>
              </div>
              <div className="flex gap-2 items-center bg-white/10 p-2 rounded-xl border border-white/20 mb-3">
                 <input className="bg-transparent text-sm w-full outline-none text-white placeholder-white/50" value={`${SITE_URL}?id=${project.id}`} readOnly />
                 <button onClick={() => alert('Скопировано')}><Copy size={16}/></button>
              </div>
              <div>
                 <p className="text-[10px] uppercase opacity-60 mb-1">Пароль</p>
                 <input className="bg-transparent text-xl font-bold w-full outline-none" value={data.clientPassword || ''} onChange={e => setData({...data, clientPassword: e.target.value})} />
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <Input label="Жених" value={data.groomName} onChange={e => setData({...data, groomName: e.target.value})} />
              <Input label="Невеста" value={data.brideName} onChange={e => setData({...data, brideName: e.target.value})} />
           </div>
           <Input label="Организатор" value={data.organizerName} onChange={e => setData({...data, organizerName: e.target.value})} />
           <div className="grid grid-cols-2 gap-4">
              <Input label="Дата" type="date" value={data.date} onChange={e => setData({...data, date: e.target.value})} />
              <Input label="Гостей" type="number" value={data.guestsCount} onChange={e => setData({...data, guestsCount: e.target.value})} />
           </div>
           <Input label="Локация" value={data.venueName} onChange={e => setData({...data, venueName: e.target.value})} />
        </div>
        <div className="p-6 border-t border-[#EBE5E0] bg-[#F9F7F5] shrink-0 rounded-b-3xl space-y-3">
           <Button className="w-full" onClick={() => onSave(data)}><Save size={18} /> Сохранить</Button>
           <div className="flex gap-3 pt-2">
             <Button variant="outline" className="flex-1" onClick={() => onArchive(project.id)}><Archive size={18} /> {project.isArchived ? 'Вернуть' : 'В архив'}</Button>
             <Button variant="danger" className="flex-1" onClick={() => onDelete(project.id)}><Trash2 size={18} /> Удалить</Button>
           </div>
        </div>
      </div>
    </div>
  );
};

const ProfileModal = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [secret, setSecret] = useState(user?.secret || '');

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-start p-4 bg-[#414942]/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative my-8">
                <button onClick={onClose} className="absolute top-4 right-4 text-[#AC8A69]"><X size={20} /></button>
                <h3 className="text-xl font-bold text-[#414942] mb-6">Профиль</h3>
                <Input label="Имя" value={name} onChange={e => setName(e.target.value)} />
                <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <div className="bg-[#F9F7F5] p-3 rounded-xl border border-[#AC8A69]/30 mb-6">
                    <label className="block text-[10px] font-bold text-[#AC8A69] uppercase tracking-wider mb-2">Кодовое слово</label>
                    <input className="bg-transparent w-full text-[#414942] outline-none" placeholder="Придумайте слово" value={secret} onChange={e => setSecret(e.target.value)} />
                </div>
                <Button className="w-full" onClick={() => onSave({ ...user, name, email, secret })}>Сохранить</Button>
            </div>
        </div>
    );
};

const OrganizersView = ({ team, onAdd, onDelete, onBack }) => {
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPass, setNewPass] = useState('');

    return (
        <div className="min-h-screen bg-[#F9F7F5] font-[Montserrat]">
            <nav className="p-6 flex items-center gap-4">
                <button onClick={onBack} className="flex items-center gap-2 text-[#AC8A69] hover:text-[#936142]"><ChevronLeft size={20}/> <span className="font-bold text-lg">Назад</span></button>
            </nav>
            <div className="p-6 md:p-12 max-w-4xl mx-auto animate-fadeIn pb-32">
                <h2 className="text-3xl font-bold text-[#414942] mb-8">Команда</h2>
                <Card className="p-6 mb-8 bg-white border-[#EBE5E0]">
                    <h3 className="font-bold text-[#936142] mb-4">Добавить сотрудника</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                        <input className="bg-[#F9F7F5] border-none rounded-xl p-3 outline-none" placeholder="Имя" value={newName} onChange={e => setNewName(e.target.value)} />
                        <input className="bg-[#F9F7F5] border-none rounded-xl p-3 outline-none" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                        <input className="bg-[#F9F7F5] border-none rounded-xl p-3 outline-none" placeholder="Пароль" value={newPass} onChange={e => setNewPass(e.target.value)} />
                    </div>
                    <Button onClick={() => { onAdd({ id: Date.now(), name: newName, email: newEmail, password: newPass }); setNewName(''); setNewEmail(''); setNewPass(''); }} className="mt-4 w-full md:w-auto">Добавить</Button>
                </Card>
                <div className="grid gap-4">
                    {team.map(org => (
                        <div key={org.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border border-[#EBE5E0]">
                            <div><p className="font-bold text-[#414942]">{org.name}</p><p className="text-xs text-[#AC8A69]">{org.email} | Пароль: {org.password}</p></div>
                            <button onClick={() => onDelete(org.id)} className="text-red-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                        </div>
                    ))}
                    {team.length === 0 && <p className="text-center text-[#CCBBA9]">Нет сотрудников.</p>}
                </div>
            </div>
        </div>
    );
};

// --- APP ---

export default function App() {
  const [projects, setProjects] = useState(() => JSON.parse(localStorage.getItem('wedding_projects') || '[]'));
  const [team, setTeam] = useState(() => JSON.parse(localStorage.getItem('wedding_team') || '[]'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('wedding_user') || '{"name":"Владелец","email":"owner@wed.control","role":"owner"}'));
  
  const [currentProject, setCurrentProject] = useState(null);
  const [view, setView] = useState('login'); 
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardTab, setDashboardTab] = useState('active'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySecret, setRecoverySecret] = useState('');
  const [recoveryNewPass, setRecoveryNewPass] = useState('');

  useEffect(() => localStorage.setItem('wedding_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('wedding_team', JSON.stringify(team)), [team]);
  useEffect(() => localStorage.setItem('wedding_user', JSON.stringify(user)), [user]);

  const handleLogin = () => {
      if ((loginEmail === user.email && loginPass === (user.password || 'admin')) || 
          team.find(m => m.email === loginEmail && m.password === loginPass)) {
          setView('dashboard');
      } else {
          const proj = projects.find(p => p.clientPassword === loginPass);
          if (proj) {
              setCurrentProject(proj);
              setUser({ name: 'Клиент', role: 'client' });
              setView('project');
              setActiveTab('overview');
          } else {
              alert('Неверный логин или пароль (Демо: admin/admin)');
          }
      }
  };

  const handleClientLinkLogin = () => {
     const proj = projects.find(p => p.clientPassword === loginPass);
     if (proj) {
         setCurrentProject(proj);
         setUser({ name: 'Клиент', role: 'client' });
         setView('project');
         setActiveTab('overview');
     } else {
         alert('Неверный пароль');
     }
  };

  const handleRecovery = () => {
      if (recoveryEmail === user.email && recoverySecret === (user.secret || 'secret')) {
          setUser({ ...user, password: recoveryNewPass });
          alert('Пароль изменен');
          setView('login');
      } else {
          alert('Неверные данные');
      }
  };

  const createProject = () => {
    const creationDate = new Date();
    const weddingDate = new Date(formData.date);
    const totalTime = weddingDate - creationDate;

    let projectTasks = TASK_TEMPLATES.map(t => {
      const deadline = new Date(creationDate.getTime() + totalTime * t.pos);
      return { id: Math.random().toString(36).substr(2, 9), text: t.text, deadline: deadline.toISOString(), done: false };
    });

    let projectExpenses = [...INITIAL_EXPENSES];
    if (formData.prepLocation === 'hotel') { projectTasks.push({ id: 'hotel_1', text: 'Забронировать номер', deadline: new Date().toISOString(), done: false }); projectExpenses.push({ category: 'Логистика', name: 'Номер в отеле', plan: 0, fact: 0, paid: 0, note: '' }); }
    if (formData.registrationType === 'offsite') { projectTasks.push({ id: 'reg_1', text: 'Выбрать регистратора', deadline: new Date().toISOString(), done: false }); projectExpenses.push({ category: 'Программа', name: 'Регистратор', plan: 0, fact: 0, paid: 0, note: '' }); }
    projectTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    let orgName = user.name;
    if (formData.organizerId && formData.organizerId !== 'owner') {
        const member = team.find(m => m.id.toString() === formData.organizerId);
        if (member) orgName = member.name;
    }

    const newProject = {
      id: Date.now(), ...formData, organizerName: orgName, clientPassword: Math.floor(1000 + Math.random() * 9000).toString(),
      isArchived: false, tasks: projectTasks, expenses: projectExpenses, timing: INITIAL_TIMING.map(t => ({...t, id: Math.random().toString(36).substr(2,9)})), guests: [], notes: ''
    };

    setProjects([...projects, newProject]);
    setCurrentProject(newProject);
    setView('project');
    setActiveTab('overview');
  };

  const updateProjectData = (field, value) => {
    setCurrentProject(prev => { const updated = { ...prev, [field]: value }; setProjects(list => list.map(p => p.id === updated.id ? updated : p)); return updated; });
  };

  if (view === 'login') return (
      <div className="min-h-screen bg-[#F9F7F5] font-[Montserrat] flex flex-col items-center justify-center p-6">
          <div className="mb-8 text-center"><h1 className="text-4xl font-bold text-[#414942] mb-2">Wed.Control</h1><p className="text-[#AC8A69]">Демо-версия</p></div>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4">
              <Input placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <Input placeholder="Пароль" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
              <Button className="w-full" onClick={handleLogin}>Войти</Button>
              <button onClick={() => setView('client_login')} className="w-full text-center text-xs text-[#AC8A69] hover:underline mt-4">Вход для клиента</button>
              <button onClick={() => setView('recovery')} className="w-full text-center text-xs text-[#AC8A69] hover:underline mt-2">Забыли пароль?</button>
              
              <div className="mt-6 p-4 bg-[#F9F7F5] rounded-xl border border-[#AC8A69]/20 text-center">
                  <p className="text-xs text-[#AC8A69] font-bold uppercase mb-2">Данные для входа (Демо):</p>
                  <p className="text-sm text-[#414942]">Email: <span className="font-mono font-bold">owner@wed.control</span></p>
                  <p className="text-sm text-[#414942]">Пароль: <span className="font-mono font-bold">admin</span></p>
              </div>
          </div>
      </div>
  );

  if (view === 'client_login') return (
      <div className="min-h-screen bg-[#F9F7F5] font-[Montserrat] flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
              <Heart size={48} className="text-[#936142] mx-auto mb-6" />
              <h2 className="text-2xl font-serif text-[#414942] mb-8">Вход по приглашению</h2>
              <Input placeholder="Пароль проекта" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
              <Button className="w-full" onClick={handleClientLinkLogin}>Войти</Button>
              <button onClick={() => setView('login')} className="w-full text-center text-xs text-[#AC8A69] hover:underline mt-4">Я организатор</button>
          </div>
      </div>
  );

  if (view === 'recovery') return (
      <div className="min-h-screen bg-[#F9F7F5] font-[Montserrat] flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4">
              <h2 className="text-2xl font-bold text-[#414942] mb-4 text-center">Восстановление</h2>
              <Input placeholder="Email" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} />
              <Input placeholder="Секретное слово" value={recoverySecret} onChange={e => setRecoverySecret(e.target.value)} />
              <Input placeholder="Новый пароль" type="password" value={recoveryNewPass} onChange={e => setRecoveryNewPass(e.target.value)} />
              <Button className="w-full" onClick={handleRecovery}>Сменить</Button>
              <button onClick={() => setView('login')} className="w-full text-center text-sm text-[#AC8A69] mt-4">Назад</button>
          </div>
      </div>
  );

  if (view === 'team') return <OrganizersView team={team} onBack={() => setView('dashboard')} onAdd={(m) => setTeam([...team, m])} onDelete={(id) => setTeam(team.filter(t => t.id !== id))} />;

  if (view === 'dashboard') {
    const filteredProjects = projects.filter(p => dashboardTab === 'active' ? !p.isArchived : p.isArchived);
    return (
      <div className="min-h-screen bg-[#F9F7F5] p-6 md:p-12 pb-32 font-[Montserrat]">
        <div className="max-w-6xl mx-auto">
          {isProfileOpen && <ProfileModal user={user} onClose={() => setIsProfileOpen(false)} onSave={(u) => { setUser(u); setIsProfileOpen(false); }} />}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div><h1 className="text-4xl md:text-5xl font-bold text-[#414942] tracking-tight">Wed.Control</h1><button onClick={() => setIsProfileOpen(true)} className="text-[#AC8A69] mt-2 hover:text-[#936142] flex items-center gap-2">Кабинет: {user?.name} <Edit3 size={14}/></button></div>
            <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={() => { setFormData(INITIAL_FORM_STATE); setView('create'); }}><Plus size={20}/> Новый проект</Button>
                <Button variant="secondary" onClick={() => setView('team')}><UsersIcon size={20}/> Команда</Button>
                <Button variant="ghost" onClick={handleLogout}><LogOut size={20}/></Button>
            </div>
          </header>
          <div className="flex gap-4 mb-8 border-b border-[#EBE5E0]">
             <button onClick={() => setDashboardTab('active')} className={`pb-3 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${dashboardTab === 'active' ? 'border-[#936142] text-[#936142]' : 'border-transparent text-[#CCBBA9]'}`}>Активные</button>
             <button onClick={() => setDashboardTab('archived')} className={`pb-3 px-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${dashboardTab === 'archived' ? 'border-[#936142] text-[#936142]' : 'border-transparent text-[#CCBBA9]'}`}>Архив</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredProjects.map(p => (
              <div key={p.id} onClick={() => { setCurrentProject(p); setView('project'); setActiveTab('overview'); }} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer group border border-[#EBE5E0] hover:border-[#AC8A69]/30 relative overflow-hidden">
                <Heart size={64} className="absolute top-4 right-4 text-[#936142] opacity-10 group-hover:opacity-20 transition-opacity"/>
                <div className="relative z-10">
                    <p className="text-xs font-bold text-[#AC8A69] uppercase tracking-widest mb-3">{formatDate(p.date)}</p>
                    <h3 className="text-2xl font-serif text-[#414942] mb-1">{p.groomName} <span className="text-[#AC8A69]">&</span> {p.brideName}</h3>
                    <p className="text-[#CCBBA9] text-sm mb-6">{p.venueName || 'Локация не выбрана'}</p>
                    <div className="flex items-center justify-between mt-8 border-t border-[#F9F7F5] pt-4"><div><p className="text-[10px] text-[#CCBBA9] uppercase">Организатор</p><p className="text-xs text-[#AC8A69] font-bold">{p.organizerName || 'Владелец'}</p></div><span className="text-[#936142] group-hover:translate-x-1 transition-transform"><ArrowRight size={20}/></span></div>
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && <div className="col-span-full text-center py-20 text-[#CCBBA9]"><p className="text-xl">Здесь пока пусто.</p></div>}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-[#F9F7F5] font-[Montserrat] overflow-y-auto px-4 py-8">
          <div className="w-full max-w-2xl mx-auto pb-32">
            <Card className="p-8 md:p-12 animate-slideUp bg-white">
                <div className="flex items-center mb-8"><button onClick={() => setView('dashboard')} className="mr-4 text-[#AC8A69] hover:text-[#936142]"><ChevronLeft size={24}/></button><h2 className="text-3xl font-bold text-[#414942]">Создание истории</h2></div>
                <div className="space-y-6">
                    <div className="p-6 bg-[#F9F7F5] rounded-xl space-y-6">
                        <p className="text-[#936142] font-semibold text-sm uppercase tracking-wider mb-4 border-b border-[#CCBBA9]/20 pb-2">О паре</p>
                        <div className="mb-4"><label className="block text-xs font-semibold text-[#AC8A69] uppercase tracking-wider mb-2 ml-1">Ответственный организатор</label><select className="w-full bg-white border-none rounded-xl p-4 text-[#414942] outline-none" value={formData.organizerId} onChange={e => setFormData({...formData, organizerId: e.target.value})}><option value="owner">Владелец (Я)</option>{team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Input label="Жених" placeholder="Имя" value={formData.groomName} onChange={e => setFormData({...formData, groomName: e.target.value})} /><Input label="Невеста" placeholder="Имя" value={formData.brideName} onChange={e => setFormData({...formData, brideName: e.target.value})} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Input label="Дата свадьбы" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /><Input label="Гостей" type="number" placeholder="50" value={formData.guestsCount} onChange={e => setFormData({...formData, guestsCount: e.target.value})} /></div>
                    </div>
                    <div className="space-y-4"><label className="block text-xs font-semibold text-[#AC8A69] uppercase tracking-wider ml-1">Детали дня</label><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><select className="w-full bg-white border border-[#EBE5E0] rounded-xl p-4 text-[#414942] outline-none focus:border-[#AC8A69]" value={formData.prepLocation} onChange={e => setFormData({...formData, prepLocation: e.target.value})}><option value="home">Сборы дома</option><option value="hotel">Сборы в отеле</option></select><select className="w-full bg-white border border-[#EBE5E0] rounded-xl p-4 text-[#414942] outline-none focus:border-[#AC8A69]" value={formData.registrationType} onChange={e => setFormData({...formData, registrationType: e.target.value})}><option value="official">ЗАГС</option><option value="offsite">Выездная регистрация</option></select></div></div>
                    <div className="grid grid-cols-1 gap-4"><Input label="Локация" placeholder="Название ресторана / отеля" value={formData.venueName} onChange={e => setFormData({...formData, venueName: e.target.value})} /></div>
                    <div className="bg-[#F9F7F5] p-4 rounded-xl flex items-center gap-3 border border border-[#AC8A69]/20"><Key className="text-[#936142]" /><div className="flex-1"><p className="text-xs font-bold text-[#AC8A69] uppercase">Пароль для клиента (авто)</p><div className="flex gap-2"><input className="bg-transparent font-mono text-xl font-bold text-[#414942] outline-none w-full" value={formData.clientPassword} onChange={e => setFormData({...formData, clientPassword: e.target.value})} /><button onClick={() => setFormData({...formData, clientPassword: Math.floor(1000 + Math.random() * 9000).toString()})} className="text-[#AC8A69] hover:text-[#936142]"><Edit3 size={16}/></button></div></div></div>
                    <Button onClick={createProject} className="w-full mt-8">Создать проект</Button>
                </div>
            </Card>
          </div>
      </div>
    );
  }

  if (view === 'project' && currentProject) {
    const expensesSum = currentProject.expenses.reduce((acc, i) => ({ plan: acc.plan + Number(i.plan), fact: acc.fact + Number(i.fact), paid: acc.paid + Number(i.paid) }), { plan: 0, fact: 0, paid: 0 });
    
    return (
      <div className="min-h-screen bg-[#F9F7F5] font-[Montserrat]">
        {isSettingsOpen && <SettingsModal project={currentProject} onClose={() => setIsSettingsOpen(false)} onSave={saveSettings} onDelete={deleteProject} onArchive={toggleArchive} />}
        <nav className="sticky top-0 bg-white/90 backdrop-blur border-b border-[#EBE5E0] z-50 px-4 md:px-6 h-16 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 md:gap-4"><button onClick={() => setView('dashboard')} className="p-2 hover:bg-[#F9F7F5] rounded-full transition-colors text-[#AC8A69]"><ChevronLeft /></button><span className="text-lg md:text-xl font-bold text-[#936142] tracking-tight whitespace-nowrap">Wed.Control</span></div>
          <div className="hidden md:flex gap-1 bg-[#F9F7F5] p-1 rounded-xl">
              {['overview', 'tasks', 'budget', 'guests', 'timing', 'notes'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-[#936142] shadow-sm' : 'text-[#CCBBA9] hover:text-[#414942]'}`}>{tab === 'overview' ? 'Обзор' : tab === 'tasks' ? 'Задачи' : tab === 'budget' ? 'Смета' : tab === 'guests' ? 'Гости' : tab === 'timing' ? 'Тайминг' : 'Заметки'}</button>))}
          </div>
          <div className="flex items-center gap-4"><div className="text-right hidden md:block"><p className="font-serif text-[#414942] font-medium text-sm md:text-base">{currentProject.groomName} & {currentProject.brideName}</p><p className="text-[10px] md:text-xs text-[#AC8A69]">{formatDate(currentProject.date)}</p></div><button onClick={() => setIsSettingsOpen(true)} className="p-2 text-[#AC8A69] hover:text-[#936142] hover:bg-[#F9F7F5] rounded-full transition-colors"><Settings size={20} /></button><button onClick={handleLogout} className="p-2 text-[#AC8A69] hover:text-[#936142]"><LogOut size={20} /></button></div>
        </nav>
        <div className="md:hidden overflow-x-auto whitespace-nowrap px-6 pb-2 pt-2 scrollbar-hide border-b border-[#EBE5E0] bg-white/50 backdrop-blur-sm print:hidden">
             {['overview', 'tasks', 'budget', 'guests', 'timing', 'notes'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all inline-block mr-2 ${activeTab === tab ? 'bg-white text-[#936142] shadow-sm ring-1 ring-[#936142]/10' : 'text-[#CCBBA9]'}`}>{tab === 'overview' ? 'Обзор' : tab === 'tasks' ? 'Задачи' : tab === 'budget' ? 'Смета' : tab === 'guests' ? 'Гости' : tab === 'timing' ? 'Тайминг' : 'Заметки'}</button>))}
        </div>
        <main className="max-w-7xl mx-auto p-4 md:p-12 pb-32 print:p-0">
          {activeTab === 'overview' && (
            <div className="space-y-6 md:space-y-8 pb-10">
                <div className="relative rounded-[2rem] overflow-hidden bg-[#936142] text-white p-8 md:p-12 text-center md:text-left shadow-2xl shadow-[#936142]/30">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div><h1 className="text-3xl md:text-6xl font-serif mb-4">{currentProject.groomName} <span className="text-[#C58970]">&</span> {currentProject.brideName}</h1><div className="flex items-center justify-center md:justify-start gap-4 text-[#EBE5E0]"><MapPin size={18}/><span className="text-base md:text-lg tracking-wide">{currentProject.venueName || 'Локация не выбрана'}</span></div></div>
                        <div className="text-center md:text-right"><div className="text-5xl md:text-8xl font-bold tracking-tighter leading-none">{getDaysUntil(currentProject.date)}</div><div className="text-[10px] md:text-sm uppercase tracking-[0.2em] opacity-80 mt-2">Дней до свадьбы</div></div>
                    </div>
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#AC8A69] rounded-full mix-blend-overlay opacity-50 blur-3xl"></div><div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#C58970] rounded-full mix-blend-overlay opacity-50 blur-3xl"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <Card className="p-4 md:p-6 flex flex-col justify-between h-32 md:h-40" onClick={() => setActiveTab('tasks')}><CheckSquare className="text-[#936142] mb-2 md:mb-4" size={24} md:size={32}/><div><p className="text-2xl md:text-3xl font-bold text-[#414942]">{currentProject.tasks.filter(t => !t.done).length}</p><p className="text-[10px] md:text-xs text-[#AC8A69] uppercase mt-1">Активных задач</p></div></Card>
                    <Card className="p-4 md:p-6 flex flex-col justify-between h-32 md:h-40" onClick={() => setActiveTab('budget')}><PieChart className="text-[#936142] mb-2 md:mb-4" size={24} md:size={32}/><div><p className="text-lg md:text-xl font-bold text-[#414942]">{Math.round((expensesSum.paid / (expensesSum.fact || 1)) * 100)}%</p><p className="text-[10px] md:text-xs text-[#AC8A69] uppercase mt-1">Бюджет оплачен</p></div></Card>
                    <Card className="p-4 md:p-6 flex flex-col justify-between h-32 md:h-40" onClick={() => setActiveTab('guests')}><Users className="text-[#936142] mb-2 md:mb-4" size={24} md:size={32}/><div><p className="text-2xl md:text-3xl font-bold text-[#414942]">{currentProject.guests.length}</p><p className="text-[10px] md:text-xs text-[#AC8A69] uppercase mt-1">Гостей</p></div></Card>
                    <Card className="p-4 md:p-6 flex flex-col justify-between h-32 md:h-40" onClick={() => setActiveTab('timing')}><Clock className="text-[#936142] mb-2 md:mb-4" size={24} md:size={32}/><div><p className="text-lg md:text-xl font-bold text-[#414942]">{currentProject.timing[0]?.time || '09:00'}</p><p className="text-[10px] md:text-xs text-[#AC8A69] uppercase mt-1">Начало дня</p></div></Card>
                </div>
                <div><h3 className="text-lg md:text-xl font-serif text-[#414942] mb-4 md:mb-6">Ближайшие дедлайны</h3><div className="grid gap-3 md:gap-4">{currentProject.tasks.filter(t => !t.done).sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 3).map(task => (<div key={task.id} className="flex items-center justify-between p-4 md:p-5 bg-white rounded-2xl shadow-sm border border-[#EBE5E0]"><div className="flex items-center gap-4"><div className="w-1.5 md:w-2 h-10 md:h-12 bg-[#C58970] rounded-full"></div><div><p className="font-medium text-sm md:text-base text-[#414942]">{task.text}</p><p className="text-xs md:text-sm text-[#AC8A69]">{formatDate(task.deadline)}</p></div></div><Button variant="ghost" onClick={() => setActiveTab('tasks')} className="p-2"><ArrowRight size={18} md:size={20}/></Button></div>))}</div></div>
            </div>
          )}
          {activeTab === 'tasks' && <TasksViewRenderer tasks={currentProject.tasks} updateProject={updateProjectData} formatDate={formatDate} />}
          {activeTab === 'budget' && <BudgetViewRenderer expenses={currentProject.expenses} updateProject={updateProjectData} downloadCSV={downloadCSV} />}
          {activeTab === 'guests' && <GuestsViewRenderer guests={currentProject.guests} updateProject={updateProjectData} downloadCSV={downloadCSV} />}
          {activeTab === 'timing' && <TimingViewRenderer timing={currentProject.timing} updateProject={updateProjectData} downloadCSV={downloadCSV} />}
          {activeTab === 'notes' && <NotesView notes={currentProject.notes} updateProject={updateProjectData} />}
        </main>
      </div>
    );
  }
  return null;
}