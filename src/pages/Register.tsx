import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.ts';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    // 1. Criar usuário na Auth do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (authError) {
      setErro(authError.message);
      setCarregando(false);
      return;
    }

    // 2. Se o usuário foi criado, salvar o perfil na tabela perfil_usuario
    if (authData?.user) {
      const { error: profileError } = await supabase
        .from('perfil_usuario')
        .insert([{ id: authData.user.id, nome_completo: nome }]);

      if (profileError) {
        console.error('Erro ao salvar perfil:', profileError.message);
      }
      
      setSucesso(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f0' }}>
      <div className="auth-card" style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color: '#708238', textAlign: 'center', marginBottom: '1.5rem', fontFamily: 'sans-serif' }}>Criar Nova Conta</h2>
        
        {erro && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>{erro}</div>}
        {sucesso && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>Conta criada com sucesso! Redirecionando...</div>}
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ color: '#4b5825', fontWeight: 'bold', fontSize: '0.9rem' }}>Nome Completo</label>
            <input 
              type="text" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              required 
              style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #c2cdbc', outline: 'none' }}
            />
          </div>

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
            disabled={carregando || sucesso}
            style={{ backgroundColor: '#708238', color: '#ffffff', padding: '0.75rem', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            {carregando ? 'Criando conta...' : 'Registrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
          Já tem uma conta? <Link to="/login" style={{ color: '#708238', fontWeight: 'bold', textDecoration: 'none' }}>Faça Login</Link>
        </p>
      </div>
    </div>
  );
}