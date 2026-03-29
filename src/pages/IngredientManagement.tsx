import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Ingredient } from '../types';

import { Plus, Trash2, Edit2, Save, X, Package, Ruler, DollarSign } from 'lucide-react';

export default function IngredientManagement() {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('กก.');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);

  const suggestedNames = [
    'แป้ง', 'เนย', 'เกลือ', 'น้ำตาล', 'ไข่',
    'ข้าวสาร', 'ข้าวเหนียว', 'ผักชี', 'ขิง', 'อกไก่', 'ซอสถั่วเหลือง', 'ถุงร้อน', 'ยาง', 'พริกไท', 'ถ่าน',
    'น้ำมันพืช', 'แก๊ส'
  ];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'ingredients'),
      where('authorUid', '==', auth.currentUser?.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIngredients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ingredient)));
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pricePerUnit) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'ingredients'), {
        name,
        unit,
        pricePerUnit: Number(pricePerUnit),
        authorUid: auth.currentUser?.uid,
        updatedAt: new Date().toISOString(),
      });
      setName('');
      setPricePerUnit('');
    } catch (error) {
      console.error('Error adding ingredient:', error);
    } finally {
      setLoading(false);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ingredients', id));
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting ingredient:', error);
    }
  };

  const startEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setEditName(ing.name);
    setEditUnit(ing.unit);
    setEditPrice(ing.pricePerUnit.toString());
  };

  const handleUpdate = async (id: string) => {
    if (!editName || !editUnit || !editPrice) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'ingredients', id), {
        name: editName,
        unit: editUnit,
        pricePerUnit: Number(editPrice),
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error updating ingredient:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="mb-10">
        <h2 className="text-2xl font-headline font-extrabold tracking-tight text-primary leading-tight">
          จัดการวัตถุดิบ
        </h2>
        <p className="text-on-surface-variant font-medium mt-2">อัปเดตสต็อกและติดตามต้นทุนของคุณ</p>
      </header>

      <section className="bg-surface-container-low rounded-xl p-6 editorial-shadow mb-10 border border-white/40">
        <div className="flex items-center gap-2 mb-6">
          <Plus className="text-primary w-6 h-6" />
          <h3 className="font-headline font-bold text-lg">เพิ่มวัตถุดิบใหม่</h3>
        </div>
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">ชื่อวัตถุดิบ</label>
            <div className="relative">
              <input 
                className="w-full bg-surface-container-lowest border-none rounded-lg h-14 px-4 focus:ring-2 focus:ring-primary-container text-on-surface placeholder:text-outline-variant" 
                placeholder="เช่น ข้าวหอมมะลิ" 
                type="text"
                list="ingredient-names"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <datalist id="ingredient-names">
                {suggestedNames.map(n => <option key={n} value={n} />)}
              </datalist>
              <Package className="absolute right-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">หน่วย</label>
              <div className="relative">
                <select 
                  className="w-full bg-surface-container-lowest border-none rounded-lg h-14 px-4 focus:ring-2 focus:ring-primary-container text-on-surface appearance-none"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="กก.">กก.</option>
                  <option value="ลิตร">ลิตร</option>
                  <option value="ฟอง">ฟอง</option>
                  <option value="ถุง">ถุง</option>
                </select>
                <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">ราคาต่อหน่วย</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">฿</span>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-lg h-14 pl-10 pr-4 focus:ring-2 focus:ring-primary-container text-on-surface" 
                  placeholder="0.00" 
                  type="number"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                />
                <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
              </div>
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold h-14 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform duration-200 mt-4 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'กำลังเพิ่ม...' : 'เพิ่มในสต็อก'}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-headline font-bold text-xl">สต็อกปัจจุบัน</h3>
          <span className="text-xs font-bold text-secondary bg-secondary-container px-3 py-1 rounded-full">{ingredients.length} รายการ</span>
        </div>
        
        {ingredients.map((ing) => (
          <div key={ing.id} className="p-4 bg-surface-container-lowest rounded-lg editorial-shadow">
            {editingId === ing.id ? (
              <div className="space-y-3">
                <input 
                  className="w-full bg-surface-container-highest border-none rounded-lg h-10 px-3 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-surface-container-highest border-none rounded-lg h-10 px-3 text-sm"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                  >
                    <option value="กก.">กก.</option>
                    <option value="ลิตร">ลิตร</option>
                    <option value="ฟอง">ฟอง</option>
                    <option value="ถุง">ถุง</option>
                  </select>
                  <input 
                    className="flex-1 bg-surface-container-highest border-none rounded-lg h-10 px-3 text-sm"
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(ing.id)} className="flex-1 bg-primary text-white h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                    <Save className="w-4 h-4" /> บันทึก
                  </button>
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-surface-container-highest text-on-surface-variant h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                    <X className="w-4 h-4" /> ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-primary">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{ing.name}</p>
                    <p className="text-xs text-on-surface-variant font-medium">ราคา: ฿{ing.pricePerUnit.toLocaleString()} / {ing.unit}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {confirmDeleteId === ing.id ? (
                    <div className="flex items-center gap-2 bg-error/10 p-1 rounded-lg">
                      <button 
                        onClick={() => ing.id && handleDelete(ing.id)}
                        className="px-3 h-8 bg-error text-white rounded-md text-[10px] font-bold uppercase tracking-wider"
                      >
                        ยืนยัน
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 h-8 bg-surface-container-highest text-on-surface-variant rounded-md text-[10px] font-bold uppercase tracking-wider"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => startEdit(ing)} className="w-10 h-10 flex items-center justify-center text-outline-variant hover:text-primary transition-colors">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(ing.id || null)}
                        className="w-10 h-10 flex items-center justify-center text-outline-variant hover:text-error transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
