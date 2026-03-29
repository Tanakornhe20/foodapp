import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Sale, Expense } from '../types';

import { ChevronLeft, ChevronRight, Wallet, Receipt, TrendingUp, PieChart, Utensils } from 'lucide-react';

export default function Summary() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyData, setWeeklyData] = useState<{ day: string, amount: number }[]>([]);
  const [snapshotMode, setSnapshotMode] = useState<'7days' | 'overall'>('7days');

  useEffect(() => {
    const salesQuery = query(
      collection(db, 'sales'),
      where('authorUid', '==', auth.currentUser?.uid),
      where('date', '==', selectedDate)
    );

    const expensesQuery = query(
      collection(db, 'expenses'),
      where('authorUid', '==', auth.currentUser?.uid),
      where('date', '==', selectedDate)
    );

    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      setSales(snapshot.docs.map(doc => doc.data() as Sale));
    });

    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => doc.data() as Expense));
    });

    // Fetch last 7 days for snapshot
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const weeklySalesQuery = snapshotMode === '7days'
      ? query(
          collection(db, 'sales'),
          where('authorUid', '==', auth.currentUser?.uid),
          where('date', 'in', last7Days)
        )
      : query(
          collection(db, 'sales'),
          where('authorUid', '==', auth.currentUser?.uid)
        );

    const unsubWeekly = onSnapshot(weeklySalesQuery, (snapshot) => {
      const dailyTotals: Record<string, number> = {};
      
      if (snapshotMode === '7days') {
        last7Days.forEach(d => dailyTotals[d] = 0);
      }
      
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Sale;
        dailyTotals[data.date] = (dailyTotals[data.date] || 0) + data.amount;
      });

      const sortedDates = Object.keys(dailyTotals).sort();

      setWeeklyData(sortedDates.map(d => ({
        day: new Date(d).toLocaleDateString('th-TH', { 
          day: 'numeric', 
          month: 'short',
          year: snapshotMode === 'overall' ? '2-digit' : undefined
        }).toUpperCase(),
        amount: dailyTotals[d]
      })));
    });

    return () => {
      unsubSales();
      unsubExpenses();
      unsubWeekly();
    };
  }, [selectedDate, snapshotMode]);

  const totalSales = sales.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netIncome = totalSales - totalExpenses;

  const investment = netIncome * 0.3;
  const reinvestment = netIncome * 0.4;
  const salary = netIncome * 0.3;

  const maxWeekly = Math.max(...weeklyData.map(d => d.amount), 1);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-on-surface-variant font-medium text-sm">รายงานสรุปประจำวัน</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-primary">สรุปประจำวัน</h2>
          </div>
          <div className="flex bg-surface-container-low rounded-xl p-1 shadow-sm">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-surface-container transition-colors rounded-lg">
              <ChevronLeft className="w-5 h-5 text-primary" />
            </button>
            <div className="px-4 flex items-center font-bold text-sm text-on-surface">
              {new Date(selectedDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-surface-container transition-colors rounded-lg">
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-secondary/10 p-6 rounded-lg relative overflow-hidden flex flex-col justify-between h-44 group transition-transform active:scale-[0.98]">
          <div className="z-10">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-secondary fill-current" />
              <span className="text-secondary font-bold text-sm tracking-wide">ยอดขายรวม</span>
            </div>
            <div className="text-2xl font-black text-secondary-dim">฿{totalSales.toLocaleString()}</div>
          </div>
          <div className="z-10 flex items-center gap-1 text-secondary font-semibold text-xs bg-white/40 self-start px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" /> การติดตามผลการดำเนินงาน
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Utensils className="w-48 h-48" />
          </div>
        </div>

        <div className="bg-error/10 p-5 rounded-lg flex flex-col justify-between h-40 active:scale-[0.97] transition-transform">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-5 h-5 text-error fill-current" />
              <span className="text-error font-bold text-xs">ค่าใช้จ่าย</span>
            </div>
            <div className="text-2xl font-black text-error-dim">฿{totalExpenses.toLocaleString()}</div>
          </div>
          <div className="text-error-dim/60 text-[10px] font-medium uppercase tracking-widest">คงที่และผันแปร</div>
        </div>

        <div className="bg-tertiary-container p-5 rounded-lg flex flex-col justify-between h-40 active:scale-[0.97] transition-transform">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-tertiary fill-current" />
              <span className="text-tertiary font-bold text-xs">กำไรสุทธิ</span>
            </div>
            <div className="text-2xl font-black text-on-tertiary-container">฿{netIncome.toLocaleString()}</div>
          </div>
          <div className="text-tertiary/70 text-[10px] font-medium uppercase tracking-widest">พร้อมสำหรับการจัดสรร</div>
        </div>
      </section>

      <section className="bg-surface-container-lowest p-8 rounded-lg shadow-sm">
        <h3 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-primary-fixed-dim" />
          การจัดสรรกำไร
        </h3>
        <div className="h-6 w-full flex rounded-full overflow-hidden mb-8 shadow-inner">
          <div className="h-full bg-primary-fixed-dim transition-all hover:brightness-110" style={{ width: '30%' }}></div>
          <div className="h-full bg-primary-container transition-all hover:brightness-110" style={{ width: '40%' }}></div>
          <div className="h-full bg-surface-variant transition-all hover:brightness-110" style={{ width: '30%' }}></div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary-fixed-dim"></div>
              <span className="font-medium text-on-surface">30% เงินลงทุนในอนาคต</span>
            </div>
            <span className="font-bold text-primary">฿{Math.max(0, investment).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary-container"></div>
              <span className="font-medium text-on-surface">40% เงินหมุนเวียน</span>
            </div>
            <span className="font-bold text-primary">฿{Math.max(0, reinvestment).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
              <span className="font-medium text-on-surface">30% เงินเดือนพนักงาน</span>
            </div>
            <span className="font-bold text-primary">฿{Math.max(0, salary).toLocaleString()}</span>
          </div>
        </div>
      </section>

      <section className="pb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
            {snapshotMode === '7days' ? 'ภาพรวม 7 วัน' : 'ภาพรวมทั้งหมด'}
          </h3>
          <div className="flex bg-surface-container-low rounded-lg p-1 shadow-sm">
            <button 
              onClick={() => setSnapshotMode('7days')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${snapshotMode === '7days' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              7 วัน
            </button>
            <button 
              onClick={() => setSnapshotMode('overall')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${snapshotMode === 'overall' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              ทั้งหมด
            </button>
          </div>
        </div>
        <div className="flex items-end justify-between h-24 gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {weeklyData.map((d, i) => (
            <div 
              key={i} 
              className={`min-w-[20px] flex-1 rounded-t-lg transition-colors ${i === weeklyData.length - 1 ? 'bg-primary' : 'bg-surface-container hover:bg-primary-container'}`}
              style={{ height: `${(d.amount / maxWeekly) * 100}%` }}
            ></div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[8px] text-on-surface-variant font-bold overflow-x-auto scrollbar-hide">
          {weeklyData.map((d, i) => (
            <span key={i} className={`min-w-[20px] text-center ${i === weeklyData.length - 1 ? 'text-primary' : ''}`}>{d.day}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
