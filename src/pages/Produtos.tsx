import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.ts';
import { Plus, Search, Edit2, Trash2, X, Save, Store } from 'lucide-react';
import InputMoeda from '../components/InputMoeda';
import InputPercentual from '../components/InputPercentual';
import SelectStatus from '../components/SelectStatus';

// Interface básica do Produto (Tabela product)
interface Product {
  id?: number;
  description: string;
  sku: string;
}

// Interface detalhada da precificação por Marketplace (Tabela preco_produto_marketplace)
interface PrecoMarketplaceForm {
  id_preco_marketplace?: string;
  status: string;
  sku: string;
  supplier_cost: number;
  suggested_margin: number;
  suggested_sale_value: number;
  final_sale_value: number;
  percentual_comissao: number;
  valor_comissao_calculado: number;
  percentual_comissao_afiliado: number;
  valor_afiliado_calculado: number;
  taxa_fixa_venda: number;
  percentual_transacao: number;
  valor_transacao_calculado: number;
  percentual_servicos: number;
  valor_servicos_calculado: number;
  valor_desconto: number;
  percentual_diverso: number;
  valor_diverso_pct_calculado: number;
  valor_fixo_diverso: number;
  total_fees: number;
  net_receivable: number;
}

interface ListaPrecosMarketplace {
  [id_marketplace: string]: PrecoMarketplaceForm;
}

export default function Produtos() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [marketplaces, setMarketplaces] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [abaMktAtiva, setAbaMktAtiva] = useState<string>('');
  const [valoresMkt, setValoresMkt] = useState<ListaPrecosMarketplace>({});

  const [formData, setFormData] = useState<Product>({ description: '', sku: '' });

  useEffect(() => {
    document.title = 'Super Pedidos Marketplaces - Catálogo';
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      setCarregando(true);
      const { data, error } = await supabase.from('product').select('*').order('description', { ascending: true });
      if (!error && data) setProdutos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarDadosMarketplace(idProduto?: string) {
    const { data: listaMkt } = await supabase.from('marketplace').select('*').eq('is_active', true).order('descricao');
    if (!listaMkt) return;
    setMarketplaces(listaMkt);
    if (listaMkt.length > 0) setAbaMktAtiva(listaMkt[0].id_marketplace);

    let precosSalvos: any[] = [];
    if (idProduto) {
      const { data } = await supabase.from('preco_produto_marketplace').select('*').eq('id_produto', idProduto);
      if (data) precosSalvos = data;
    }

    const matrizInicial: ListaPrecosMarketplace = {};
    listaMkt.forEach(mkt => {
      const salvo = precosSalvos.find(p => p.id_marketplace === mkt.id_marketplace);
      matrizInicial[mkt.id_marketplace] = {
        id_preco_marketplace: salvo?.id_preco_marketplace || undefined,
        status: salvo?.status || 'Ativo',
        sku: salvo?.sku || '',
        supplier_cost: salvo ? Number(salvo.supplier_cost) : 0,
        suggested_margin: salvo ? Number(salvo.suggested_margin) : 0,
        suggested_sale_value: salvo ? Number(salvo.suggested_sale_value) : 0,
        final_sale_value: salvo ? Number(salvo.final_sale_value) : 0,
        
        percentual_comissao: salvo ? Number(salvo.percentual_comissao) : Number(mkt.percentual_comissao || 0),
        valor_comissao_calculado: salvo ? Number(salvo.valor_comissao_calculado) : 0,
        
        percentual_comissao_afiliado: salvo ? Number(salvo.percentual_comissao_afiliado) : 0,
        valor_afiliado_calculado: salvo ? Number(salvo.valor_afiliado_calculado) : 0,
        
        taxa_fixa_venda: salvo ? Number(salvo.taxa_fixa_venda) : Number(mkt.taxa_fixa_venda || 0),
        
        percentual_transacao: salvo ? Number(salvo.percentual_transacao) : Number(mkt.percentual_transacao || 0),
        valor_transacao_calculado: salvo ? Number(salvo.valor_transacao_calculado) : 0,
        
        percentual_servicos: salvo ? Number(salvo.percentual_servicos) : Number(mkt.percentual_servicos || 0),
        valor_servicos_calculado: salvo ? Number(salvo.valor_servicos_calculado) : 0,
        
        valor_desconto: salvo ? Number(salvo.valor_desconto) : Number(mkt.valor_desconto || 0),
        
        percentual_diverso: salvo ? Number(salvo.percentual_diverso) : Number(mkt.percentual_diverso || 0),
        valor_diverso_pct_calculado: salvo ? Number(salvo.valor_diverso_pct_calculado) : 0,
        
        valor_fixo_diverso: salvo ? Number(salvo.valor_fixo_diverso) : Number(mkt.valor_fixo_diverso || 0),
        total_fees: salvo ? Number(salvo.total_fees) : 0,
        net_receivable: salvo ? Number(salvo.net_receivable) : 0,
      };
    });

    setValoresMkt(matrizInicial);
  }

  const handleCampoMktChange = (idMkt: string, campo: keyof PrecoMarketplaceForm, valor: any) => {
    setValoresMkt(prev => {
      const d = { ...prev[idMkt], [campo]: valor };

      const D9 = Number(d.supplier_cost) || 0;
      const E9 = Number(d.suggested_margin) || 0;
      const D_2 = Number(d.taxa_fixa_venda) || 0;
      const comPct = Number(d.percentual_comissao) || 0;
      const afiPct = Number(d.percentual_comissao_afiliado) || 0;
      const traPct = Number(d.percentual_transacao) || 0;
      const serPct = Number(d.percentual_servicos) || 0;
      const divPct = Number(d.percentual_diverso) || 0;
      const realSale = Number(d.final_sale_value) || 0;

      const E1 = (100 - comPct - afiPct) / 100;
      let sugSale = 0;
      if (E1 > 0) {
        const base = (D9 + E9 + D_2) / E1;
        sugSale = base + (base * traPct / 100) + (base * serPct / 100) + (base * divPct / 100);
      }

      const vCom = realSale * (comPct / 100);
      const vAfi = realSale * (afiPct / 100);
      const vTra = realSale * (traPct / 100);
      const vSer = realSale * (serPct / 100);
      const vDiv = realSale * (divPct / 100);

      const fees = D_2 + Number(d.valor_desconto) + Number(d.valor_fixo_diverso) + vCom + vAfi + vTra + vSer + vDiv;
      const net = realSale - fees;

      return {
        ...prev,
        [idMkt]: {
          ...d,
          suggested_sale_value: Number(sugSale.toFixed(2)),
          valor_comissao_calculado: Number(vCom.toFixed(2)),
          valor_afiliado_calculado: Number(vAfi.toFixed(2)),
          valor_transacao_calculado: Number(vTra.toFixed(2)),
          valor_servicos_calculado: Number(vSer.toFixed(2)),
          valor_diverso_pct_calculado: Number(vDiv.toFixed(2)),
          total_fees: Number(fees.toFixed(2)),
          net_receivable: Number(net.toFixed(2))
        }
      };
    });
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    // Atualiza os dados principais do produto
    setFormData(prev => ({ ...prev, [field]: value }));

    // Se o campo alterado for o SKU Geral, replica automaticamente para todos os canais
    if (field === 'sku') {
      setValoresMkt(prevMkt => {
        const novosValores = { ...prevMkt };
        Object.keys(novosValores).forEach(idMkt => {
          novosValores[idMkt] = {
            ...novosValores[idMkt],
            sku: value
          };
        });
        return novosValores;
      });
    }
  };

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error("Usuário não autenticado.");

      const productPayload = { description: formData.description, sku: formData.sku, user_id: userId };
      let idProduto: number;

      if (formData.id) {
        const { error } = await supabase.from('product').update(productPayload).eq('id', formData.id);
        if (error) throw error;
        idProduto = formData.id;
      } else {
        const { data, error } = await supabase.from('product').insert([productPayload]).select().single();
        if (error) throw error;
        idProduto = data.id;
      }

      for (const idMkt of Object.keys(valoresMkt)) {
        const item = valoresMkt[idMkt];
        const mktPayload: any = {
          id_produto: idProduto,
          id_marketplace: idMkt,
          status: item.status,
          sku: item.sku || null,
          supplier_cost: item.supplier_cost,
          suggested_margin: item.suggested_margin,
          suggested_sale_value: item.suggested_sale_value,
          final_sale_value: item.final_sale_value,
          percentual_comissao: item.percentual_comissao,
          valor_comissao_calculado: item.valor_comissao_calculado,
          percentual_comissao_afiliado: item.percentual_comissao_afiliado,
          valor_afiliado_calculado: item.valor_afiliado_calculado,
          taxa_fixa_venda: item.taxa_fixa_venda,
          percentual_transacao: item.percentual_transacao,
          valor_transacao_calculado: item.valor_transacao_calculado,
          percentual_servicos: item.percentual_servicos,
          valor_servicos_calculado: item.valor_servicos_calculado,
          valor_desconto: item.valor_desconto,
          percentual_diverso: item.percentual_diverso,
          valor_diverso_pct_calculado: item.valor_diverso_pct_calculado,
          valor_fixo_diverso: item.valor_fixo_diverso,
          total_fees: item.total_fees,
          net_receivable: item.net_receivable,
          user_id: userId
        };

        if (item.id_preco_marketplace) {
          mktPayload.id_preco_marketplace = item.id_preco_marketplace;
          const { error } = await supabase.from('preco_produto_marketplace').upsert(mktPayload, { onConflict: 'id_preco_marketplace' });
          if (error) throw error;
        } else {
          const { error } = await supabase.from('preco_produto_marketplace').insert([mktPayload]);
          if (error) throw error;
        }
      }

      setModalAberto(false);
      carregarProdutos();
      alert('Tudo salvo com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao salvar: ${err.message}`);
    }
  }

  function abrirEditar(p: Product) {
    setFormData(p);
    carregarDadosMarketplace(String(p.id));
    setModalAberto(true);
  }

  function abrirNovo() {
    setFormData({ description: '', sku: '' });
    carregarDadosMarketplace();
    setModalAberto(true);
  }

  async function deletar(id: number) {
    if (confirm('Deseja excluir?')) {
      await supabase.from('product').delete().eq('id', id);
      carregarProdutos();
    }
  }

  const formatarMoeda = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const filtrados = produtos.filter(p => p.description.toLowerCase().includes(busca.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(busca.toLowerCase())));

  // ESTILO COMPRIMIDO PARA AS LINHAS DE CÁLCULO
  const rowGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 100px 140px',
    gap: '0.4rem',
    alignItems: 'center',
    borderBottom: '1px dashed #e2e8f0',
    padding: '2px 0',
    fontSize: '0.8rem'
  };

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <input type="text" placeholder="Buscar produto ou SKU..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ width: '100%', padding: '0.6rem 2.2rem', borderRadius: '6px', border: '1px solid #c2cdbc', outline: 'none' }} />
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '11px', color: '#a0aec0' }} />
        </div>
        <button onClick={abrirNovo} style={{ backgroundColor: '#708238', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}><Plus size={18} /> Novo Produto</button>
      </div>

      {carregando ? <p>Carregando...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f6f0', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem', color: '#4b5825', width: '150px' }}>SKU</th>
                <th style={{ padding: '0.75rem', color: '#4b5825' }}>Descrição</th>
                <th style={{ padding: '0.75rem', color: '#4b5825', textAlign: 'center', width: '120px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((prod) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{prod.sku || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{prod.description}</td>
                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button type="button" onClick={() => abrirEditar(prod)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568' }}><Edit2 size={16} /></button>
                    <button type="button" onClick={() => prod.id && deletar(prod.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#ffffff', width: '95%', maxWidth: '850px', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ backgroundColor: '#f4f6f0', padding: '0.8rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: '#4b5825', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}><Store size={18} /> {formData.id ? 'Editar Cadastro' : 'Novo Cadastro'}</h3>
              <button type="button" onClick={() => setModalAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSalvar} style={{ padding: '1rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '0.1rem', color: '#4a5568' }}>Descrição Produto *</label>
                  <input type="text" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} required style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid #c2cdbc', outline: 'none', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '0.1rem', color: '#4a5568' }}>SKU Geral</label>
                  <input type="text" value={formData.sku || ''} onChange={(e) => handleInputChange('sku', e.target.value)} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid #c2cdbc', outline: 'none', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ marginTop: '0.3rem', border: '1px solid #c2cdbc', borderRadius: '8px', padding: '0.5rem', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', borderBottom: '2px solid #708238', marginBottom: '0.5rem', gap: '2px', overflowX: 'auto' }}>
                  {marketplaces.map(mkt => {
                    const estaAtiva = abaMktAtiva === mkt.id_marketplace;
                    const d = valoresMkt[mkt.id_marketplace];
                    
                    const bgStatus = d?.status === 'Ativo' ? (estaAtiva ? '#ffffff' : '#c6f6d5') : (estaAtiva ? '#ffe5e5' : '#fed7d7');
                    const corStatus = d?.status === 'Ativo' ? (estaAtiva ? '#708238' : '#22543d') : (estaAtiva ? '#c53030' : '#742a2a');

                    return (
                      <button 
                        key={mkt.id_marketplace} 
                        type="button" 
                        onClick={() => setAbaMktAtiva(mkt.id_marketplace)} 
                        style={{ 
                          padding: '0.3rem 0.8rem', border: '1px solid', borderColor: estaAtiva ? '#708238' : '#cbd5e0', backgroundColor: estaAtiva ? '#708238' : '#f1f5f9', color: estaAtiva ? '#ffffff' : '#4a5568', fontWeight: 'bold', borderRadius: '4px 4px 0 0', cursor: 'pointer', marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', transition: 'background-color 0.2s', fontSize: '0.8rem'
                        }}
                      >
                        <Store size={12} /> {mkt.descricao}
                        <span style={{ fontSize: '0.65rem', backgroundColor: bgStatus, color: corStatus, padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {d?.status}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {abaMktAtiva && valoresMkt[abaMktAtiva] && (() => {
                  const item = valoresMkt[abaMktAtiva];
                  const margemFinal = item.net_receivable - (Number(item.supplier_cost) || 0);

                  return (
                    <div style={{ backgroundColor: '#fcfdfa', padding: '0.5rem', borderRadius: '4px', maxWidth: '550px', margin: '0 auto', border: '1px solid #e2e8f0' }}>
                      
                      {/* --- CABEÇALHO DA ABA --- */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
                        <SelectStatus label="Status" value={item.status} onChange={(val: string) => handleCampoMktChange(abaMktAtiva, 'status', val)} />
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '2px' }}>SKU Canal</label>
                          <input type="text" value={item.sku} onChange={(e) => handleCampoMktChange(abaMktAtiva, 'sku', e.target.value)} style={{ width: '100%', padding: '0.2rem', border: '1px solid #cbd5e0', borderRadius: '4px', outline: 'none', height: '26px', boxSizing: 'border-box', fontSize: '0.8rem' }} />
                        </div>
                      </div>

                      {/* --- PREÇOS PRINCIPAIS --- */}
                      <div style={rowGridStyle}>
                        <span style={{ color: '#e53e3e', fontWeight: '600' }}>Custo do Produto</span>
                        <InputMoeda label="" value={item.supplier_cost} onChange={(val: number) => handleCampoMktChange(abaMktAtiva, 'supplier_cost', val)} />
                        <span />
                      </div>

                      <div style={rowGridStyle}>
                        <span style={{ color: '#2b6cb0', fontWeight: '600' }}>Margem Sugerida</span>
                        <InputMoeda label="" value={item.suggested_margin} onChange={(val: number) => handleCampoMktChange(abaMktAtiva, 'suggested_margin', val)} />
                        <span style={{ color: '#2b6cb0', fontSize: '0.7rem', textAlign: 'right', fontWeight: '600', lineHeight: '1.1' }}>(Venda Sugerida <br/> {formatarMoeda(item.suggested_sale_value)})</span>
                      </div>

                      <div style={rowGridStyle}>
                        <span style={{ color: '#2b6cb0', fontWeight: '600' }}>Venda Final</span>
                        <InputMoeda label="" value={item.final_sale_value} onChange={(val: number) => handleCampoMktChange(abaMktAtiva, 'final_sale_value', val)} />
                        <span />
                      </div>

                      {/* --- SIMULAÇÃO FINANCEIRA --- */}
                      <h5 style={{ margin: '0.5rem 0 0.2rem 0', color: '#4b5825', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', fontSize: '0.8rem' }}>Simulação Financeira</h5>
                      
                      <div style={rowGridStyle}>
                        <span style={{ color: '#4a5568', fontWeight: '500' }}>Comissão Marketplace (%)</span>
                        <InputPercentual label="" value={item.percentual_comissao} onChange={(val: number) => handleCampoMktChange(abaMktAtiva, 'percentual_comissao', val)} />
                        <span style={{ color: '#e53e3e', fontWeight: '600', textAlign: 'right' }}>{formatarMoeda(item.valor_comissao_calculado)}</span>
                      </div>

                      <div style={rowGridStyle}>
                        <span style={{ color: '#4a5568', fontWeight: '500' }}>ComissãoAfiliado (%)</span>
                        <InputPercentual label="" value={item.percentual_comissao_afiliado} onChange={(val: number) => handleCampoMktChange(abaMktAtiva, 'percentual_comissao_afiliado', val)} />
                        <span style={{ color: '#e53e3e', fontWeight: '600', textAlign: 'right' }}>{formatarMoeda(item.valor_afiliado_calculado)}</span>
                      </div>

                      <div style={rowGridStyle}>
                        <span style={{ color: '#4a5568', fontWeight: '500' }}>Taxa de Transação (%)</span>
                        <InputPercentual label="" value={item.percentual_transacao} onChange={(val: number) => handleCampoMktChange(abaMktAtiva, 'percentual_transacao', val)} />
                        <span style={{ color: '#e53e3e', fontWeight: '600', textAlign: 'right' }}>{formatarMoeda(item.valor_transacao_calculado)}</span>
                      </div>

                      <div style={rowGridStyle}>
                        <span style={{ color: '#4a5568', fontWeight: '500' }}>Taxa de Serviços (%)</span>
                        <InputPercentual label="" value={item.percentual_servicos} onChange={(val: number) => handleCampoMktChange(abaMktAtiva, 'percentual_servicos', val)} />
                        <span style={{ color: '#e53e3e', fontWeight: '600', textAlign: 'right' }}>{formatarMoeda(item.valor_servicos_calculado)}</span>
                      </div>

                      <div style={rowGridStyle}>
                        <span style={{ color: '#4a5568', fontWeight: '500' }}>Taxas Diversas (%)</span>
                        <InputPercentual label="" value={item.percentual_diverso} onChange={(val: number) => handleCampoMktChange(abaMktAtiva, 'percentual_diverso', val)} />
                        <span style={{ color: '#e53e3e', fontWeight: '600', textAlign: 'right' }}>{formatarMoeda(item.valor_diverso_pct_calculado)}</span>
                      </div>

                      <div style={rowGridStyle}>
                        <span style={{ color: '#4a5568', fontWeight: '500' }}>Desconto (R$)</span>
                        <InputMoeda label="" value={item.valor_desconto} onChange={(val: number) => handleCampoMktChange(abaMktAtiva, 'valor_desconto', val)} />
                        <span style={{ color: '#e53e3e', fontWeight: '600', textAlign: 'right' }}>{formatarMoeda(item.valor_desconto)}</span>
                      </div>

                      <div style={rowGridStyle}>
                        <span style={{ color: '#4a5568', fontWeight: '500' }}>Taxa Fixa p/venda (R$)</span>
                        <InputMoeda label="" value={item.taxa_fixa_venda} onChange={(val: number) => handleCampoMktChange(abaMktAtiva, 'taxa_fixa_venda', val)} />
                        <span style={{ color: '#e53e3e', fontWeight: '600', textAlign: 'right' }}>{formatarMoeda(item.taxa_fixa_venda)}</span>
                      </div>

                      <div style={rowGridStyle}>
                        <span style={{ color: '#4a5568', fontWeight: '500' }}>Diversos Fixo (R$)</span>
                        <InputMoeda label="" value={item.valor_fixo_diverso} onChange={(val: number) => handleCampoMktChange(abaMktAtiva, 'valor_fixo_diverso', val)} />
                        <span style={{ color: '#e53e3e', fontWeight: '600', textAlign: 'right' }}>{formatarMoeda(item.valor_fixo_diverso)}</span>
                      </div>

                      {/* --- RESULTADO FINAL --- */}
                      <div style={{ backgroundColor: '#FFFDE7', padding: '0.5rem', borderRadius: '6px', border: '2px solid #616161', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#e53e3e', fontWeight: 'bold' }}>Total Taxas Marketplace:</span>
                          <strong style={{ fontSize: '0.95rem', color: '#e53e3e' }}>{formatarMoeda(item.total_fees)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#2b6cb0', fontWeight: 'bold' }}>Líquido a Receber:</span>
                          <strong style={{ fontSize: '0.95rem', color: '#2b6cb0' }}>{formatarMoeda(item.net_receivable)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#2b6cb0', fontWeight: 'bold' }}>Margem Final:</span>
                          <strong style={{ fontSize: '0.95rem', color: '#2b6cb0' }}>{formatarMoeda(margemFinal)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #edf2f7', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                <button type="button" onClick={() => setModalAberto(false)} style={{ padding: '0.4rem 1rem', border: '1px solid #cbd5e0', backgroundColor: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#708238', color: '#fff', padding: '0.4rem 1rem', borderRadius: '4px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}><Save size={16} /> Salvar Tudo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}