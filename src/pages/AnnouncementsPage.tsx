import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Tag, 
  Trash2, 
  Pencil, 
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchAnnouncements, 
  saveAnnouncement, 
  deleteAnnouncement,
  getCachedAnnouncements
} from '../services/announcementService';
import { AnnouncementItem } from '../types';

export const AnnouncementsPage: React.FC = () => {
  const { userProfile, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => getCachedAnnouncements(!isAdmin));
  const [loading, setLoading] = useState(() => getCachedAnnouncements(!isAdmin).length === 0);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Admin Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<AnnouncementItem['category']>('GENERAL');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<AnnouncementItem['priority']>('NORMAL');
  const [submitting, setSubmitting] = useState(false);

  const loadAnnouncements = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // If Admin, load all (including drafts); else load published
      const data = await fetchAnnouncements(!isAdmin);
      setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = getCachedAnnouncements(!isAdmin);
    if (cached && cached.length > 0) {
      setAnnouncements(cached);
      setLoading(false);
      loadAnnouncements(true);
    } else {
      loadAnnouncements(false);
    }
  }, [isAdmin]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory('GENERAL');
    setFormDescription('');
    setFormPriority('NORMAL');
    setShowModal(true);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormPriority(item.priority);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSubmitting(true);
    try {
      const payload: AnnouncementItem = {
        id: editingItem ? editingItem.id : `ANN-${Date.now().toString().slice(-4)}`,
        title: formTitle.trim(),
        category: formCategory,
        description: formDescription.trim(),
        publishedDate: editingItem?.publishedDate || new Date().toISOString().split('T')[0],
        authorName: userProfile.name,
        authorEmployeeId: userProfile.employeeId,
        status: 'PUBLISHED',
        priority: formPriority,
      };
      await saveAnnouncement(payload, userProfile.uid, userProfile.name);
      await loadAnnouncements();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving announcement:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userProfile) return;
    const confirm = window.confirm('Delete this announcement?');
    if (!confirm) return;
    await deleteAnnouncement(id, userProfile.uid, userProfile.name);
    await loadAnnouncements();
  };

  const categories = ['ALL', 'GENERAL', 'HR', 'EVENTS', 'TRAINING', 'PROJECTS', 'POLICY'];

  const filtered = announcements.filter(a => {
    const matchesCat = selectedCategory === 'ALL' || a.category === selectedCategory;
    const matchesSearch = !searchTerm.trim() || 
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <section className="border-b border-[#E7E3D8] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-[#047857] uppercase flex items-center space-x-1.5">
            <Megaphone size={14} />
            <span>Corporate Communications & Policies</span>
          </span>
          <h1 className="text-2xl md:text-4xl font-normal text-[#0B2E2E] font-display mt-1 tracking-tight">
            Announcements
          </h1>
          <p className="text-xs md:text-sm text-[#656966] mt-1 font-normal max-w-xl">
            Official broadcasts, company directives, HR announcements, and executive policy memos.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#047857] hover:bg-[#065F46] text-white transition-colors flex items-center space-x-2 shadow-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Broadcast Announcement</span>
          </button>
        )}
      </section>

      {/* 2. CATEGORY PILLS & SEARCH */}
      <section className="p-4 rounded-3xl bg-white border border-[#E7E3D8] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#047857] text-white shadow-xs'
                  : 'bg-[#F8F6F1] text-[#656966] hover:text-[#222525] hover:bg-[#E7E3D8]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#656966]" />
          <input
            type="text"
            placeholder="Search broadcasts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
          />
        </div>
      </section>

      {/* 3. ANNOUNCEMENTS FEED */}
      <section className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 rounded-3xl bg-white border border-[#E7E3D8] animate-pulse space-y-3 shadow-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-4 bg-[#E7E3D8] rounded-full" />
                  <div className="w-16 h-4 bg-[#E7E3D8] rounded-full" />
                </div>
                <div className="w-3/4 h-5 bg-[#E7E3D8] rounded" />
                <div className="w-full h-12 bg-[#E7E3D8]/70 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#E7E3D8] rounded-3xl shadow-xs">
            <Megaphone size={32} className="mx-auto text-[#047857] mb-2" />
            <h3 className="text-sm font-bold text-[#0B2E2E]">No Announcements Found</h3>
            <p className="text-xs text-[#656966] mt-1">There are no company updates in this category.</p>
          </div>
        ) : (
          filtered.map(ann => (
            <div 
              key={ann.id}
              className="p-6 rounded-3xl bg-white border border-[#E7E3D8] hover:border-[#047857] transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                      {ann.category}
                    </span>
                    {ann.priority === 'HIGH' && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                        Urgent Broadcast
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#656966] flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>{ann.publishedDate}</span>
                  </span>
                </div>

                <h2 className="text-lg md:text-xl font-bold text-[#0B2E2E] font-display mb-2">
                  {ann.title}
                </h2>
                <p className="text-xs md:text-sm text-[#222525] leading-relaxed whitespace-pre-line">
                  {ann.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E7E3D8] flex items-center justify-between text-xs text-[#656966]">
                <div className="flex items-center space-x-2">
                  <User size={14} className="text-[#047857]" />
                  <span>Posted by <strong className="text-[#222525]">{ann.authorName}</strong> ({ann.authorEmployeeId})</span>
                </div>

                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(ann)}
                      className="p-1 text-[#656966] hover:text-[#047857] cursor-pointer transition-colors"
                      title="Edit Announcement"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1 text-[#DC2626]/70 hover:text-[#DC2626] cursor-pointer transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* 4. BROADCAST MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0B2E2E]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white border border-[#E7E3D8] rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#E7E3D8] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#047857] tracking-wider uppercase">
                  EXECUTIVE BROADCAST
                </span>
                <h3 className="text-xl font-bold text-[#0B2E2E] font-display">
                  {editingItem ? 'Edit Announcement' : 'Draft New Announcement'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-[#656966] hover:text-[#222525] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#222525] mb-1">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Q4 Company All-Hands & Technical Showcase"
                  className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                  >
                    <option value="GENERAL">General</option>
                    <option value="HR">HR</option>
                    <option value="EVENTS">Events</option>
                    <option value="TRAINING">Training</option>
                    <option value="PROJECTS">Projects</option>
                    <option value="POLICY">Policy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#222525] mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High (Urgent)</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#222525] mb-1">Message Body *</label>
                <textarea
                  rows={5}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Full text of the announcement..."
                  className="w-full px-3 py-2 text-xs bg-[#F8F6F1] border border-[#E7E3D8] rounded-xl text-[#222525] focus:outline-hidden focus:border-[#047857]"
                  required
                />
              </div>

              <div className="pt-4 border-t border-[#E7E3D8] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#F8F6F1] border border-[#E7E3D8] text-[#222525] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#047857] text-white hover:bg-[#065F46] disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
                >
                  {submitting ? 'Publishing...' : 'Publish to Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
