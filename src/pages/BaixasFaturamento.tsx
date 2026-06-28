import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, CheckCircle, Calendar, Wallet, DollarSign, Filter, X, Save } from 'lucide-react';
import { formataDados } from '../components/formataDados';

interface Marketplace {
  id_marketplace: string;
  descricao: string;
  id_conta_corrente_padrao: number | null;
}

interface ContaCorrente {
  id: number;
  descricao: string;
  saldo_atual: number;
}

interface PedidoConciliacao {
  id: number;
  codigo_mktplace: string;
  data_emissao: string;
  nome_cliente: string;
  id_marketplace: string;
  total_liquido_receber: number;
  data_vencimento_repasse: string;
  data_repasse: string | null;
  valor_liquido_efetivo: number;
  marketplace?: {
    descricao: string;
    id_conta_corrente_padrao: number | null;
  };
}

export default function BaixasFaturamento() {
  const [pedidos, setPedidos] = useState<PedidoConciliacao[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [contas, setContas] = useState<ContaCorrente[]>([]);
  
  const [busca, setBusca] = useState('');
  const [filtroMkt, setFiltroMkt] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('PENDENTE'); 
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const hoje = new Date().toISOString().split('T')[0];

  const [pedidoSelecionado, setPedidoSelecionado] = useState<PedidoConciliacao | null>(null);
  const [idContaLiquida, setIdContaLiquida] = useState<number | ''>('');
  const [dataLiquida, setDataLiquida] = useState(hoje);
  const [valorLiquidoReal, setValorLiquidoReal] = useState<number>(0);
  const [observacao, setObservacao] = useState('');

  const [totalPendente, setTotalPendente] = useState(0);
  const [totalConciliadoMes, setTotalConciliadoMes] = useState(0);

  useEffect(() => {
    document.title = 'Super Pedidos - Baixas e Faturamento';
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      
      const { data: mData } = await supabase.from('marketplace').select('id_marketplace, descricao, id_conta_corrente_padrao');
      if (mData) setMarketplaces(mData);

      // Correção: Adicionado o .select('*') antes do .eq()
      const { data: cData } = await supabase.from('conta_corrente').select('*').eq('is_active', true).order('descricao');
      if (cData) setContas(cData);

      const { data: pData, error: pError } = await supabase
        .from('pedido_cabecalho')
        .select('*')
        .order('data_vencimento_repasse', { ascending: true });

      if (!pError && pData) {
        const pedidosFormatados = pData.map((ped: any) => {
          const mkt = mData?.find(m => m.id_marketplace === ped.id_marketplace);
          return {
            ...ped,
            marketplace: mkt ? { descricao: mkt.descricao, id_conta_corrente_padrao: mkt.id_conta_corrente_padrao } : undefined
          };
        });
        setPedidos(pedidosFormatados);
        calcularMetricas(pedidosFormatados);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de faturamento:', err);
    } finally {
      setCarregando(false);
    }
  }

  function calcularMetricas(lista: PedidoConciliacao[]) {
    let pendente = 0;
    let conciliadoMes = 0;
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();

    lista.forEach(p => {
      if (!p.data_repasse) {
        pendente += (p.total_liquido_receber || 0);
      } else {
        const dtRepasse = new Date(p.data_repasse + 'T12:00:00');
        if (dtRepasse.getMonth() === mesAtual && dtRepasse.getFullYear() === anoAtual) {
          conciliadoMes += (p.valor_liquido_efetivo || 0);
        }
      }
    });

    setTotalPendente(pendente);
    setTotalConciliadoMes(conciliadoMes);
  }

  function iniciarBaixa(pedido: PedidoConciliacao) {
    setPedidoSelecionado(pedido);
    setIdContaLiquida(pedido.marketplace?.id_conta_corrente_padrao || '');
    setDataLiquida(hoje);
    setValorLiquidoReal(pedido.total_liquido_receber || 0);
    setObservacao('');
    setModalAberto(true);
  }

  async function estornarBaixa(pedido: PedidoConciliacao) {
    if (!window.confirm(`Deseja realmente estornar a baixa do pedido ${pedido.codigo_mktplace}? O saldo creditado será removido.`)) return;

    try {
      const { data: lanc } = await supabase
        .from('lancamento_financeiro')
        .select('id, id_conta_corrente, valor_efetivo')
        .eq('id_pedido', pedido.id)
        .eq('tipo', 'RECEITA')
        .maybeSingle();

      if (lanc && lanc.id_conta_corrente) {
        const { data: conta } = await supabase.from('conta_corrente').select('saldo_atual').eq('id', lanc.id_conta_corrente).single();
        if (conta) {
          const novoSaldo = Number(conta.saldo_atual) - Number(lanc.valor_efetivo);
          await supabase.from('conta_corrente').update({ saldo_atual: novoSaldo }).eq('id', lanc.id_conta_corrente);
        }

        await supabase.from('lancamento_financeiro').update({
          status: 'PENDENTE',
          data_pagamento: null,
          valor_efetivo: pedido.total_liquido_receber
        }).eq('id', lanc.id);
      }

      await supabase.from('pedido_cabecalho').update({
        data_repasse: null,
        valor_liquido_efetivo: pedido.total_liquido_receber
      }).eq('id', pedido.id);

      carregarDados();
      alert('Baixa estornada com sucesso!');
    } catch (err: any) {
      alert(`Erro ao estornar: ${err.message}`);
    }
  }

  async function executarLiquidação(e: React.FormEvent) {
    e.preventDefault();
    if (!pedidoSelecionado) return;
    if (!idContaLiquida) return alert('Selecione em qual Conta Corrente este valor foi creditado.');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const pedidoId = pedidoSelecionado.id;

      const { error: pedErr } = await supabase
        .from('pedido_cabecalho')
        .update({
          data_repasse: dataLiquida,
          valor_liquido_efetivo: valorLiquidoReal
        })
        .eq('id', pedidoId);
      
      if (pedErr) throw pedErr;

      const { data: lancExistente } = await supabase
        .from('lancamento_financeiro')
        .select('id')
        .eq('id_pedido', pedidoId)
        .eq('tipo', 'RECEITA')
        .maybeSingle();

      const dadosLancamento = {
        id_conta_corrente: Number(idContaLiquida),
        id_pedido: pedidoId,
        tipo: 'RECEITA',
        descricao: `Repasse Pedido ${pedidoSelecionado.codigo_mktplace || pedidoId}`,
        valor_previsto: pedidoSelecionado.total_liquido_receber,
        valor_efetivo: valorLiquidoReal,
        data_vencimento: pedidoSelecionado.data_vencimento_repasse || pedidoSelecionado.data_emissao,
        data_pagamento: dataLiquida,
        status: 'PAGO',
        observacao: observacao || null,
        user_id: sessionData.session?.user?.id
      };

      if (lancExistente) {
        await supabase.from('lancamento_financeiro').update(dadosLancamento).eq('id', lancExistente.id);
      } else {
        await supabase.from('lancamento_financeiro').insert([dadosLancamento]);
      }

      const { data: contaAtiva } = await supabase
        .from('conta_corrente')
        .select('saldo_atual')
        .eq('id', idContaLiquida)
        .single();

      if (contaAtiva) {
        const novoSaldo = Number(contaAtiva.saldo_atual) + Number(valorLiquidoReal);
        await supabase.from('conta_corrente').update({ saldo_atual: novoSaldo }).eq('id', idContaLiquida);
      }

      setModalAberto(false);
      setPedidoSelecionado(null);
      carregarDados();
      alert('Liquidação realizada com sucesso e caixa atualizado!');
    } catch (err: any) {
      alert(`Erro ao processar baixa: ${err.message}`);
    }
  }

  const pedidosFiltrados = pedidos.filter(p => {
    const bateBusca = (p.codigo_mktplace || '').toLowerCase().includes(busca.toLowerCase()) || 
                      (p.nome_cliente || '').toLowerCase().includes(busca.toLowerCase());
    const bateMkt = filtroMkt === '' ? true : p.id_marketplace === filtroMkt;
    const bateStatus = filtroStatus === 'PENDENTE' ? !p.data_repasse : !!p.data_repasse;
    return bateBusca && bateMkt && bateStatus;
  });

  const formatarMoeda = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.3rem', color: '#4a5568' };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '8px', borderLeft: '5px solid #dd6b20', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14}/> Previsão Total de Repasses Pendentes</span>
          <h3 style={{ margin: '0.4rem 0 0 0', color: '#dd6b20', fontSize: '1.6rem' }}>{formatarMoeda(totalPendente)}</h3>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '8px', borderLeft: '5px solid #38a169', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#718096', display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14}/> Total Líquido Efetivado (Mês Atual)</span>
          <h3 style={{ margin: '0.4rem 0 0 0', color: '#38a169', fontSize: '1.6rem' }}>{formatarMoeda(totalConciliadoMes)}</h3>
        </div>
      </div>

      <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 2, minWidth: '250px' }}>
            <input type="text" placeholder="Buscar por Cód. Pedido ou Cliente..." value={busca} onChange={e => setBusca(e.target.value)} style={{ ...inputStyle, paddingLeft: '2.2rem', border: '1px solid #c2cdbc' }} />
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '11px', color: '#a0aec0' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, minWidth: '180px' }}>
            <Filter size={16} style={{ color: '#718096' }} />
            <select value={filtroMkt} onChange={e => setFiltroMkt(e.target.value)} style={{ ...inputStyle, border: '1px solid #c2cdbc', backgroundColor: '#fff' }}>
              <option value="">Todos os Canais</option>
              {marketplaces.map(m => <option key={m.id_marketplace} value={m.id_marketplace}>{m.descricao}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', border: '1px solid #cbd5e0', borderRadius: '6px', overflow: 'hidden' }}>
            <button type="button" onClick={() => setFiltroStatus('PENDENTE')} style={{ padding: '0.6rem 1.2rem', border: 'none', backgroundColor: filtroStatus === 'PENDENTE' ? '#708238' : '#fff', color: filtroStatus === 'PENDENTE' ? '#fff' : '#4a5568', fontWeight: 'bold', cursor: 'pointer' }}>Pendentes</button>
            <button type="button" onClick={() => setFiltroStatus('CONCILIADO')} style={{ padding: '0.6rem 1.2rem', border: 'none', backgroundColor: filtroStatus === 'CONCILIADO' ? '#708238' : '#fff', color: filtroStatus === 'CONCILIADO' ? '#fff' : '#4a5568', fontWeight: 'bold', cursor: 'pointer' }}>Conciliados / Pagos</button>
          </div>
        </div>

        {carregando ? <p style={{ marginTop: '1.5rem' }}>Processando registros do faturamento...</p> : (
          <div style={{ overflowX: 'auto', marginTop: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '1000px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f4f6f0', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.8rem', color: '#4b5825' }}>Cód. Pedido</th>
                  <th style={{ padding: '0.8rem', color: '#4b5825' }}>Canal de Venda</th>
                  <th style={{ padding: '0.8rem', color: '#4b5825' }}>Cliente</th>
                  <th style={{ padding: '0.8rem', color: '#4b5825', textAlign: 'center' }}>Vencimento Repasse</th>
                  <th style={{ padding: '0.8rem', color: '#4b5825', textAlign: 'right' }}>Líquido Teórico</th>
                  <th style={{ padding: '0.8rem', color: '#4b5825', textAlign: 'right' }}>Valor Efetivo</th>
                  <th style={{ padding: '0.8rem', color: '#4b5825', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>Nenhum repasse mapeado nesta categoria.</td></tr>
                ) : (
                  pedidosFiltrados.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>{p.codigo_mktplace}</td>
                      <td style={{ padding: '0.8rem' }}>{p.marketplace?.descricao || 'Desconhecido'}</td>
                      <td style={{ padding: '0.8rem', color: '#4a5568' }}>{p.nome_cliente || 'Não Identificado'}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                        {p.data_vencimento_repasse ? new Date(p.data_vencimento_repasse + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: '500' }}>{formatarMoeda(p.total_liquido_receber)}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 'bold', color: p.data_repasse ? '#2b6cb0' : '#718096' }}>
                        {p.data_repasse ? formatarMoeda(p.valor_liquido_efetivo) : '-'}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                        {filtroStatus === 'PENDENTE' ? (
                          <button type="button" onClick={() => iniciarBaixa(p)} style={{ border: 'none', backgroundColor: '#e6fffa', color: '#234e52', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14}/> Baixar
                          </button>
                        ) : (
                          <button type="button" onClick={() => estornarBaixa(p)} style={{ border: 'none', backgroundColor: '#fff5f5', color: '#c53030', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Estornar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && pedidoSelecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#ffffff', width: '90%', maxWidth: '500px', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            
            <div style={{ backgroundColor: '#f4f6f0', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: '#4b5825', fontSize: '1.1rem' }}>Efetivar Baixa - Pedido #{pedidoSelecionado.codigo_mktplace}</h3>
              <button onClick={() => setModalAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={executarLiquidação} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#718096' }}>Canal de Entrada: <strong>{pedidoSelecionado.marketplace?.descricao}</strong></span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#718096', marginTop: '2px' }}>Valor de Repasse Estimado: <strong>{formatarMoeda(pedidoSelecionado.total_liquido_receber)}</strong></span>
              </div>

              <div>
                <label style={labelStyle}><Wallet size={14}/> Creditar na Conta Corrente *</label>
                <select required value={idContaLiquida} onChange={e => setIdContaLiquida(Number(e.target.value))} style={inputStyle}>
                  <option value="">Selecione a conta de destino...</option>
                  {contas.map(c => <option key={c.id} value={c.id}>{c.descricao}</option>)}
                </select>
                <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>Identifica a conta bancária ou tesouraria física onde o dinheiro entrou.</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Data do Crédito *</label>
                  <input type="date" required value={dataLiquida} onChange={e => setDataLiquida(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Valor Líquido Real (R$) *</label>
                  <input type="text" required value={formataDados(valorLiquidoReal, 'moeda')} onChange={e => setValorLiquidoReal(Number(e.target.value.replace(/\D/g, ''))/100)} style={{ ...inputStyle, fontWeight: 'bold', color: '#2b6cb0' }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Observação Interna</label>
                <textarea rows={2} value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Ex: Ajuste de taxas contratuais da plataforma, bônus de campanha..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setModalAberto(false)} style={{ padding: '0.6rem 1.5rem', border: '1px solid #cbd5e0', backgroundColor: '#fff', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', color: '#4a5568' }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#708238', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '4px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <Save size={18} /> Confirmar Recebimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}