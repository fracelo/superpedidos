import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient.ts";

// Importação dos Componentes de Página
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Produtos from "./pages/Produtos.tsx";
import Pedidos from "./pages/Pedidos.tsx";
import Marketplaces from "./pages/Marketplaces"; 
import CategoriasFinanceiras from "./pages/CategoriasFinanceiras"; // Nova tela
import ContasCorrentes from "./pages/ContasCorrentes";         // Nova tela
import PainelLayout from "./components/PainelLayout.tsx"; 

// Placeholders mantidos
function Dashboard() {
  return <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', fontFamily: 'sans-serif' }}>Conteúdo do Dashboard Geral e Métricas.</div>;
}
function Baixas() {
  return <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', fontFamily: 'sans-serif' }}>Controle de Baixas e Faturamento.</div>;
}
function Perfil() {
  return <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', fontFamily: 'sans-serif' }}>Configurações de Perfil e Meus Dados.</div>;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [telaAtual, setTelaAtual] = useState('home');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCarregando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (carregando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f0', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#708238', fontWeight: 'bold' }}>Carregando sistema...</p>
      </div>
    );
  }

  // Define o título exibido no cabeçalho conforme a tela ativa
  const obterTituloPagina = () => {
    switch (telaAtual) {
      case 'home': return 'Dashboard Central';
      case 'produtos': return 'Gerenciamento de Produtos';
      case 'marketplaces': return 'Canais de Venda & Marketplaces';
      case 'pedidos': return 'Painel de Pedidos';
      case 'categorias': return 'Categorias Financeiras';
      case 'contas': return 'Contas Correntes';
      case 'baixa': return 'Baixas / Faturamento';
      case 'perfil': return 'Meus Dados';
      default: return 'Super Pedidos';
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/cadastro" element={!session ? <Register /> : <Navigate to="/" />} />

        <Route
          path="/"
          element={
            session ? (
              <PainelLayout
                tituloPagina={obterTituloPagina()}
                telaAtual={telaAtual}
                setTelaAtual={setTelaAtual}
                session={session}
              >
                {telaAtual === 'home' && <Dashboard />}
                {telaAtual === 'produtos' && <Produtos />}
                {telaAtual === 'marketplaces' && <Marketplaces />}
                {telaAtual === 'pedidos' && <Pedidos />}
                {telaAtual === 'categorias' && <CategoriasFinanceiras />}
                {telaAtual === 'contas' && <ContasCorrentes />}
                {telaAtual === 'baixa' && <Baixas />}
                {telaAtual === 'perfil' && <Perfil />}
              </PainelLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}