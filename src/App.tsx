import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Search from '@/pages/Search';
import LeadDetail from '@/pages/LeadDetail';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/lead/:id" element={<LeadDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
