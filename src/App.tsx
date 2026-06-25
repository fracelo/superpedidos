import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient.ts";

// Importação dos Componentes de Página
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Produtos from "./pages/Produtos.tsx";
import Marketplaces from "./pages/Marketplaces"; // Nova página integrada
import PainelLayout from "./components/PainelLayout.tsx"; // Aponta para o seu arquivo corrigido

// Placeholders para as próximas telas do sistema
function Dashboard() {
  return <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', fontFamily: 'sans-serif' }}>Conteúdo do Dashboard Geral e Métricas.</div>;
}
function Pedidos() {
  return <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '8px', fontFamily: 'sans-serif' }}>Gerenciamento de Pedidos e Vendas.</div>;
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
    // Detecta a sessão ativa do usuário atual ao carregar o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCarregando(false);
    });

    // Escuta mudanças em tempo real (Login / Logout / Token Expirado)
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

  // Define o título exibido no cabeçalho do layout conforme a tela ativa
  const obterTituloPagina = () => {
    switch (telaAtual) {
      case 'home': return 'Dashboard Central';
      case 'produtos': return 'Gerenciamento de Produtos';
      case 'marketplaces': return 'Canais de Venda & Marketplaces';
      case 'pedidos': return 'Painel de Pedidos';
      case 'baixa': return 'Baixas / Faturamento';
      case 'perfil': return 'Meus Dados';
      default: return 'Super Pedidos Marktplaces';
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/cadastro" element={!session ? <Register /> : <Navigate to="/" />} />

        {/* Rotas Privadas (Protegidas por Autenticação) */}
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
                {/* Injeção dinâmica do conteúdo no {children} do Layout */}
                {telaAtual === 'home' && <Dashboard />}
                {telaAtual === 'produtos' && <Produtos />}
                {telaAtual === 'marketplaces' && <Marketplaces />}
                {telaAtual === 'pedidos' && <Pedidos />}
                {telaAtual === 'baixa' && <Baixas />}
                {telaAtual === 'perfil' && <Perfil />}
              </PainelLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Rota de segurança caso digitem um caminho inválido */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}