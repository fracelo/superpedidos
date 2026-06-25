import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.ts';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro('E-mail ou senha incorretos. Verifique os dados e tente novamente.');
      setCarregando(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f0' }}>
      <div className="auth-card" style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color: '#708238', textAlign: 'center', marginBottom: '1.5rem', fontFamily: 'sans-serif' }}>Entrar no OrniGen</h2>
        
        {erro && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{erro}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ color: '#4b5825', fontWeight: 'bold', fontSize: '0.9rem' }}>E-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #c2cdbc', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ color: '#4b5825', fontWeight: 'bold', fontSize: '0.9rem' }}>Senha</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={mostrarSenha ? 'text' : 'password'} 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)} 
                required 
                style={{ padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '6px', border: '1px solid #c2cdbc', outline: 'none', width: '100%' }}
              />
              <button 
                type="button" 
                onClick={() => setMostrarSenha(!mostrarSenha)} 
                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#708238', display: 'flex', alignItems: 'center' }}
              >
                {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={carregando}
            style={{ backgroundColor: '#708238', color: '#ffffff', padding: '0.75rem', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a692d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#708238'}
          >
            {carregando ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
          Não tem uma conta? <Link to="/cadastro" style={{ color: '#708238', fontWeight: 'bold', textDecoration: 'none' }}>Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}