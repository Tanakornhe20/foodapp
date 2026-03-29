import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Sale, OperationType } from '../types';

import { Calendar, Utensils, Soup, Wallet, Save, ChevronDown, Edit2, X, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SalesRecord() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'Roti' | 'Congee'>('Roti');
  const [session, setSession] = useState<'Morning' | 'Evening'>('Morning');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'sales'),
      where('authorUid', '==', auth.currentUser?.uid),
      orderBy('createdAt', 'desc'),
      limit(showAll ? 1000 : 3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      setRecentSales(sales);
    }, (error) => {
      console.error('Firestore Error:', error);
    });

    return () => unsubscribe();
  }, [showAll]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'sales', editingId), {
          date,
          category,
          session,
          amount: Number(amount),
          updatedAt: new Date().toISOString(),
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'sales'), {
          date,
          category,
          session,
          amount: Number(amount),
          authorUid: auth.currentUser?.uid,
          createdAt: new Date().toISOString(),
        });
      }
      setAmount('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving sale:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (sale: Sale) => {
    setEditingId(sale.id);
    setDate(sale.date);
    setCategory(sale.category);
    setSession(sale.session);
    setAmount(sale.amount.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'sales', id));
      if (editingId === id) {
        cancelEdit();
      }
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  return (
    <div className="space-y-10">
      <section className="mb-10 flex justify-between items-start">
        <div>
          <p className="text-primary font-bold tracking-widest text-xs uppercase mb-2">บันทึกรายได้รายวัน</p>
          <h2 className="font-headline text-2xl font-extrabold tracking-tighter text-on-surface leading-tight">
            {editingId ? 'แก้ไขรายการขาย' : 'บันทึกยอดขาย'}
          </h2>
        </div>
        {editingId && (
          <button 
            onClick={cancelEdit}
            className="p-2 bg-surface-container-highest rounded-full text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </section>

      <div className="bg-surface-container-low rounded-xl p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <form onSubmit={handleSave} className="space-y-8 relative z-10">
          <div className="space-y-2">
            <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">วันที่บันทึกยอดขาย</label>
            <div className="relative">
              <input 
                className="w-full bg-surface-container-highest border-none rounded-xl h-14 px-5 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium" 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none w-5 h-5" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">ประเภทสินค้า</label>
            <div className="grid grid-cols-2 gap-4">
              <label className="relative cursor-pointer group">
                <input 
                  type="radio" 
                  name="product" 
                  className="peer sr-only" 
                  checked={category === 'Roti'}
                  onChange={() => setCategory('Roti')}
                />
                <div className="bg-surface-container-highest peer-checked:bg-primary-container peer-checked:text-white rounded-xl p-5 transition-all duration-300 group-active:scale-95 border border-transparent peer-checked:shadow-lg">
                  <Utensils className="mb-2 block w-8 h-8" />
                  <p className="font-bold">โรตี</p>
                  <p className="text-[10px] opacity-70">กรอบจากการพลิกด้วยมือ</p>
                </div>
              </label>
              <label className="relative cursor-pointer group">
                <input 
                  type="radio" 
                  name="product" 
                  className="peer sr-only" 
                  checked={category === 'Congee'}
                  onChange={() => setCategory('Congee')}
                />
                <div className="bg-surface-container-highest peer-checked:bg-primary-container peer-checked:text-white rounded-xl p-5 transition-all duration-300 group-active:scale-95 border border-transparent peer-checked:shadow-lg">
                  <Soup className="mb-2 block w-8 h-8" />
                  <p className="font-bold">โจ๊กไก่</p>
                  <p className="text-[10px] opacity-70">ทุกถ้วย เสริฟ์อุ่นๆ</p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">ช่วงเวลา</label>
            <div className="relative">
              <select 
                className={`w-full border-none rounded-xl h-14 px-5 appearance-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium transition-colors ${
                  session === 'Morning' ? 'bg-[#FCEBAC]' : 'bg-[#FAAA48]'
                }`}
                value={session}
                onChange={(e) => setSession(e.target.value as any)}
              >
                <option value="Morning">Morning (05:30-09:00) ☀️</option>
                <option value="Evening">Evening (16:00-21:00) 🌙</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">ยอดขาย (฿)</label>
            <div className="relative">
              <input 
                className="w-full bg-surface-container-highest border-none rounded-xl h-20 px-5 text-xl font-bold focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/30" 
                placeholder="0.00" 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Wallet className="absolute right-6 top-1/2 -translate-y-1/2 text-primary w-8 h-8" />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || showSuccess}
            className={`w-full h-16 rounded-xl font-bold text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${
              showSuccess ? 'bg-green-500 text-white' : editingId ? 'bg-secondary text-white' : 'bg-primary-container text-white'
            }`}
          >
            {showSuccess ? <CheckCircle2 className="w-6 h-6" /> : editingId ? <Edit2 className="w-6 h-6" /> : <Save className="w-6 h-6 fill-current" />}
            {loading ? 'กำลังบันทึก...' : showSuccess ? 'บันทึกเรียบร้อย' : editingId ? 'อัปเดตรายการขาย' : 'บันทึกยอดขาย'}
          </button>
        </form>
      </div>

      <section className="mt-12 mb-8">
        <div className="flex justify-between items-end mb-6">
          <h3 className="font-headline text-2xl font-bold tracking-tight">การขายล่าสุด</h3>
          <span 
            onClick={() => setShowAll(!showAll)}
            className="text-primary font-semibold text-sm cursor-pointer hover:underline"
          >
            {showAll ? 'ซ่อน' : 'ดูทั้งหมด'}
          </span>
        </div>
        <div className="space-y-4">
          {recentSales.map((sale) => (
            <div 
              key={sale.id} 
              className={`group flex items-center justify-between p-4 rounded-lg shadow-sm transition-all ${
                editingId === sale.id ? 'bg-primary/5 border border-primary/20' : 'bg-surface-container-lowest hover:bg-surface-container-low'
              }`}
            >
              <div 
                onClick={() => startEdit(sale)}
                className="flex items-center gap-4 flex-1 cursor-pointer"
              >
                <div className={`w-12 h-12 ${sale.category === 'Roti' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'} rounded-full flex items-center justify-center`}>
                  {sale.category === 'Roti' ? <Utensils className="w-6 h-6" /> : <Soup className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold text-on-surface">
                    {sale.category === 'Roti' ? 'โรตี' : 'โจ๊กไก่'} {sale.session === 'Morning' ? '☀️' : '🌙'}
                  </p>
                  <p className="text-xs text-on-surface-variant">{new Date(sale.createdAt).toLocaleString('th-TH')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-lg text-secondary">+ ฿{sale.amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => startEdit(sale)}
                    className="p-2 text-on-surface-variant/40 hover:text-primary transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(sale.id);
                    }}
                    className="p-2 text-on-surface-variant/40 hover:text-error transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-error mb-4">
              <AlertCircle className="w-8 h-8" />
              <h4 className="font-headline text-xl font-bold">ยืนยันการลบ</h4>
            </div>
            <p className="text-on-surface-variant mb-8">
              คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลการขายนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingId(null)}
                className="flex-1 h-12 rounded-xl font-bold text-on-surface-variant bg-surface-container-highest hover:bg-surface-container-high transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={() => handleDelete(deletingId)}
                className="flex-1 h-12 rounded-xl font-bold text-white bg-error hover:opacity-90 transition-opacity"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
