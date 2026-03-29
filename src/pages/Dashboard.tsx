import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Sale, Expense, Ingredient } from '../types';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertTriangle, ArrowRight, Utensils, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthSales, setMonthSales] = useState<Sale[]>([]);
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [weeklySales, setWeeklySales] = useState<{ date: string, amount: number }[]>([]);
  const [chartMode, setChartMode] = useState<'7days' | 'overall'>('7days');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!auth.currentUser) return;

    const salesQuery = query(
      collection(db, 'sales'),
      where('authorUid', '==', auth.currentUser?.uid),
      where('date', '==', today)
    );

    const expensesQuery = query(
      collection(db, 'expenses'),
      where('authorUid', '==', auth.currentUser?.uid),
      where('date', '==', today)
    );

    // Fetch current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const monthSalesQuery = query(
      collection(db, 'sales'),
      where('authorUid', '==', auth.currentUser?.uid),
      where('date', '>=', firstDayOfMonth),
      where('date', '<=', lastDayOfMonth)
    );

    const monthExpensesQuery = query(
      collection(db, 'expenses'),
      where('authorUid', '==', auth.currentUser?.uid),
      where('date', '>=', firstDayOfMonth),
      where('date', '<=', lastDayOfMonth)
    );

    const ingredientsQuery = query(
      collection(db, 'ingredients'),
      where('authorUid', '==', auth.currentUser?.uid)
    );

    // Fetch last 7 days for chart
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const trendQuery = chartMode === '7days'
      ? query(
          collection(db, 'sales'),
          where('authorUid', '==', auth.currentUser?.uid),
          where('date', 'in', last7Days)
        )
      : query(
          collection(db, 'sales'),
          where('authorUid', '==', auth.currentUser?.uid),
          orderBy('date', 'asc')
        );

    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      setSales(snapshot.docs.map(doc => doc.data() as Sale));
    });

    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => doc.data() as Expense));
    });

    const unsubMonthSales = onSnapshot(monthSalesQuery, (snapshot) => {
      setMonthSales(snapshot.docs.map(doc => doc.data() as Sale));
    });

    const unsubMonthExpenses = onSnapshot(monthExpensesQuery, (snapshot) => {
      setMonthExpenses(snapshot.docs.map(doc => doc.data() as Expense));
    });

    const unsubIngredients = onSnapshot(ingredientsQuery, (snapshot) => {
      setIngredients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ingredient)));
    });

    const unsubTrend = onSnapshot(trendQuery, (snapshot) => {
      const dailyTotals: Record<string, number> = {};
      
      if (chartMode === '7days') {
        last7Days.forEach(d => dailyTotals[d] = 0);
      }
      
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Sale;
        dailyTotals[data.date] = (dailyTotals[data.date] || 0) + data.amount;
      });

      const sortedDates = Object.keys(dailyTotals).sort();

      setWeeklySales(sortedDates.map(d => ({
        date: new Date(d).toLocaleDateString('en-US', { 
          day: 'numeric', 
          month: 'short',
          year: chartMode === 'overall' ? '2-digit' : undefined
        }),
        amount: dailyTotals[d]
      })));
    });

    return () => {
      unsubSales();
      unsubExpenses();
      unsubMonthSales();
      unsubMonthExpenses();
      unsubIngredients();
      unsubTrend();
    };
  }, [chartMode]);

  const totalSales = sales.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netIncome = totalSales - totalExpenses;

  const totalMonthSales = monthSales.reduce((acc, curr) => acc + curr.amount, 0);
  const totalMonthExpenses = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const monthNetIncome = totalMonthSales - totalMonthExpenses;

  // Calculate session sales for the current month
  const sessionSales = monthSales.reduce((acc, curr) => {
    acc[curr.session] = (acc[curr.session] || 0) + curr.amount;
    return acc;
  }, { Morning: 0, Evening: 0 } as Record<string, number>);

  const sortedSessions = (Object.entries(sessionSales) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalMonthSales > 0 ? (amount / totalMonthSales) * 100 : 0
    }));

  // Mock top selling items (in a real app, you'd aggregate this from sales)
  const topSelling = [
    { name: 'โรตีใส่ไข่', sales: 45, growth: '+12%' },
    { name: 'โจ๊กไก่', sales: 38, growth: '+5%' },
    { name: 'โรตีธรรมดา', sales: 32, growth: '-2%' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-1">
        <p className="text-on-surface-variant font-medium text-sm">ยินดีต้อนรับกลับมา,</p>
        <h1 className="text-2xl font-black tracking-tight text-on-surface">ภาพรวม</h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-primary-container p-6 rounded-3xl flex flex-col justify-between h-48 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <TrendingUp className="w-5 h-5 text-primary opacity-50" />
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-0.5">ยอดขายรวมวันนี้</p>
              <h3 className="text-lg font-black text-on-primary-container">฿{totalSales.toLocaleString()}</h3>
            </div>
            <div className="pt-2 border-t border-primary/10">
              <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-0.5">เดือนนี้</p>
              <h3 className="text-sm font-black text-on-primary-container">฿{totalMonthSales.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-secondary-container p-6 rounded-3xl flex flex-col justify-between h-48 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-secondary" />
            </div>
            <TrendingDown className="w-5 h-5 text-secondary opacity-50" />
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-bold text-secondary/70 uppercase tracking-widest mb-0.5">ค่าใช้จ่ายวันนี้</p>
              <h3 className="text-lg font-black text-on-secondary-container">฿{totalExpenses.toLocaleString()}</h3>
            </div>
            <div className="pt-2 border-t border-secondary/10">
              <p className="text-[10px] font-bold text-secondary/70 uppercase tracking-widest mb-0.5">เดือนนี้</p>
              <h3 className="text-sm font-black text-on-secondary-container">฿{totalMonthExpenses.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-tertiary-container p-6 rounded-3xl flex flex-col justify-between h-48 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl bg-tertiary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-tertiary" />
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-bold text-tertiary/70 uppercase tracking-widest mb-0.5">รายได้สุทธิวันนี้</p>
              <h3 className="text-lg font-black text-on-tertiary-container">฿{netIncome.toLocaleString()}</h3>
            </div>
            <div className="pt-2 border-t border-tertiary/10">
              <p className="text-[10px] font-bold text-tertiary/70 uppercase tracking-widest mb-0.5">เดือนนี้</p>
              <h3 className="text-sm font-black text-on-tertiary-container">฿{monthNetIncome.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            แนวโน้มยอดขาย
          </h3>
          <div className="flex items-center gap-2 bg-surface-container-high p-1 rounded-xl">
            <button 
              onClick={() => setChartMode('7days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === '7days' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              7 วันล่าสุด
            </button>
            <button 
              onClick={() => setChartMode('overall')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === 'overall' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              ทั้งหมด
            </button>
          </div>
        </div>
        <div className="w-full">
          <ResponsiveContainer width="100%" aspect={2.5}>
            <AreaChart data={weeklySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary, #6750A4)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-primary, #6750A4)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#6b7280' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#6b7280' }}
                tickFormatter={(value) => `฿${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                itemStyle={{ fontWeight: 800, color: '#6750A4' }}
                labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#374151' }}
                formatter={(value: number) => [`฿${value.toLocaleString()}`, 'Sales']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="var(--color-primary, #6750A4)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              ช่วงเวลาที่ขายดีที่สุด
            </h3>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">เดือนนี้</span>
          </div>
          <div className="space-y-6">
            {sortedSessions.map((session, i) => (
              <div key={session.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      session.name === 'Morning' ? 'bg-[#FCEBAC] text-[#8B6E00]' : 'bg-[#FAAA48] text-white'
                    }`}>
                      {session.name === 'Morning' ? '☀️' : '🌙'}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">
                        {session.name === 'Morning' ? 'Morning (05:30-09:00)' : 'Evening (16:00-21:00)'}
                      </p>
                      <p className="text-xs text-on-surface-variant">฿{session.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-primary">{session.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${
                      session.name === 'Morning' ? 'bg-[#FCEBAC]' : 'bg-[#FAAA48]'
                    }`}
                    style={{ width: `${session.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary" />
              สินค้าขายดี
            </h3>
            <button className="text-xs font-bold text-primary hover:underline">ดูทั้งหมด</button>
          </div>
          <div className="space-y-4">
            {topSelling.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center font-black text-primary">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{item.name}</p>
                    <p className="text-xs text-on-surface-variant">{item.sales} orders today</p>
                  </div>
                </div>
                <span className={`text-xs font-black px-2 py-1 rounded-lg ${item.growth.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.growth}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-high shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-error" />
              Inventory Alert
            </h3>
            <Link to="/ingredients" className="text-xs font-bold text-primary hover:underline">Manage</Link>
          </div>
          <div className="space-y-4">
            {ingredients.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-8">No ingredients found.</p>
            ) : (
              ingredients.slice(0, 3).map((ing) => (
                <div key={ing.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-error" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{ing.name}</p>
                      <p className="text-xs text-on-surface-variant">Price: ฿{ing.price}/{ing.unit}</p>
                    </div>
                  </div>
                  <Link to="/expenses" className="p-2 bg-surface-container-highest rounded-xl hover:bg-primary hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-6 py-4 bg-surface-container-highest rounded-2xl font-bold text-sm text-on-surface-variant hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
            <Package className="w-4 h-4" />
            Order Supplies
          </button>
        </section>
      </div>
    </div>
  );
}
