import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Award, 
  Star, 
  Medal, 
  Building2, 
  Flame, 
  Plus, 
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchRecognitions, saveRecognition } from '../services/recognitionService';
import { RecognitionItem } from '../types';

export const RecognitionPage: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const [period, setPeriod] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY');
  const [recognitions, setRecognitions] = useState<RecognitionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formEmpName, setFormEmpName] = useState('');
  const [formEmpId, setFormEmpId] = useState('PRX-002');
  const [formDeptName, setFormDeptName] = useState('Engineering Core');
  const [formCategory, setFormCategory] = useState('Engineering Excellence');
  const [formAchievement, setFormAchievement] = useState('');
  const [formScore, setFormScore] = useState(95);
  const [formRank, setFormRank] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const loadRecognitions = async () => {
    setLoading(true);
    try {
      const data = await fetchRecognitions(period);
      setRecognitions(data);
    } catch (err) {
      console.error('Error fetching recognitions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecognitions();
  }, [period]);

  const top3 = recognitions.filter(r => r.rank <= 3).sort((a, b) => a.rank - b.rank);
  const honorableMentions = recognitions.filter(r => r.rank > 3);

  const handleAddRecognition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSubmitting(true);
    try {
      const item: RecognitionItem = {
        id: `REC-${Date.now().toString().slice(-4)}`,
        period,
        rank: Number(formRank),
        category: formCategory,
        employeeName: formEmpName,
        employeeId: formEmpId,
        departmentName: formDeptName,
        achievement: formAchievement,
        score: Number(formScore),
        dateAwarded: new Date().toISOString().split('T')[0],
      };
      await saveRecognition(item, userProfile.uid, userProfile.name);
      await loadRecognitions();
      setShowAddModal(false);
    } catch (err) {
      console.error('Error saving recognition:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#DDD7CA] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#789B8B] uppercase flex items-center space-x-1.5">
            <Trophy size={14} className="text-[#C5A45D]" />
            <span>Excellence & Merit Honours</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#174A4A] font-display mt-1 tracking-tight">
            Recognition & Leaderboard
          </h1>
          <p className="text-xs md:text-sm text-[#73716B] mt-1 font-normal max-w-xl">
            Celebrating outstanding technical contributions, peer leadership, and mission impact across Prionix.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* PERIOD TABS */}
          <div className="flex items-center space-x-1 bg-[#EFEAE0] p-1 rounded-xl border border-[#DDD7CA]">
            {(['MONTHLY', 'QUARTERLY', 'YEARLY'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  period === p 
                    ? 'bg-[#174A4A] text-[#F7F4ED]' 
                    : 'text-[#73716B] hover:text-[#30302D]'
                }`}
              >
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#174A4A] hover:bg-[#123B3B] text-[#F7F4ED] transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Award Recognition</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. TOP 3 PODIUM */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider text-[#73716B] uppercase">
            Top 3 Performers &bull; {period} HONOURS
          </h2>
          <span className="text-[11px] text-[#789B8B] font-semibold">Merit Score Evaluated</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          {top3.map((rec) => {
            const isFirst = rec.rank === 1;
            return (
              <div 
                key={rec.id}
                className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                  isFirst 
                    ? 'bg-[#EFEAE0] border-[#C5A45D] shadow-sm md:-translate-y-2' 
                    : 'bg-[#EFEAE0] border-[#DDD7CA]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                      rec.rank === 1 ? 'bg-[#C5A45D] text-[#F7F4ED]' :
                      rec.rank === 2 ? 'bg-[#789B8B] text-[#F7F4ED]' :
                      'bg-[#DDD7CA] text-[#30302D]'
                    }`}>
                      #{rec.rank}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#174A4A]/10 text-[#174A4A]">
                      Score: {rec.score}/100
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#174A4A] text-[#F7F4ED] flex items-center justify-center font-bold text-lg font-display shrink-0 overflow-hidden">
                      {rec.avatarUrl ? (
                        <img src={rec.avatarUrl} alt={rec.employeeName} className="w-full h-full object-cover" />
                      ) : (
                        rec.employeeName.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#30302D] font-display">{rec.employeeName}</h3>
                      <p className="text-[11px] text-[#73716B]">{rec.departmentName} &bull; {rec.employeeId}</p>
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-[#F7F4ED] border border-[#DDD7CA]">
                    <span className="text-[11px] font-bold text-[#174A4A] block mb-1">
                      {rec.category}
                    </span>
                    <p className="text-xs text-[#73716B] leading-relaxed">
                      {rec.achievement}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#DDD7CA] flex items-center justify-between text-[11px] text-[#73716B]">
                  <span>Awarded: {rec.dateAwarded}</span>
                  <span className="font-semibold text-[#4F8068]">Prionix Merit</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. HONOURABLE MENTIONS / ALL AWARDS */}
      {honorableMentions.length > 0 && (
        <section className="bg-[#EFEAE0] border border-[#DDD7CA] rounded-3xl p-6 md:p-8 space-y-4">
          <h3 className="text-base font-bold text-[#174A4A] font-display">
            Honorable Mentions & Department Stars
          </h3>

          <div className="divide-y divide-[#DDD7CA]">
            {honorableMentions.map(rec => (
              <div key={rec.id} className="py-3.5 flex items-start justify-between gap-4 text-xs">
                <div className="flex items-start space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-[#DDD7CA] text-[#30302D] font-bold text-xs flex items-center justify-center shrink-0">
                    #{rec.rank}
                  </span>
                  <div>
                    <div className="font-bold text-[#30302D]">{rec.employeeName} ({rec.employeeId})</div>
                    <div className="text-[#174A4A] font-semibold text-[11px]">{rec.category} &bull; {rec.departmentName}</div>
                    <p className="text-[#73716B] mt-0.5">{rec.achievement}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-[#174A4A]">Score: {rec.score}</span>
                  <div className="text-[10px] text-[#73716B]">{rec.dateAwarded}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. ADMIN AWARD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#30302D]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-[#F7F4ED] border border-[#DDD7CA] rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[#DDD7CA] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#789B8B] tracking-wider uppercase">
                  ENTERPRISE HONOURS
                </span>
                <h3 className="text-xl font-bold text-[#174A4A] font-display">
                  Confer Employee Recognition
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#73716B] hover:text-[#30302D]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddRecognition} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={formEmpName}
                    onChange={(e) => setFormEmpName(e.target.value)}
                    placeholder="e.g. Devika Krishnan"
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    placeholder="e.g. PRX-002"
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">Department</label>
                  <input
                    type="text"
                    value={formDeptName}
                    onChange={(e) => setFormDeptName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">Award Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">Podium Rank</label>
                  <select
                    value={formRank}
                    onChange={(e) => setFormRank(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D]"
                  >
                    <option value={1}>#1 Gold Podium</option>
                    <option value={2}>#2 Silver Podium</option>
                    <option value={3}>#3 Bronze Podium</option>
                    <option value={4}>#4 Honorable Mention</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#30302D] mb-1">Merit Score (1-100)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={formScore}
                    onChange={(e) => setFormScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#30302D] mb-1">Citation / Achievement Details</label>
                <textarea
                  rows={3}
                  value={formAchievement}
                  onChange={(e) => setFormAchievement(e.target.value)}
                  placeholder="Key contributions and milestones..."
                  className="w-full px-3 py-2 text-xs bg-[#EFEAE0] border border-[#DDD7CA] rounded-xl text-[#30302D]"
                  required
                />
              </div>

              <div className="pt-4 border-t border-[#DDD7CA] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#EFEAE0] border border-[#DDD7CA] text-[#30302D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#174A4A] text-[#F7F4ED] hover:bg-[#123B3B] disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Conferring...' : 'Confer Award'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
