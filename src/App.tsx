/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SalesRecord from './pages/SalesRecord';
import ExpenseRecord from './pages/ExpenseRecord';
import IngredientManagement from './pages/IngredientManagement';
import Summary from './pages/Summary';
import { useEffect } from 'react';
import { db } from './firebase';
import { getDocFromServer, doc } from 'firebase/firestore';

export default function App() {
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  return (
    <BrowserRouter>
      <AuthGuard>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sales" element={<SalesRecord />} />
            <Route path="/expenses" element={<ExpenseRecord />} />
            <Route path="/ingredients" element={<IngredientManagement />} />
            <Route path="/summary" element={<Summary />} />
          </Routes>
        </Layout>
      </AuthGuard>
    </BrowserRouter>
  );
}
