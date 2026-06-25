import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit2, Store } from 'lucide-react';
import InputPercentual from '../components/InputPercentual';
import InputMoeda from '../components/InputMoeda';

interface Marketplace {
  id_marketplace?: string;
  descricao: string;
  percentual_comissao: number;
  taxa_fixa_venda: number;
  percentual_transacao: number;
  percentual_servicos: number;
  valor_desconto: number;
  percentual_diverso: number;
  valor_fixo_diverso: number;
  is_active: boolean;
}

export default function Marketplaces() {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  
  const [formData, setFormData] = useState<Marketplace>({
    descricao: '', percentual_comissao: 0, taxa_fixa_venda: 0,
    percentual_transacao: 0, percentual_servicos: 0, valor_desconto: 0,
    percentual_diverso: 0, valor_fixo_diverso: 0, is_active: true
  });

  useEffect(() => {
    document.title = 'Super Pedidos Marketplaces - Canais de Venda';
    carregarMarketplaces();
  }, []);

  async function carregarMarketplaces() {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('marketplace')
        .select('*')
        .order('descricao', { ascending: true });
        
      if (!error && data) setMarketplaces(data);
    } catch (err) {
      console.error('Erro ao buscar marketplaces:', err);
    } finally {
      setCarregando(false);
    }
  }

  const handleInputChange = (field: keyof Marketplace, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      const payload = { 
        descricao: formData.descricao,
        percentual_comissao: formData.percentual_comissao,
        taxa_fixa_venda: formData.taxa_fixa_venda,
        percentual_transacao: formData.percentual_transacao,
        percentual_servicos: formData.percentual_servicos,
        valor_desconto: formData.valor_desconto,
        percentual_diverso: formData.percentual_diverso,
        valor_fixo_diverso: formData.valor_fixo_diverso,
        is_active: formData.is_active,
        user_id: userId 
      };

      if (formData.id_marketplace) {
        const { error } = await supabase
          .from('marketplace')
          .update(payload)
          .eq('id_marketplace', formData.id_marketplace);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('marketplace')
          .insert([payload]);
        
        if (error) throw error;
      }
      
      setModalAberto(false);
      carregarMarketplaces();
    } catch (err) {
      console.error('Erro ao salvar o marketplace:', err);
      alert('Não foi possível salvar os dados. Verifique o painel.');
    }
  }

  function abrirEditar(mkt: Marketplace) {
    setFormData(mkt);
    setModalAberto(true);
  }

  function abrirNovo() {
    setFormData({
      descricao: '', percentual_comissao: 0, taxa_fixa_venda: 0,
      percentual_transacao: 0, percentual_servicos: 0, valor_desconto: 0,
      percentual_diverso: 0, valor_fixo_diverso: 0, is_active: true
    });
    setModalAberto(true);
  }

  const mktFiltrados = marketplaces.filter(m => m.descricao.toLowerCase().includes(busca.toLowerCase()));
  const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <input 
          type="text" placeholder="Buscar canal de venda..." value={busca} onChange={(e) => setBusca(e.target.value)}
          style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #c2cdbc', width: '300px', outline: 'none' }}
        />
        <button onClick={abrirNovo} style={{ backgroundColor: '#708238', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <Plus size={18} /> Novo Marketplace
        </button>
      </div>

      {carregando ? <p>Carregando...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '900px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f6f0', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: '#4b5825' }}>Marketplace</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4b5825' }}>Comissão</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4b5825' }}>Taxa Fixa</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4b5825' }}>Transação</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4b5825' }}>Serviços</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4b5825' }}>Desc. (R$)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4b5825' }}>Div. (%)</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: '#4b5825' }}>Div. (R$)</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', color: '#4b5825' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {mktFiltrados.map(m => (
                <tr key={m.id_marketplace} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{m.descricao}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{(m.percentual_comissao || 0).toFixed(2)}%</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatarMoeda(m.taxa_fixa_venda)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{(m.percentual_transacao || 0).toFixed(2)}%</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{(m.percentual_servicos || 0).toFixed(2)}%</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: m.valor_desconto > 0 ? '#e53e3e' : '#4a5568' }}>{formatarMoeda(m.valor_desconto)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{(m.percentual_diverso || 0).toFixed(2)}%</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatarMoeda(m.valor_fixo_diverso)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button onClick={() => abrirEditar(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568' }}><Edit2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <form onSubmit={handleSalvar} style={{ backgroundColor: '#ffffff', width: '90%', maxWidth: '600px', borderRadius: '10px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: 0, color: '#4b5825', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store size={20} /> Super Pedidos - Configurar Canal
            </h3>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.3rem', color: '#4a5568' }}>Descrição Marketplace *</label>
              <input type="text" value={formData.descricao} onChange={(e) => handleInputChange('descricao', e.target.value)} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #c2cdbc', outline: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <InputPercentual label="Percentual Comissão" value={formData.percentual_comissao} onChange={(val: number) => handleInputChange('percentual_comissao', val)} />
              <InputMoeda label="Taxa Fixa por Venda" value={formData.taxa_fixa_venda} onChange={(val: number) => handleInputChange('taxa_fixa_venda', val)} />
              <InputPercentual label="Percentual Transação" value={formData.percentual_transacao} onChange={(val: number) => handleInputChange('percentual_transacao', val)} />
              <InputPercentual label="Percentual Serviços" value={formData.percentual_servicos} onChange={(val: number) => handleInputChange('percentual_servicos', val)} />
              <InputMoeda label="Valor Desconto" value={formData.valor_desconto} onChange={(val: number) => handleInputChange('valor_desconto', val)} />
              <InputPercentual label="Percentual Diverso" value={formData.percentual_diverso} onChange={(val: number) => handleInputChange('percentual_diverso', val)} />
              <div style={{ gridColumn: 'span 2' }}>
                <InputMoeda label="Valor Fixo Diverso" value={formData.valor_fixo_diverso} onChange={(val: number) => handleInputChange('valor_fixo_diverso', val)} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setModalAberto(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" style={{ backgroundColor: '#708238', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}