import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Search, Edit2, Wallet, X, Save } from 'lucide-react';
import { formataDados } from '../components/formataDados';

interface ContaCorrente {
  id?: number;
  descricao: string;
  saldo_inicial: number;
  saldo_atual: number;
  is_active: boolean;
}

export default function ContasCorrentes() {
  const [contas, setContas] = useState<ContaCorrente[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  
  const [formData, setFormData] = useState<ContaCorrente>({
    descricao: '',
    saldo_inicial: 0,
    saldo_atual: 0,
    is_active: true
  });

  useEffect(() => {
    document.title = 'Super Pedidos - Contas Correntes';
    carregarContas();
  }, []);

  async function carregarContas() {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('conta_corrente')
        .select('*')
        .order('descricao', { ascending: true });
        
      if (!error && data) setContas(data);
    } catch (err) {
      console.error('Erro ao buscar contas:', err);
    } finally {
      setCarregando(false);
    }
  }

  const handleInputChange = (field: keyof ContaCorrente, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { 
        descricao: formData.descricao,
        saldo_inicial: formData.saldo_inicial,
        saldo_atual: formData.id ? formData.saldo_atual : formData.saldo_inicial, // Se for novo, inicializa atual com o inicial
        is_active: formData.is_active
      };

      if (formData.id) {
        const { error } = await supabase
          .from('conta_corrente')
          .update(payload)
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('conta_corrente')
          .insert([payload]);
        if (error) throw error;
      }
      
      setModalAberto(false);
      carregarContas();
    } catch (err) {
      console.error('Erro ao salvar conta:', err);
      alert('Não foi possível salvar a conta.');
    }
  }

  function abrirEditar(conta: ContaCorrente) {
    setFormData(conta);
    setModalAberto(true);
  }

  function abrirNovo() {
    setFormData({ descricao: '', saldo_inicial: 0, saldo_atual: 0, is_active: true });
    setModalAberto(true);
  }

  const contasFiltradas = contas.filter(c => c.descricao.toLowerCase().includes(busca.toLowerCase()));
  const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' as const, outline: 'none' };
  const labelStyle = { display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.3rem', color: '#4a5568' };

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <input 
            type="text" placeholder="Buscar conta corrente..." value={busca} onChange={(e) => setBusca(e.target.value)} 
            style={{ width: '100%', padding: '0.6rem 2.2rem', borderRadius: '6px', border: '1px solid #c2cdbc', outline: 'none' }} 
          />
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '11px', color: '#a0aec0' }} />
        </div>
        
        <button onClick={abrirNovo} style={{ backgroundColor: '#708238', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <Plus size={18} /> Nova Conta
        </button>
      </div>

      {carregando ? <p>Carregando registros...</p> : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f6f0', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.8rem', color: '#4b5825' }}>Descrição da Conta</th>
                <th style={{ padding: '0.8rem', color: '#4b5825', textAlign: 'right' }}>Saldo Inicial</th>
                <th style={{ padding: '0.8rem', color: '#4b5825', textAlign: 'right' }}>Saldo Atual</th>
                <th style={{ padding: '0.8rem', color: '#4b5825', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.8rem', color: '#4b5825', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contasFiltradas.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '0.8rem', fontWeight: 'bold', color: '#2d3748' }}>{c.descricao}</td>
                  <td style={{ padding: '0.8rem', textAlign: 'right', color: '#718096' }}>{formatarMoeda(c.saldo_inicial)}</td>
                  <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 'bold', color: '#2b6cb0' }}>{formatarMoeda(c.saldo_atual)}</td>
                  <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                    <span style={{ color: c.is_active ? '#38a169' : '#a0aec0', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      {c.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '0.8rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button type="button" onClick={() => abrirEditar(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568' }}><Edit2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#ffffff', width: '90%', maxWidth: '450px', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            
            <div style={{ backgroundColor: '#f4f6f0', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: '#4b5825', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={20} /> {formData.id ? 'Editar Conta' : 'Nova Conta'}
              </h3>
              <button onClick={() => setModalAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSalvar} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div>
                <label style={labelStyle}>Nome da Conta *</label>
                <input type="text" value={formData.descricao} onChange={e => handleInputChange('descricao', e.target.value)} required placeholder="Ex: Banco do Brasil, Caixa..." style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Saldo Inicial (R$)</label>
                <input 
                  type="text" 
                  value={formataDados(formData.saldo_inicial, 'moeda')} 
                  onChange={e => handleInputChange('saldo_inicial', Number(e.target.value.replace(/\D/g, ''))/100)} 
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={formData.is_active} onChange={e => handleInputChange('is_active', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label style={{ fontWeight: 'bold', color: '#4a5568' }}>Conta Ativa</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setModalAberto(false)} style={{ padding: '0.6rem 1.5rem', border: '1px solid #cbd5e0', backgroundColor: '#fff', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', color: '#4a5568' }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#708238', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '4px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <Save size={18} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}