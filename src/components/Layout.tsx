import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

import { Menu, LayoutDashboard, ReceiptText, ShoppingBag, BarChart3, Wallet } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const user = auth.currentUser;

  const navItems = [
    { name: 'ขาย', path: '/sales', icon: Wallet },
    { name: 'ค่าใช้จ่าย', path: '/expenses', icon: ReceiptText },
    { name: 'วัตถุดิบ', path: '/ingredients', icon: ShoppingBag },
    { name: 'สรุป', path: '/summary', icon: BarChart3 },
    { name: 'แดชบอร์ด', path: '/', icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md flex justify-between items-center px-6 h-16 border-b border-surface-container-high">
        <div className="flex items-center gap-3">
          <img 
            src="https://ais-pre-alogrj2orhp5nccbh4ced2-651182989465.asia-east1.run.app/api/attachments/86663249-1418-450f-90e6-5435956972e0" 
            alt="Hua Rung Logo" 
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <h1 className="font-headline font-bold text-lg tracking-tight text-primary">ระบบจัดการร้าน</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-primary/20">
          {user?.photoURL ? (
            <img className="w-full h-full object-cover" src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-on-primary text-xs font-bold">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </header>

      <main className="pt-20 px-5 max-w-2xl mx-auto">
        {children}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 right-0 mx-4 mb-6 rounded-full h-20 z-50 bg-background flex justify-around items-center px-4 shadow-lg border border-surface-container-high">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-300 ease-out",
                isActive 
                  ? "bg-primary-container text-white rounded-full w-14 h-14 scale-110 shadow-lg" 
                  : "text-on-surface-variant w-12 h-12 active:scale-90"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
              <span className="font-headline text-[10px] font-semibold mt-1">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
