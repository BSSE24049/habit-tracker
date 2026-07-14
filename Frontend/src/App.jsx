import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti'; // Import the celebration trigger!
import { cn } from './utils/cn';
import { Plus, Check, Trash2, Flame, Calendar, Sparkles, CheckCircle2, Trophy, Hash, Filter, Clock, ChevronDown, BarChart3, Percent } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/habits';

const CATEGORIES = [
  { name: 'General', color: 'border-slate-800 bg-slate-900/40 text-slate-400' },
  { name: 'Health', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' },
  { name: 'Mind', color: 'border-purple-500/20 bg-purple-500/5 text-purple-400' },
  { name: 'Work', color: 'border-blue-500/20 bg-blue-500/5 text-blue-400' },
  { name: 'Finance', color: 'border-amber-500/20 bg-amber-500/5 text-amber-400' }
];

const TIMES_OF_DAY = ['Anytime', 'Morning', 'Afternoon', 'Evening'];

function App() {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [selectedTime, setSelectedTime] = useState('Anytime');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [expandedHabitId, setExpandedHabitId] = useState(null);
  const [loading, setLoading] = useState(true);

  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.is_completed).length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  useEffect(() => { fetchHabits(); }, []);

  const fetchHabits = async () => {
    try {
      const response = await axios.get(API_URL);
      setHabits(response.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const addHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.trim()) return;
    try {
      const response = await axios.post(API_URL, { 
        name: newHabit, 
        category: selectedCategory,
        time_of_day: selectedTime
      });
      setHabits([response.data, ...habits]);
      setNewHabit('');
    } catch (error) { console.error(error); }
  };

  // Triggered on completion checkmarks
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#34d399', '#059669', '#ffffff'], // Premium emerald tones
      disableForReducedMotion: true
    });
  };

  const toggleHabit = async (id, e) => {
    e.stopPropagation();
    try {
      const response = await axios.post(`${API_URL}/${id}/toggle`);
      
      // If the habit is transitioning to COMPLETED, celebrate!
      if (response.data.is_completed) {
        triggerConfetti();
      }

      setHabits(habits.map(h => h.id === id ? response.data : h));
      if (navigator.vibrate) navigator.vibrate(8);
    } catch (error) { console.error(error); }
  };

  const deleteHabit = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_URL}/${id}`);
      setHabits(habits.filter(h => h.id !== id));
    } catch (error) { console.error(error); }
  };

  const getLast7Days = () => {
    const days = [];
    const options = { weekday: 'narrow' };
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString('en-US', options),
        dateStr: d.toISOString().split('T')[0],
        isToday: i === 0
      });
    }
    return days;
  };

  const weekDays = getLast7Days();

  const filteredHabits = habits.filter(habit => {
    const matchesStatus = activeFilter === 'All' || (activeFilter === 'Completed' && habit.is_completed) || (activeFilter === 'Pending' && !habit.is_completed);
    const matchesCategory = activeCategoryFilter === 'All' || habit.category === activeCategoryFilter;
    return matchesStatus && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#06080f] text-slate-200 font-sans antialiased relative overflow-hidden flex flex-col items-center py-16 px-4">
      <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/[0.08] rounded-full blur-[140px] pointer-events-none" />
      
      <div className="max-w-2xl w-full relative z-10">
        
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20"><Sparkles className="w-4 h-4" /></span>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500/80">Premium Tracker</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">Daily Focus</h1>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500 block font-medium">Current Consistency</span>
            <span className="text-lg font-mono font-bold text-emerald-400">{completionRate}% Done</span>
          </div>
        </motion.header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Active', val: totalHabits, icon: <Calendar className="w-3.5 h-3.5 text-emerald-500" /> },
            { label: 'Done Today', val: completedToday, icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />, colorClass: "text-teal-400" },
            { label: 'Best Streak', val: habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0, icon: <Trophy className="w-3.5 h-3.5 text-amber-500" />, colorClass: "text-amber-400" }
          ].map((stat, i) => (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={stat.label} className="bg-[#0b0e17]/40 backdrop-blur-md border border-slate-900 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-800 transition-colors">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">{stat.icon} {stat.label}</span>
              <span className={cn("text-2xl font-bold mt-2 text-white", stat.colorClass)}>{stat.val}</span>
            </motion.div>
          ))}
        </div>

        {/* Input Creator */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#090d16]/30 backdrop-blur-md border border-slate-900 p-5 rounded-2xl mb-10 shadow-xl">
          <form onSubmit={addHabit} className="relative flex items-center mb-4 group">
            <input
              type="text"
              placeholder="Introduce a new ritual..."
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              className="w-full pl-4 pr-14 py-3.5 bg-[#080b12] border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-white placeholder-slate-600 transition-all duration-300 group-hover:border-slate-800"
            />
            <button type="submit" className="absolute right-2 p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg cursor-pointer shadow-lg shadow-emerald-500/20"><Plus className="w-4 h-4 stroke-[2.5]" /></button>
          </form>

          {/* Double Selectors Line */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between border-t border-slate-900/60 pt-3">
            {/* Category */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> Tag</span>
              {CATEGORIES.map((cat) => (
                <button key={cat.name} type="button" onClick={() => setSelectedCategory(cat.name)} className={cn("px-2.5 py-0.5 text-xs font-semibold rounded-full border transition-all cursor-pointer", selectedCategory === cat.name ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-slate-800/60 text-slate-500 hover:text-slate-300")}>{cat.name}</button>
              ))}
            </div>
            {/* Time of Day */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="bg-[#05070c] text-xs text-slate-400 border border-slate-800 rounded-lg px-2 py-1 outline-none focus:border-emerald-500/40 cursor-pointer">
                {TIMES_OF_DAY.map(time => (<option key={time} value={time}>{time}</option>))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-2 border-b border-slate-900">
          <div className="flex gap-1.5 p-1 bg-[#05070c]/60 rounded-xl border border-slate-900/60">
            {['All', 'Pending', 'Completed'].map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)} className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer", activeFilter === f ? "bg-slate-900 text-white border border-slate-800" : "text-slate-500 hover:text-slate-300")}>{f}</button>
            ))}
          </div>
          <div className="flex gap-1 items-center max-w-full overflow-x-auto scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-slate-600 mr-1" />
            {['All', ...CATEGORIES.map(c => c.name)].map((cf) => (
              <button key={cf} onClick={() => setActiveCategoryFilter(cf)} className={cn("px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer", activeCategoryFilter === cf ? "border-slate-700 bg-slate-800/40 text-slate-200" : "border-transparent text-slate-600 hover:text-slate-400")}>{cf}</button>
            ))}
          </div>
        </div>

        {/* Habits Feed list */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 border-r-2 border-transparent" /></div>
        ) : filteredHabits.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-900 rounded-3xl bg-[#080b12]/10"><p className="text-slate-500 font-medium">No custom rituals found.</p></div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredHabits.map((habit) => {
                const catObj = CATEGORIES.find(c => c.name === habit.category) || CATEGORIES[0];
                const isExpanded = expandedHabitId === habit.id;
                
                const totalLoggedCompletions = habit.completed_dates?.length || 0;
                const totalPossibleDays = 7; 
                const pastWeekScore = totalLoggedCompletions > 0 ? Math.min(100, Math.round((totalLoggedCompletions / totalPossibleDays) * 100)) : 0;

                return (
                  <motion.div
                    layout
                    key={habit.id}
                    onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}
                    className="group relative flex flex-col p-5 bg-[#090d16]/40 backdrop-blur-md border border-slate-900 rounded-2xl hover:border-slate-800/80 transition-all duration-300 cursor-pointer shadow-md overflow-hidden"
                  >
                    <div className="flex items-center justify-between w-full">
                      {/* Left accent column bar indicator */}
                      <div className={cn("absolute left-0 top-4 bottom-4 w-[2px] rounded-r-md transition-all", habit.is_completed ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-transparent")} />

                      <div className="flex items-center gap-4">
                        <button onClick={(e) => toggleHabit(habit.id, e)} className={cn("w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer", habit.is_completed ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]" : "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-transparent")}>
                          <Check className={cn("w-3.5 h-3.5 stroke-[3] transition-all", habit.is_completed ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
                        </button>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-base font-semibold tracking-wide transition-all", habit.is_completed ? "text-slate-500 line-through" : "text-slate-100")}>{habit.name}</span>
                            <span className={cn("px-2 py-0.5 text-[9px] font-bold rounded-full border", catObj.color)}>{habit.category}</span>
                            {habit.time_of_day !== 'Anytime' && (
                              <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-md bg-slate-950/80 border border-slate-900 text-slate-500 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {habit.time_of_day}</span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
                            <Flame className={cn("w-3.5 h-3.5", habit.streak > 0 ? "text-amber-500" : "text-slate-700")} /> Streak: {habit.streak} days
                          </span>
                        </div>
                      </div>

                      {/* Right Viewport: Calendar Boxes */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-[#05070c]/50 p-1 rounded-xl border border-slate-900/60" onClick={(e) => e.stopPropagation()}>
                          {weekDays.map((day, idx) => {
                            const logged = habit.completed_dates?.includes(day.dateStr);
                            return (
                              <div key={idx} className={cn("w-5 h-5 rounded-md flex items-center justify-center transition-all text-[10px] font-bold", logged ? "bg-emerald-500 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.25)]" : day.isToday ? "border border-slate-800 bg-slate-950/40 text-slate-400" : "bg-slate-950/10 border border-slate-950 text-slate-800")}>
                                {logged ? <Check className="w-3 h-3 stroke-[3.5]" /> : day.label}
                              </div>
                            );
                          })}
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-slate-600 transition-transform duration-300", isExpanded && "transform rotate-180 text-slate-400")} />
                      </div>
                    </div>

                    {/* Expandable Statistics Analytics Panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="border-t border-slate-900/60 pt-4 flex flex-col gap-4 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#05070c]/60 border border-slate-900/80 rounded-xl p-3 flex items-center gap-3">
                              <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg"><BarChart3 className="w-4 h-4" /></div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Total Check-Ins</span>
                                <span className="text-sm font-mono font-bold text-white">{totalLoggedCompletions} logs</span>
                              </div>
                            </div>
                            <div className="bg-[#05070c]/60 border border-slate-900/80 rounded-xl p-3 flex items-center gap-3">
                              <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg"><Percent className="w-4 h-4" /></div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">7-Day Consistency</span>
                                <span className="text-sm font-mono font-bold text-purple-400">{pastWeekScore}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center bg-[#1c0d12]/10 border border-rose-950/20 rounded-xl p-2 px-3">
                            <span className="text-xs text-slate-500">Danger Zone</span>
                            <button onClick={(e) => deleteHabit(habit.id, e)} className="text-xs text-rose-500/70 hover:text-rose-400 flex items-center gap-1 font-semibold p-1.5 hover:bg-rose-500/5 rounded-lg transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Remove Ritual</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;