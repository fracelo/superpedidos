import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.ts';
// Corrigido aqui: comentário removido para evitar qualquer erro de sintaxe
import { Menu, X, Home, ShoppingBag, ClipboardList, Receipt, User, LogOut, Store } from 'lucide-react';

interface PainelLayoutProps {
  children: React.ReactNode;
  tituloPagina: string;
  telaAtual: string;
  setTelaAtual: (tela: string) => void;
  session: any;
}

export default function PainelLayout({ children, tituloPagina, telaAtual, setTelaAtual, session }: PainelLayoutProps) {
  const [nomeUsuario, setNomeUsuario] = useState('Usuário');
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    async function obterPerfil() {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('perfil_usuario')
          .select('nome_completo')
          .eq('id', session.user.id)
          .single();
        
        if (!error && data?.nome_completo) {
          setNomeUsuario(data.nome_completo);
        }
      }
    }
    obterPerfil();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const itensMenu = [
    { id: 'home', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'produtos', label: 'Produtos', icon: <ShoppingBag size={20} /> },
    { id: 'marketplaces', label: 'Marketplaces', icon: <Store size={20} /> },
    { id: 'pedidos', label: 'Pedidos', icon: <ClipboardList size={20} /> },
    { id: 'baixa', label: 'Baixas / Faturamento', icon: <Receipt size={20} /> },
    { id: 'perfil', label: 'Meus Dados', icon: <User size={20} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f6f0', fontFamily: 'sans-serif' }}>
      
      {/* BARRA SUPERIOR (HEADER) */}
      <header style={{ 
        height: '60px', 
        backgroundColor: '#708238', 
        color: '#ffffff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 1.5rem', 
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setMenuAberto(!menuAberto)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#ffffff', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              padding: '0.5rem',
              borderRadius: '4px'
            }}
          >
            {menuAberto ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Super Pedidos Marktplaces</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Olá, <strong>{nomeUsuario}</strong></span>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* CORPO DO LAYOUT */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        
        {/* SIDEBAR RETRÁTIL */}
        <aside style={{ 
          width: menuAberto ? '260px' : '0px', 
          backgroundColor: '#ffffff', 
          borderRight: menuAberto ? '1px solid #e2e8f0' : 'none',
          transition: 'all 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 999,
          boxShadow: menuAberto ? '4px 0 10px rgba(0,0,0,0.05)' : 'none'
        }}>
          <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {itensMenu.map((item) => {
              const ativo = telaAtual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTelaAtual(item.id);
                    setMenuAberto(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: ativo ? '#f0f4e8' : 'transparent',
                    color: ativo ? '#708238' : '#4a5568',
                    fontWeight: ativo ? 'bold' : 'normal',
                    textAlign: 'left',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ÁREA DA PÁGINA */}
        <main style={{ 
          flex: 1, 
          padding: '2rem', 
          overflowY: 'auto',
          marginLeft: menuAberto ? '260px' : '0px',
          transition: 'margin-left 0.3s ease-in-out',
          width: '100%'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#4b5825', margin: 0, fontSize: '1.5rem' }}>
              {tituloPagina}
            </h2>
          </div>

          {children}
        </main>

      </div>
    </div>
  );
}