import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Expense, Ingredient } from '../types';

import { Calendar, ChevronDown, Utensils, Soup, Package, Save, Egg, Zap, Receipt, Edit2, Trash2, X } from 'lucide-react';

export default function ExpenseRecord() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [segment, setSegment] = useState<'Roti' | 'Congee' | 'General'>('Roti');
  const [category, setCategory] = useState('แป้ง');
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const categoriesBySegment = {
    Roti: ['แป้ง', 'เนย', 'เกลือ', 'น้ำตาล', 'ไข่'],
    Congee: ['ข้าวสาร', 'ข้าวเหนียว', 'ผักชี', 'ขิง', 'อกไก่', 'ซอสถั่วเหลือง', 'ถุงร้อน', 'ยาง', 'พริกไท', 'ถ่าน'],
    General: ['ค่าแรง', 'น้ำมันพืช', 'แก๊ส']
  };

  useEffect(() => {
    setCategory(categoriesBySegment[segment][0]);
    setItem('');
  }, [segment]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = showAll 
      ? query(
          collection(db, 'expenses'),
          where('authorUid', '==', auth.currentUser?.uid),
          orderBy('createdAt', 'desc')
        )
      : query(
          collection(db, 'expenses'),
          where('authorUid', '==', auth.currentUser?.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );

    const unsubExpenses = onSnapshot(q, (snapshot) => {
      setRecentExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    const ingredientsQuery = query(
      collection(db, 'ingredients'),
      where('authorUid', '==', auth.currentUser?.uid)
    );

    const unsubIngredients = onSnapshot(ingredientsQuery, (snapshot) => {
      setIngredients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ingredient)));
    });

    return () => {
      unsubExpenses();
      unsubIngredients();
    };
  }, [showAll]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setItem('');
  };

  const handleItemChange = (newItem: string) => {
    setItem(newItem);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        date,
        segment,
        category,
        item,
        amount: Number(amount),
        authorUid: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
      });
      setAmount('');
      setItem('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    setLoading(true);
    try {
      const { id, ...data } = editingExpense;
      await updateDoc(doc(db, 'expenses', id), {
        ...data,
        amount: Number(data.amount)
      });
      setEditingExpense(null);
    } catch (error) {
      console.error('Error updating expense:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <section className="mb-10">
        <h2 className="editorial-header text-2xl font-extrabold tracking-tighter text-on-surface mb-2 leading-none">
          บันทึกค่าใช้จ่าย
        </h2>
        <p className="text-on-surface-variant font-medium opacity-80">ติดตามค่าใช้จ่ายประจำวันเพื่อให้ร้านดำเนินไปได้อย่างราบรื่น</p>
      </section>

      <div className="bg-surface-container-low rounded-lg p-6 mb-8 shadow-sm">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">วันที่</label>
            <div className="relative">
              <input 
                className="w-full bg-surface-container-highest border-none rounded-xl h-14 px-4 font-medium focus:ring-2 focus:ring-primary text-on-surface" 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none w-5 h-5" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">กลุ่มสินค้า</label>
            <div className="flex gap-2">
              {(['Roti', 'Congee', 'General'] as const).map((seg) => (
                <button 
                  key={seg}
                  type="button"
                  onClick={() => setSegment(seg)}
                  className={`flex-1 h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    segment === seg ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {seg === 'Roti' ? <Utensils className="w-5 h-5" /> : seg === 'Congee' ? <Soup className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  {seg === 'Roti' ? 'โรตี' : seg === 'Congee' ? 'โจ๊กไก่' : 'ทั่วไป'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-lg border border-surface-container-high space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">ประเภทค่าใช้จ่าย</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-surface-container-low border-none rounded-xl h-14 px-4 font-medium focus:ring-2 focus:ring-primary text-on-surface"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  {categoriesBySegment[segment].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2 border-t border-surface-container-high">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                  รายละเอียดสินค้า (ไม่บังคับ)
                </label>
                <div className="relative">
                  <input 
                    className="w-full bg-surface-container-low border-none rounded-xl h-14 px-4 font-medium focus:ring-2 focus:ring-primary text-on-surface" 
                    placeholder="ระบุรายละเอียด (เช่น ยี่ห้อ)" 
                    type="text"
                    value={item}
                    onChange={(e) => handleItemChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">ยอดรวม (฿)</label>
            <div className="relative group">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-primary opacity-40 group-focus-within:opacity-100 transition-opacity">฿</span>
              <input 
                className="w-full bg-surface-container-highest border-none rounded-xl h-20 pl-14 pr-6 text-xl font-black text-on-surface focus:ring-4 focus:ring-primary-container/20" 
                placeholder="0.00" 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dim text-on-primary h-16 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Save className="w-6 h-6" />
            {loading ? 'กำลังบันทึก...' : 'บันทึกค่าใช้จ่าย'}
          </button>
          
          {saveSuccess && (
            <div className="bg-green-100 text-green-800 p-4 rounded-xl text-center font-bold animate-in fade-in slide-in-from-top-4">
              ✅ บันทึกค่าใช้จ่ายเรียบร้อยแล้ว!
            </div>
          )}
        </form>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-2">
            <span className="w-1 h-4 bg-secondary rounded-full"></span> รายการล่าสุด
          </h3>
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-bold text-primary hover:underline"
          >
            {showAll ? 'ซ่อน' : 'ดูทั้งหมด'}
          </button>
        </div>
        <div className="space-y-3">
          {recentExpenses.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-sm group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center">
                  {exp.category === 'ค่าแรง' ? <Zap className="w-6 h-6 text-tertiary" /> : <Egg className="w-6 h-6 text-tertiary" />}
                </div>
                <div>
                  <p className="font-bold text-on-surface">{exp.item || exp.category}</p>
                  <p className="text-xs text-on-surface-variant font-medium">{exp.category} • {exp.segment === 'Roti' ? 'โรตี' : exp.segment === 'Congee' ? 'โจ๊กไก่' : 'ทั่วไป'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-black text-on-surface">฿{exp.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-on-surface-variant">{new Date(exp.createdAt).toLocaleString('th-TH')}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingExpense(exp)}
                    className="p-2 hover:bg-surface-container-high rounded-full text-on-surface-variant"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(exp.id)}
                    className="p-2 hover:bg-error-container hover:text-error rounded-full text-on-surface-variant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-surface-container-high flex items-center justify-between">
              <h3 className="text-xl font-black tracking-tight">แก้ไขค่าใช้จ่าย</h3>
              <button onClick={() => setEditingExpense(null)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">วันที่</label>
                  <input 
                    className="w-full bg-surface-container-highest border-none rounded-xl h-14 px-4 font-medium" 
                    type="date" 
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({...editingExpense, date: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">รายละเอียด</label>
                  <input 
                    className="w-full bg-surface-container-highest border-none rounded-xl h-14 px-4 font-medium" 
                    type="text" 
                    value={editingExpense.item}
                    onChange={(e) => setEditingExpense({...editingExpense, item: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">ยอดรวม (฿)</label>
                  <input 
                    className="w-full bg-surface-container-highest border-none rounded-xl h-14 px-4 font-medium" 
                    type="number" 
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({...editingExpense, amount: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 h-14 rounded-xl font-bold bg-surface-container-high text-on-surface"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-14 rounded-xl font-bold bg-primary text-on-primary shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-error-container text-error rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">ยืนยันการลบ?</h3>
            <p className="text-on-surface-variant mb-8">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 h-14 rounded-xl font-bold bg-surface-container-high text-on-surface"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 h-14 rounded-xl font-bold bg-error text-on-error shadow-lg shadow-error/20"
              >
                ลบรายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
