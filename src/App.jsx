import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calendar, Clock, Users, DollarSign, CheckSquare, 
  Plus, Trash2, Download, ChevronLeft, Heart, 
  MapPin, X, ArrowRight, CalendarDays, Menu, 
  FileText, FileSpreadsheet, File, PieChart, Settings, 
  Archive, LogOut, Lock, User, Crown, Key, Loader2, Users as UsersIcon, Link as LinkIcon, Edit3, Save, XCircle, Shield, Copy
} from 'lucide-react';

// --- КОНФИГУРАЦИЯ ---
const SITE_URL = 'https://wedding-plan.vercel.app'; 

const COLORS = {
  primary: '#936142',
  secondary: '#AC8A69',
  bg: '#F9F7F5'
};

// --- ДАННЫЕ ПО УМОЛЧАНИЮ ---
const INITIAL_EXPENSES = [
  { category: 'Декор', name: 'Декор и флористика', plan: 150000, fact: 150000, paid: 50000, note: '' },
  { category: 'Площадка', name: 'Аренда мебели', plan: 30000, fact: 0, paid: 0, note: '' },
  { category: 'Полиграфия', name: 'Приглашения', plan: 15000, fact: 15000, paid: 15000, note: '' },
  { category: 'Фото и Видео', name: 'Фотограф', plan: 80000, fact: 80000, paid: 20000, note: '' },
  { category: 'Фото и Видео', name: 'Видеограф', plan: 70000, fact: 0, paid: 0, note: '' },
  { category: 'Программа', name: 'Ведущий + диджей', plan: 100000, fact: 100000, paid: 30000, note: '' },
  { category: 'Образ', name: 'Стилист', plan: 25000, fact: 25000, paid: 5000, note: '' },
  { category: 'Банкет', name: 'Торт', plan: 20000, fact: 0, paid: 0, note: '' },
  { category: 'Банкет', name: 'Свадебный ужин', plan: 350000, fact: 0, paid: 0, note: '' },
  { category: 'Команда', name: 'Организация', plan: 60000, fact: 60000, paid: 30000, note: '' },
];

const INITIAL_TIMING = [
  { time: '09:00', event: 'Пробуждение' },
  { time: '10:00', event: 'Сборы невесты' },
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
              <button key={type} onClick={() => { onSelect(type); setOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-[#F9F7F5] text-[#414942] text-sm font-medium uppercase">{type}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- SUB-VIEWS (ВОССТАНОВЛЕН ПОЛНЫЙ ФУНКЦИОНАЛ) ---

const TasksView = ({ tasks, updateProject, formatDate, downloadCSV }) => {
    const handleExport = (type) => {
        if (type === 'pdf') window.print();
        else downloadCSV([['Задача','Статус'], ...tasks.map(x=>[x.text, x.done?'+':'-'])], 'tasks.csv');
    };

    return (
    <div className="space-y-6 animate-fadeIn pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <h2 className="text-2xl font-serif text-[#414942]">Список задач</h2>
        <div className="flex gap-2 w-full md:w-auto">
           <Button variant="primary" onClick={() => updateProject('tasks', [...tasks, { id: Date.now(), text: 'Новая задача', deadline: new Date().toISOString(), done: false }])} className="flex-1 md:flex-none"><Plus size={18}/> Добавить</Button>
           <DownloadMenu onSelect={handleExport} />
        </div>
      </div>
      <div className="grid gap-4">
        {tasks.sort((a,b) => (a.done === b.done ? 0 : a.done ? 1 : -1)).map((task, i) => (
            <div key={task.id} className="group flex flex-col md:flex-row md:items-start p-4 bg-white rounded-xl border border-[#EBE5E0]">
              <div className="flex items-start flex-1 gap-4 pt-1">
                <Checkbox checked={task.done} onChange={(c) => { const n = [...tasks]; n.find(x=>x.id===task.id).done = c; updateProject('tasks', n); }} />
                <div className="flex-1 min-w-0">
                  <AutoHeightTextarea className={`w-full font-medium text-base md:text-lg bg-transparent outline-none ${task.done ? 'line-through text-[#CCBBA9]' : 'text-[#414942]'}`} value={task.text} onChange={(e) => { const n = [...tasks]; n.find(x=>x.id===task.id).text = e.target.value; updateProject('tasks', n); }} placeholder="Текст задачи" />
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-4 pl-10 md:pl-0 w-full md:w-auto pt-1">
                <div className="flex items-center gap-2 text-[#AC8A69] bg-[#F9F7F5] px-3 py-1.5 rounded-lg w-full md:w-[160px]">
                    <CalendarDays size={14}/><input type="date" className="bg-transparent outline-none text-sm w-full cursor-pointer" value={toInputDate(task.deadline)} onChange={(e) => { const n = [...tasks]; n.find(x=>x.id===task.id).deadline = e.target.value; updateProject('tasks', n); }} />
                </div>
                <button onClick={() => updateProject('tasks', tasks.filter(x=>x.id!==task.id))} className="text-[#CCBBA9] hover:text-red-400 p-2"><Trash2 size={18} /></button>
              </div>
            </div>
        ))}
      </div>
    </div>
    );
};

const BudgetView = ({ expenses, updateProject, downloadCSV }) => {
      const totals = expenses.reduce((acc, item) => ({ plan: acc.plan + Number(item.plan), fact: acc.fact + Number(item.fact), paid: acc.paid + Number(item.paid) }), { plan: 0, fact: 0, paid: 0 });
      
      const handleExport = (type) => {
        if (type === 'pdf') window.print();
        else downloadCSV([["Наименование", "План", "Факт", "Внесено", "Остаток", "Комментарий"], ...expenses.map(e => [e.name, e.plan, e.fact, e.paid, e.fact - e.paid, e.note || '']), ["ИТОГО", totals.plan, totals.fact, totals.paid, totals.fact - totals.paid, ""]], "budget.csv");
      };

      return (
        <div className="animate-fadeIn pb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {['План', 'Факт', 'Внесено', 'Остаток'].map((label, i) => (
                <Card key={label} className={`p-4 md:p-6 text-center ${i===3 ? 'bg-[#414942] text-white' : ''}`}>
                    <p className={`${i===3 ? 'text-white/60' : 'text-[#AC8A69]'} text-[10px] md:text-xs uppercase tracking-widest mb-2`}>{label}</p>
                    <p className={`text-lg md:text-2xl font-medium ${i===3 ? 'text-white' : i===2 ? 'text-[#936142]' : 'text-[#414942]'}`}>
                        {formatCurrency(i===0?totals.plan:i===1?totals.fact:i===2?totals.paid:totals.fact-totals.paid)}
                    </p>
                </Card>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-[#EBE5E0] overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead><tr className="bg-[#F9F7F5] text-[#936142] text-xs md:text-sm uppercase tracking-wider"><th className="p-4 w-[200px]">Статья</th><th className="p-4 w-[120px]">План</th><th className="p-4 w-[120px]">Факт</th><th className="p-4 w-[120px]">Внесено</th><th className="p-4 w-[120px]">Остаток</th><th className="p-4 w-[200px]">Комментарии</th><th className="p-4 w-10"></th></tr></thead>
                      <tbody className="divide-y divide-[#EBE5E0]">
                      {expenses.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#F9F7F5]/50 group">
                          <td className="p-4 align-top"><AutoHeightTextarea className="w-full bg-transparent outline-none font-medium text-[#414942] text-sm md:text-base" value={item.name} onChange={(e) => { const n=[...expenses]; n[idx].name=e.target.value; updateProject('expenses', n); }} /></td>
                          <td className="p-4 align-top"><MoneyInput value={item.plan} onChange={(v) => { const n=[...expenses]; n[idx].plan=v; updateProject('expenses', n); }} className="w-full text-[#414942]" /></td>
                          <td className="p-4 align-top"><MoneyInput value={item.fact} onChange={(v) => { const n=[...expenses]; n[idx].fact=v; updateProject('expenses', n); }} className="w-full text-[#414942]" /></td>
                          <td className="p-4 align-top"><MoneyInput value={item.paid} onChange={(v) => { const n=[...expenses]; n[idx].paid=v; updateProject('expenses', n); }} className="w-full text-[#414942]" /></td>
                          <td className="p-4 align-top text-[#AC8A69]">{formatCurrency(item.fact - item.paid)}</td>
                          <td className="p-4 align-top"><AutoHeightTextarea className="w-full bg-transparent outline-none text-xs text-[#AC8A69]" placeholder="..." value={item.note || ''} onChange={(e) => { const n=[...expenses]; n[idx].note=e.target.value; updateProject('expenses', n); }} /></td>
                          <td className="p-4 align-top"><button onClick={() => { const n=[...expenses]; n.splice(idx,1); updateProject('expenses', n); }} className="text-red-300 hover:text-red-500"><Trash2 size={16} /></button></td>
                          </tr>
                      ))}
                      </tbody>
                  </table>
              </div>
          </div>
          <div className="flex items-center gap-2 mt-6">
              <Button onClick={() => updateProject('expenses', [...expenses, { name: '', plan: 0, fact: 0, paid: 0 }])} variant="primary"><Plus size={18}/> Добавить статью</Button>
              <DownloadMenu onSelect={handleExport} />
          </div>
        </div>
      );
};

const GuestsView = ({ guests, updateProject, downloadCSV }) => {
    // Восстановлены все поля: Рассадка, Трансфер, Еда/Напитки
    const addGuest = () => updateProject('guests', [...guests, { id: Date.now(), name: '', seatingName: '', table: '', food: '', drinks: '', transfer: false, comment: '' }]);
    const updateGuest = (id, field, val) => updateProject('guests', guests.map(g => g.id === id ? { ...g, [field]: val } : g));
    const removeGuest = (id) => updateProject('guests', guests.filter(g => g.id !== id));
    
    const handleExport = (type) => {
        if (type === 'pdf') window.print();
        else downloadCSV([["ФИО", "Рассадка", "Стол", "Еда", "Напитки", "Трансфер", "Комментарий"], ...guests.map(g => [g.name, g.seatingName, g.table, g.food, g.drinks, g.transfer ? "Да" : "Нет", g.comment])], "guests.csv");
    };

    return (
      <div className="animate-fadeIn pb-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
              <div className="flex items-baseline gap-4"><h2 className="text-2xl font-serif text-[#414942]">Список гостей</h2><span className="text-[#AC8A69] font-medium">{guests.length} персон</span></div>
              <div className="flex gap-2 w-full md:w-auto">
                  <Button onClick={addGuest} variant="primary" className="flex-1 md:flex-none"><Plus size={18}/> Добавить</Button>
                  <DownloadMenu onSelect={handleExport} />
              </div>
          </div>
          <div className="hidden print:block mb-8"><h1 className="text-3xl font-serif text-[#414942]">Список гостей</h1><p className="text-[#AC8A69] mb-4">Всего персон: {guests.length}</p></div>
          
          {/* Print Table View */}
          <div className="hidden print:block w-full">
             <table className="w-full text-left border-collapse text-sm">
                <thead><tr className="border-b border-[#414942] text-[#936142]"><th className="py-2">ФИО</th><th className="py-2">Рассадка</th><th className="py-2">Стол</th><th className="py-2">Еда/Напитки</th><th className="py-2">Трансфер</th><th className="py-2">Комментарий</th></tr></thead>
                <tbody className="divide-y divide-[#CCBBA9]">{guests.map(g => (<tr key={g.id} className="break-inside-avoid"><td className="py-2">{g.name}</td><td className="py-2">{g.seatingName}</td><td className="py-2">{g.table}</td><td className="py-2">{g.food} / {g.drinks}</td><td className="py-2">{g.transfer ? 'Да' : ''}</td><td className="py-2">{g.comment}</td></tr>))}</tbody>
             </table>
          </div>

          <div className="grid gap-4 print:hidden">
              {guests.map((guest, idx) => (
                  <Card key={guest.id} className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          <div className="flex items-center justify-between w-full md:w-auto md:col-span-1"><span className="w-8 h-8 rounded-full bg-[#CCBBA9]/30 text-[#936142] flex items-center justify-center font-bold text-sm">{idx + 1}</span><button onClick={() => removeGuest(guest.id)} className="md:hidden text-red-400"><Trash2 size={18}/></button></div>
                          
                          <div className="w-full md:col-span-3">
                              <label className="text-[10px] text-[#CCBBA9] font-bold uppercase">ФИО</label>
                              <input className="w-full text-lg font-medium text-[#414942] bg-transparent border-b border-transparent focus:border-[#AC8A69] outline-none" placeholder="Имя гостя" value={guest.name} onChange={(e) => updateGuest(guest.id, 'name', e.target.value)} />
                              <input className="w-full text-sm text-[#AC8A69] bg-transparent outline-none mt-1 border-b border-[#EBE5E0]" placeholder="Имя на карточке рассадки" value={guest.seatingName} onChange={(e) => updateGuest(guest.id, 'seatingName', e.target.value)} />
                          </div>
                          
                          <div className="w-1/2 md:w-full md:col-span-2">
                              <label className="text-[10px] text-[#CCBBA9] font-bold uppercase">Стол №</label>
                              <input className="w-full bg-transparent border-b border-[#EBE5E0] focus:border-[#AC8A69] outline-none py-1" value={guest.table} onChange={(e) => updateGuest(guest.id, 'table', e.target.value)} />
                          </div>
                          
                          <div className="w-full md:col-span-3">
                              <label className="text-[10px] text-[#CCBBA9] font-bold uppercase">Пожелания</label>
                              <input className="w-full text-sm bg-transparent border-b border-[#EBE5E0] outline-none py-1 mb-1" placeholder="Еда (аллергии...)" value={guest.food} onChange={(e) => updateGuest(guest.id, 'food', e.target.value)} />
                              <input className="w-full text-sm bg-transparent border-b border-[#EBE5E0] outline-none py-1" placeholder="Напитки..." value={guest.drinks} onChange={(e) => updateGuest(guest.id, 'drinks', e.target.value)} />
                          </div>
                          
                          <div className="w-full md:col-span-2 flex items-center gap-2 pt-4">
                              <label className="flex items-center cursor-pointer select-none">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center mr-2 transition-colors ${guest.transfer ? 'bg-[#936142] border-[#936142]' : 'border-[#CCBBA9]'}`}>{guest.transfer && <CheckSquare size={12} color="white"/>}</div>
                                  <input type="checkbox" className="hidden" checked={guest.transfer} onChange={(e) => updateGuest(guest.id, 'transfer', e.target.checked)} />
                                  <span className="text-sm text-[#414942]">Нужен трансфер</span>
                              </label>
                          </div>
                          
                          <div className="hidden md:flex md:col-span-1 justify-end pt-4"><button onClick={() => removeGuest(guest.id)} className="text-[#CCBBA9] hover:text-red-400"><Trash2 size={18}/></button></div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#F9F7F5]"><input className="w-full text-sm text-[#414942] italic bg-transparent outline-none" placeholder="Комментарий / Заметка..." value={guest.comment} onChange={(e) => updateGuest(guest.id, 'comment', e.target.value)} /></div>
                  </Card>
              ))}
          </div>
      </div>
    );
};

const TimingView = ({ timing, updateProject, downloadCSV }) => {
    const sortTiming = (list) => [...list].sort((a, b) => a.time.localeCompare(b.time));
    const updateTimingItem = (id, field, value) => { const newTiming = timing.map(t => t.id === id ? { ...t, [field]: value } : t); updateProject('timing', newTiming); };
    const handleBlurSort = () => updateProject('timing', sortTiming(timing));
    const removeTimingItem = (id) => updateProject('timing', timing.filter(t => t.id !== id));
    const addTimingItem = () => { const newItem = { id: Math.random().toString(36).substr(2, 9), time: '00:00', event: 'Новый этап' }; updateProject('timing', sortTiming([...timing, newItem])); };
    const handleExport = (type) => {
        if (type === 'pdf') window.print();
        else downloadCSV([["Время", "Событие"], ...timing.map(t => [t.time, t.event])], "timing.csv");
    };

    return (
    <div className="animate-fadeIn max-w-2xl mx-auto pb-24">
        <div className="flex justify-end mb-4 print:hidden"><DownloadMenu onSelect={handleExport} /></div>
        <div className="hidden print:block mb-8"><h1 className="text-3xl font-serif text-[#414942] mb-2">Тайминг дня</h1></div>
        <div className="relative border-l border-[#EBE5E0] ml-4 md:ml-6 space-y-6 print:border-none print:ml-0 print:space-y-2">
            {timing.sort((a,b)=>a.time.localeCompare(b.time)).map((item, idx) => (
                <div key={item.id} className="relative pl-6 group print:pl-0 print:border-b print:pb-2 print:border-[#EBE5E0]">
                    <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#AC8A69] transition-all group-hover:scale-125 group-hover:border-[#936142] print:hidden"></div>
                    <div className="flex items-baseline gap-4">
                          <input className="w-16 text-lg font-bold text-[#936142] bg-transparent outline-none text-right" value={item.time} onChange={(e) => updateTimingItem(item.id, 'time', e.target.value)} onBlur={handleBlurSort} />
                          <input className="flex-1 text-base text-[#414942] bg-transparent outline-none border-b border-transparent focus:border-[#AC8A69]" value={item.event} onChange={(e) => updateTimingItem(item.id, 'event', e.target.value)} />
                          <button onClick={() => removeTimingItem(item.id)} className="opacity-0 group-hover:opacity-100 text-[#CCBBA9] hover:text-red-400"><X size={14}/></button>
                    </div>
                </div>
            ))}
            <div className="pl-6 pt-2 print:hidden"><button onClick={addTimingItem} className="flex items-center gap-2 text-[#AC8A69] hover:text-[#936142] text-xs font-medium"><Plus size={10}/> Добавить этап</button></div>
        </div>
    </div>
    );
};

const NotesView = ({ notes, updateProject }) => (
  <div className="h-full flex flex-col animate-fadeIn pb-24 md:pb-0">
      <textarea className="flex-1 w-full bg-white p-8 rounded-2xl shadow-sm border border-[#EBE5E0] text-[#414942] leading-relaxed resize-none focus:ring-2 focus:ring-[#936142]/10 outline-none min-h-[50vh] print:shadow-none print:border-none print:p-0" placeholder="Место для важных мыслей, черновиков клятв и идей..." value={notes} onChange={(e) => updateProject('notes', e.target.value)} />
  </div>
);

// --- APP COMPONENT ---

export default function App() {
  const [projects, setProjects] = useState(() => JSON.parse(localStorage.getItem('wedding_projects') || '[]'));
  const [team, setTeam] = useState(() => JSON.parse(localStorage.getItem('wedding_team') || '[]'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('wedding_user') || '{"name":"Владелец","email":"owner@wed.control","role":"owner"}'));
  
  const [currentProject, setCurrentProject] = useState(null);
  const [view, setView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardTab, setDashboardTab] = useState('active'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // --- МАГИЯ ДЛЯ ДЕМО-ССЫЛКИ ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
        let proj = projects.find(p => p.id.toString() === id);
        if (!proj) {
            // Создаем демо-проект на лету для гостя
            proj = {
                id: Number(id),
                groomName: 'Иван', brideName: 'Анна', date: new Date().toISOString(),
                organizerName: 'Демо Организатор', clientPassword: '123',
                tasks: TASK_TEMPLATES.map(t => ({ id: Math.random(), text: t.text, deadline: new Date().toISOString(), done: false })),
                expenses: INITIAL_EXPENSES, timing: INITIAL_TIMING.map(t => ({...t, id: Math.random()})),
                guests: [], notes: ''
            };
            setProjects(prev => [...prev, proj]);
        }
        setCurrentProject(proj);
        setUser({ name: 'Гость', role: 'client' });
        setView('project');
    }
  }, []);

  useEffect(() => localStorage.setItem('wedding_projects', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('wedding_team', JSON.stringify(team)), [team]);
  useEffect(() => localStorage.setItem('wedding_user', JSON.stringify(user)), [user]);

  const handleLogout = () => {
      if(window.confirm('Перезагрузить страницу демо-версии?')) {
        window.location.reload();
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

  const saveSettings = (updatedData) => {
    setCurrentProject(updatedData);
    setProjects(list => list.map(p => p.id === updatedData.id ? updatedData : p));
    setIsSettingsOpen(false);
  };

  const deleteProject = (id) => {
    if(window.confirm('Удалить проект?')) {
        setProjects(list => list.filter(p => p.id !== id));
        setIsSettingsOpen(false);
        setView('dashboard');
    }
  };

  const toggleArchive = (id) => {
    const p = projects.find(x => x.id === id);
    p.isArchived = !p.isArchived;
    setProjects([...projects]);
    setIsSettingsOpen(false);
    setView('dashboard');
  };

  if (view === 'team') {
      return <OrganizersView team={team} onBack={() => setView('dashboard')} onAdd={(m) => setTeam([...team, m])} onDelete={(id) => setTeam(team.filter(t => t.id !== id))} />;
  }

  // ОБЩИЙ ДАШБОРД (ИЛИ ЛОГИН - У НАС СРАЗУ ВХОД)
  if (view === 'dashboard' || view === 'login') {
    const filteredProjects = projects.filter(p => dashboardTab === 'active' ? !p.isArchived : p.isArchived);
    return (
      <div className="min-h-screen bg-[#F9F7F5] p-6 md:p-12 pb-32 font-[Montserrat]">
        <div className="max-w-6xl mx-auto">
          {isProfileOpen && <ProfileModal user={user} onClose={() => setIsProfileOpen(false)} onSave={(u) => { setUser(u); setIsProfileOpen(false); }} />}
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div>
                <h1 className="text-4xl md:text-5xl font-bold text-[#414942] tracking-tight">Wed.Control</h1>
                <button onClick={() => setIsProfileOpen(true)} className="text-[#AC8A69] mt-2 hover:text-[#936142] flex items-center gap-2">Кабинет: {user?.name} <Edit3 size={14}/></button>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={() => { setFormData(INITIAL_FORM_STATE); setView('create'); }}><Plus size={20}/> Новый проект</Button>
                <Button variant="secondary" onClick={() => setView('team')}><UsersIcon size={20}/> Команда</Button>
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
                    <div className="flex items-center justify-between mt-8 border-t border-[#F9F7F5] pt-4">
                        <div><p className="text-[10px] text-[#CCBBA9] uppercase">Организатор</p><p className="text-xs text-[#AC8A69] font-bold">{p.organizerName || 'Владелец'}</p></div>
                        <span className="text-[#936142] group-hover:translate-x-1 transition-transform"><ArrowRight size={20}/></span>
                    </div>
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
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-[#AC8A69] uppercase tracking-wider mb-2 ml-1">Ответственный организатор</label>
                            <select className="w-full bg-white border-none rounded-xl p-4 text-[#414942] outline-none" value={formData.organizerId} onChange={e => setFormData({...formData, organizerId: e.target.value})}>
                                <option value="owner">Владелец (Я)</option>
                                {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Input label="Жених" placeholder="Имя" value={formData.groomName} onChange={e => setFormData({...formData, groomName: e.target.value})} /><Input label="Невеста" placeholder="Имя" value={formData.brideName} onChange={e => setFormData({...formData, brideName: e.target.value})} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Input label="Дата свадьбы" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /><Input label="Гостей" type="number" placeholder="50" value={formData.guestsCount} onChange={e => setFormData({...formData, guestsCount: e.target.value})} /></div>
                    </div>
                    <div className="space-y-4"><label className="block text-xs font-semibold text-[#AC8A69] uppercase tracking-wider ml-1">Детали дня</label><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><select className="w-full bg-white border border-[#EBE5E0] rounded-xl p-4 text-[#414942] outline-none focus:border-[#AC8A69]" value={formData.prepLocation} onChange={e => setFormData({...formData, prepLocation: e.target.value})}><option value="home">Сборы дома</option><option value="hotel">Сборы в отеле</option></select><select className="w-full bg-white border border-[#EBE5E0] rounded-xl p-4 text-[#414942] outline-none focus:border-[#AC8A69]" value={formData.registrationType} onChange={e => setFormData({...formData, registrationType: e.target.value})}><option value="official">ЗАГС</option><option value="offsite">Выездная регистрация</option></select></div></div>
                    <div className="grid grid-cols-1 gap-4"><Input label="Локация" placeholder="Название ресторана / отеля" value={formData.venueName} onChange={e => setFormData({...formData, venueName: e.target.value})} /></div>
                    <div className="bg-[#F9F7F5] p-4 rounded-xl flex items-center gap-3 border border border-[#AC8A69]/20"><Key className="text-[#936142]" /><div className="flex-1"><p className="text-xs font-bold text-[#AC8A69] uppercase">Пароль для клиента (авто)</p><div className="flex gap-2"><input className="bg-transparent font-mono text-xl font-bold text-[#414942] outline-none w-full" value={formData.clientPassword} onChange={e => setFormData({...formData, clientPassword: e.target.value})} /><button onClick={() => setFormData({...formData, clientPassword: Math.floor(1000 + Math.random() * 9000).toString()})} className="text-[#AC8A69] hover:text-[#936142]"><Edit3 size={16}/></button></div></div></div>
                    <Button onClick={createProject} className="w-full mt-8">Создать проект</Button>
                </div>
            </Card>
            <div className="h-24"></div> {/* Extra space at bottom */}
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
        
        {/* Mobile Nav */}
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
          {activeTab === 'tasks' && <TasksView tasks={currentProject.tasks} updateProject={updateProjectData} formatDate={formatDate} downloadCSV={downloadCSV} />}
          {activeTab === 'budget' && <BudgetView expenses={currentProject.expenses} updateProject={updateProjectData} downloadCSV={downloadCSV} />}
          {activeTab === 'guests' && <GuestsView guests={currentProject.guests} updateProject={updateProjectData} downloadCSV={downloadCSV} />}
          {activeTab === 'timing' && <TimingView timing={currentProject.timing} updateProject={updateProjectData} downloadCSV={downloadCSV} />}
          {activeTab === 'notes' && <NotesView notes={currentProject.notes} updateProject={updateProjectData} />}
        </main>
      </div>
    );
  }
  return null;
}