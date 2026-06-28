import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Search, Edit2, Trash2, X, Save, Upload, ShoppingBag, User, MapPin, AlertCircle, Truck } from 'lucide-react';
import { formataDados } from '../components/formataDados'; 

const InputFormatado = ({ valor, onValorChange, style, placeholder = "0.00", casasDecimais = 2, step = "0.01" }: any) => {
  const [focado, setFocado] = useState(false);

  let valorExibicao = valor;
  if (!focado) {
    valorExibicao = (Number(valor) || 0).toFixed(casasDecimais);
  }

  return (
    <input
      type="number"
      step={step}
      placeholder={placeholder}
      value={valorExibicao}
      onFocus={() => setFocado(true)}
      onBlur={() => setFocado(false)}
      onChange={(e) => onValorChange(e.target.value)}
      style={style}
    />
  );
};

interface PedidoCabecalho {
  id?: number;
  id_marketplace: string;
  codigo_mktplace: string;
  data_emissao: string;
  nome_cliente: string;
  cpf: string;
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  fone_contato: string;
  email: string;
  
  data_despacho: string;
  data_prevista_entrega: string;
  data_entrega: string;
  data_vencimento_repasse: string;
  data_repasse: string;
  valor_liquido_efetivo: number;

  total_valor_venda_produtos: number;
  total_taxa_transacao: number;
  total_servico_adicional: number;
  total_comissao: number;
  total_desconto: number;
  total_despesas_diversas: number;
  total_comissao_afiliado: number;
  total_despesas_marketplace: number;
  total_liquido_receber: number;
  total_custo_produtos: number;
  margem_liquida_pedido: number;
}

interface PedidoDetalhe {
  id?: number;
  produto_id: number | '';
  sku_produto: string;
  descricao_produto: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  acrescimo_desconto: number;
  valor_venda_desconto: number; 

  perc_comissao_marketplace: number;
  taxa_fixa_base: number;
  perc_taxa_transacao: number;
  perc_taxa_servico: number;
  valor_desconto_base: number;
  perc_diverso: number;

  valor_comissao_marketplace: number;
  valor_taxa_fixa: number;
  valor_taxa_transacao: number;
  valor_taxa_servico: number;
  valor_servico_adicional: number; 
  valor_desconto: number;
  valor_diverso: number;
  
  custo_unitario: number;
  custo_pedido: number;
  liquido_pago: number; 
  margem_liquida_produto: number;
}

function adicionarDias(dataStr: string, dias: number): string {
  if (!dataStr) return '';
  const d = new Date(dataStr + 'T12:00:00');
  d.setDate(d.getDate() + Number(dias));
  return d.toISOString().split('T')[0];
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<PedidoCabecalho[]>([]);
  const [marketplaces, setMarketplaces] = useState<any[]>([]);
  const [produtosBase, setProdutosBase] = useState<any[]>([]);
  
  const [busca, setBusca] = useState('');
  const [marketplaceImportacao, setMarketplaceImportacao] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'geral' | 'endereco' | 'logistica'>('geral');
  
  const [linhaBuscaAtiva, setLinhaBuscaAtiva] = useState<{ index: number, campo: 'sku' | 'desc' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hoje = new Date().toISOString().split('T')[0];

  const cabecalhoInicial: PedidoCabecalho = {
    id_marketplace: '', codigo_mktplace: '', 
    data_emissao: hoje, data_despacho: hoje,
    nome_cliente: '', cpf: '', cep: '', endereco: '', bairro: '', cidade: '', uf: '', fone_contato: '', email: '',
    data_prevista_entrega: '', data_entrega: '', data_vencimento_repasse: '', data_repasse: '', valor_liquido_efetivo: 0,
    total_valor_venda_produtos: 0, total_taxa_transacao: 0, total_servico_adicional: 0, total_comissao: 0,
    total_desconto: 0, total_despesas_diversas: 0, total_comissao_afiliado: 0, total_despesas_marketplace: 0,
    total_liquido_receber: 0, total_custo_produtos: 0, margem_liquida_pedido: 0
  };
  
  const [cabecalho, setCabecalho] = useState<PedidoCabecalho>(cabecalhoInicial);
  const [itens, setItens] = useState<PedidoDetalhe[]>([]);

  useEffect(() => {
    document.title = 'Super Pedidos - Gestão de Pedidos';
    carregarDadosIniciais();
  }, []);

  async function carregarDadosIniciais() {
    setCarregando(true);
    try {
      const { data: pData } = await supabase.from('pedido_cabecalho').select('*').order('data_emissao', { ascending: false });
      if (pData) setPedidos(pData);

      const { data: mData } = await supabase
        .from('marketplace')
        .select('id_marketplace, descricao, prazo_entrega_dias, prazo_repasse_dias, id_conta_corrente_padrao')
        .eq('is_active', true);
      if (mData) setMarketplaces(mData);

      const { data: prodData } = await supabase.from('product').select('id, sku, description');
      if (prodData) setProdutosBase(prodData);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  function dispararImportacao() {
    if (!marketplaceImportacao) {
      alert("Selecione o Marketplace antes de importar o arquivo.");
      return;
    }
    fileInputRef.current?.click();
  }

  async function abrirNovo() {
    const { data } = await supabase
      .from('pedido_cabecalho')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    const proximoId = (data && data.length > 0) ? (data[0].id || 0) + 1 : 1;

    const hojeData = new Date();
    const aaaa = hojeData.getFullYear();
    const mm = String(hojeData.getMonth() + 1).padStart(2, '0');
    const dd = String(hojeData.getDate()).padStart(2, '0');
    const sequencia = String(proximoId).padStart(5, '0');
    
    const novoCodigoInteligente = `${aaaa}${mm}${dd}${sequencia}`;
    const hojeStr = hojeData.toISOString().split('T')[0];

    setCabecalho({
      ...cabecalhoInicial,
      codigo_mktplace: novoCodigoInteligente,
      data_emissao: hojeStr,
      data_despacho: hojeStr
    });
    
    setItens([]);
    setAbaAtiva('geral');
    setModalAberto(true);
  }

  async function abrirEditar(ped: PedidoCabecalho) {
    setCabecalho(ped);
    setAbaAtiva('geral');
    setModalAberto(true);

    try {
      const { data: dData, error } = await supabase
        .from('pedido_detalhe')
        .select('*')
        .eq('pedido_id', ped.id);
      
      if (!error && dData) {
        const itensCarregados = dData.map(i => ({
          ...i,
          taxa_fixa_base: 0, 
          valor_desconto_base: 0
        }));
        setItens(itensCarregados);
      }
    } catch (err) {
      console.error("Erro ao buscar itens do pedido:", err);
    }
  }

  function adicionarItemVazio() {
    if (!cabecalho.id_marketplace) {
      alert("Selecione o Marketplace no Cabeçalho antes de inserir produtos.");
      return;
    }
    setItens([...itens, {
      produto_id: '', sku_produto: '', descricao_produto: '', quantidade: 1, valor_unitario: 0,
      subtotal: 0, acrescimo_desconto: 0, valor_venda_desconto: 0, 
      perc_comissao_marketplace: 0, taxa_fixa_base: 0, perc_taxa_transacao: 0, perc_taxa_servico: 0, valor_desconto_base: 0, perc_diverso: 0,
      valor_comissao_marketplace: 0, valor_taxa_fixa: 0, valor_taxa_transacao: 0, valor_taxa_servico: 0, valor_servico_adicional: 0, valor_desconto: 0, valor_diverso: 0,
      custo_unitario: 0, custo_pedido: 0, liquido_pago: 0, margem_liquida_produto: 0
    }]);
  }

  async function aplicarProdutoSelecionado(index: number, produto: any) {
    const novosItens = [...itens];
    const item = novosItens[index];
    
    item.produto_id = produto.id;
    item.sku_produto = produto.sku || '';
    item.descricao_produto = produto.description || '';
    
    const { data: precoData } = await supabase
      .from('preco_produto_marketplace')
      .select('final_sale_value, supplier_cost, percentual_comissao, percentual_transacao, percentual_servicos, taxa_fixa_venda, valor_desconto, percentual_diverso')
      .eq('id_produto', produto.id)
      .eq('id_marketplace', cabecalho.id_marketplace)
      .single();

    if (precoData) {
      item.valor_unitario = Number(precoData.final_sale_value) || 0; 
      item.custo_unitario = Number(precoData.supplier_cost) || 0;
      
      item.perc_comissao_marketplace = Number(precoData.percentual_comissao) || 0;
      item.taxa_fixa_base = Number(precoData.taxa_fixa_venda) || 0;
      item.perc_taxa_transacao = Number(precoData.percentual_transacao) || 0;
      item.perc_taxa_servico = Number(precoData.percentual_servicos) || 0;
      item.valor_desconto_base = Number(precoData.valor_desconto) || 0;
      item.perc_diverso = Number(precoData.percentual_diverso) || 0;
    }

    setLinhaBuscaAtiva(null);
    processarCalculoLinha(novosItens, index, 'produto_id');
  }

  function handleItemChange(index: number, campo: keyof PedidoDetalhe, valor: any) {
    const novosItens = [...itens];
    if (campo === 'sku_produto' || campo === 'descricao_produto') {
      // @ts-ignore
      novosItens[index][campo] = valor;
    } else {
      const valorNumerico = valor === '' ? 0 : Number(valor);
      // @ts-ignore
      novosItens[index][campo] = valorNumerico;
    }
    processarCalculoLinha(novosItens, index, campo);
  }

  const arredondar = (v: number) => Number(Number(v).toFixed(2));

  function processarCalculoLinha(lista: PedidoDetalhe[], index: number, campoAlterado: string) {
    const item = lista[index];
    
    item.subtotal = arredondar(Number(item.quantidade) * Number(item.valor_unitario));
    item.valor_venda_desconto = arredondar(item.subtotal + Number(item.acrescimo_desconto));
    item.custo_pedido = arredondar(Number(item.custo_unitario) * Number(item.quantidade));

    const camposAutomaticos = ['produto_id', 'quantidade', 'valor_unitario', 'acrescimo_desconto'];
    if (camposAutomaticos.includes(campoAlterado)) {
      item.valor_comissao_marketplace = arredondar(item.valor_venda_desconto * (item.perc_comissao_marketplace / 100));
      item.valor_taxa_transacao = arredondar(item.valor_venda_desconto * (item.perc_taxa_transacao / 100));
      item.valor_taxa_servico = arredondar(item.valor_venda_desconto * (item.perc_taxa_servico / 100));
      item.valor_diverso = arredondar(item.valor_venda_desconto * (item.perc_diverso / 100));
      
      item.valor_taxa_fixa = arredondar(item.taxa_fixa_base);
      item.valor_desconto = arredondar(item.valor_desconto_base);
      item.valor_servico_adicional = item.valor_taxa_fixa; 
    }

    if (!camposAutomaticos.includes(campoAlterado) && campoAlterado !== 'liquido_pago') {
      item.valor_comissao_marketplace = arredondar(item.valor_comissao_marketplace);
      item.valor_taxa_fixa = arredondar(item.valor_taxa_fixa);
      item.valor_taxa_transacao = arredondar(item.valor_taxa_transacao);
      item.valor_taxa_servico = arredondar(item.valor_taxa_servico);
      item.valor_desconto = arredondar(item.valor_desconto);
      item.valor_diverso = arredondar(item.valor_diverso);
      item.acrescimo_desconto = arredondar(item.acrescimo_desconto);
    }

    if (campoAlterado !== 'liquido_pago') {
      item.liquido_pago = arredondar(
        item.valor_venda_desconto 
        - item.valor_comissao_marketplace
        - item.valor_taxa_fixa
        - item.valor_taxa_transacao
        - item.valor_taxa_servico
        - item.valor_desconto
        - item.valor_diverso
      );
    } else {
      item.liquido_pago = arredondar(item.liquido_pago);
    }

    item.margem_liquida_produto = arredondar(item.liquido_pago - item.custo_pedido);

    setItens(lista);
    recalcularCabecalho(lista, cabecalho);
  }

  function recalcularCabecalho(listaItens: PedidoDetalhe[], cabAtual: PedidoCabecalho) {
    let tVenda = 0, tTransacao = 0, tServico = 0, tComissao = 0, tDesconto = 0, tDiversos = 0, tCusto = 0;

    listaItens.forEach(i => {
      tVenda += i.valor_venda_desconto;
      tTransacao += i.valor_taxa_transacao;
      tServico += (i.valor_taxa_servico + i.valor_taxa_fixa);
      tComissao += i.valor_comissao_marketplace;
      tDesconto += i.valor_desconto;
      tDiversos += i.valor_diverso;
      tCusto += i.custo_pedido;
    });

    const tDespesasMkt = tTransacao + tServico + tComissao + tDesconto + tDiversos
      + Number(cabAtual.total_desconto) + Number(cabAtual.total_despesas_diversas) + Number(cabAtual.total_comissao_afiliado);
    
    const tLiquido = tVenda - tDespesasMkt;
    const margem = tLiquido - tCusto;

    let novoLiquidoEfetivo = cabAtual.valor_liquido_efetivo;
    if (cabAtual.valor_liquido_efetivo === 0 || cabAtual.valor_liquido_efetivo === cabAtual.total_liquido_receber) {
      novoLiquidoEfetivo = tLiquido;
    }

    setCabecalho({
      ...cabAtual,
      total_valor_venda_produtos: arredondar(tVenda), 
      total_taxa_transacao: arredondar(tTransacao), 
      total_servico_adicional: arredondar(tServico),
      total_comissao: arredondar(tComissao), 
      total_desconto: arredondar(tDesconto), 
      total_despesas_diversas: arredondar(tDiversos), 
      total_custo_produtos: arredondar(tCusto), 
      total_despesas_marketplace: arredondar(tDespesasMkt), 
      total_liquido_receber: arredondar(tLiquido), 
      margem_liquida_pedido: arredondar(margem),
      valor_liquido_efetivo: arredondar(novoLiquidoEfetivo)
    });
  }

  function handleCabecalhoChange(campo: keyof PedidoCabecalho, valor: any) {
    const cabNovo = { ...cabecalho, [campo]: valor };
    const mktAtivo = marketplaces.find(m => m.id_marketplace === cabNovo.id_marketplace);
    
    if (campo === 'data_emissao') {
      cabNovo.data_despacho = valor;
    }

    if (mktAtivo) {
      if (campo === 'data_emissao' || campo === 'data_despacho' || campo === 'id_marketplace') {
        if (cabNovo.data_despacho) {
          cabNovo.data_prevista_entrega = adicionarDias(cabNovo.data_despacho, mktAtivo.prazo_entrega_dias || 0);
          cabNovo.data_entrega = cabNovo.data_prevista_entrega;
          cabNovo.data_vencimento_repasse = adicionarDias(cabNovo.data_entrega, mktAtivo.prazo_repasse_dias || 0);
        }
      }
      
      if (campo === 'data_entrega' && cabNovo.data_entrega) {
        cabNovo.data_vencimento_repasse = adicionarDias(cabNovo.data_entrega, mktAtivo.prazo_repasse_dias || 0);
      }
    }

    setCabecalho(cabNovo);
    
    if(campo !== 'valor_liquido_efetivo') {
      recalcularCabecalho(itens, cabNovo);
    }
  }

  async function salvarPedido(e: React.FormEvent) {
    e.preventDefault();
    if (!cabecalho.id_marketplace) { alert("Obrigatório selecionar um Marketplace no cabeçalho."); return; }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      // SANITIZAÇÃO DE DATAS: Impede o erro de sintaxe de data enviando NULL ao invés de ""
      const payloadCabecalho = { 
        ...cabecalho, 
        user_id: sessionData.session?.user?.id,
        data_emissao: cabecalho.data_emissao || null,
        data_despacho: cabecalho.data_despacho || null,
        data_prevista_entrega: cabecalho.data_prevista_entrega || null,
        data_entrega: cabecalho.data_entrega || null,
        data_vencimento_repasse: cabecalho.data_vencimento_repasse || null,
        data_repasse: cabecalho.data_repasse || null
      };
      
      let pedidoId = cabecalho.id;

      if (pedidoId) {
        const { error: updateError } = await supabase.from('pedido_cabecalho').update(payloadCabecalho).eq('id', pedidoId);
        if (updateError) throw updateError;
        await supabase.from('pedido_detalhe').delete().eq('pedido_id', pedidoId);
      } else {
        const { data, error: insertError } = await supabase
          .from('pedido_cabecalho')
          .insert([payloadCabecalho])
          .select()
          .single();
        
        if (insertError) throw insertError;
        if (!data) throw new Error("O banco não retornou o ID do pedido criado.");
        
        pedidoId = data.id;
      }

      if (itens.length > 0) {
        const payloadItens = itens.map(i => {
          const s = { ...i, pedido_id: pedidoId, produto_id: i.produto_id || null };
          delete (s as any).taxa_fixa_base; delete (s as any).valor_desconto_base;
          return s;
        });
        const { error: itensError } = await supabase.from('pedido_detalhe').insert(payloadItens);
        if (itensError) throw itensError;
      }

      // === INTEGRAÇÃO E UPSERT AUTOMÁTICO DO FINANCEIRO ===
      const mktAtivo = marketplaces.find(m => m.id_marketplace === cabecalho.id_marketplace);
      
      if (mktAtivo && mktAtivo.id_conta_corrente_padrao) {
        // Verifica se já existe um lançamento financeiro atrelado a este pedido
        const { data: lancExistente } = await supabase
          .from('lancamento_financeiro')
          .select('id')
          .eq('id_pedido', pedidoId)
          .eq('tipo', 'RECEITA')
          .maybeSingle();

        const lancFinanceiro = {
          id_conta_corrente: mktAtivo.id_conta_corrente_padrao,
          id_pedido: pedidoId,
          tipo: 'RECEITA',
          descricao: `Repasse Pedido ${cabecalho.codigo_mktplace || pedidoId}`,
          valor_previsto: cabecalho.total_liquido_receber,
          valor_efetivo: cabecalho.valor_liquido_efetivo > 0 ? cabecalho.valor_liquido_efetivo : cabecalho.total_liquido_receber,
          data_vencimento: cabecalho.data_vencimento_repasse || cabecalho.data_emissao,
          data_pagamento: cabecalho.data_repasse || null,
          status: cabecalho.data_repasse ? 'PAGO' : 'PENDENTE',
          user_id: sessionData.session?.user?.id
        };

        if (lancExistente) {
          // Se já existe, altera o registro existente conforme as novas informações do pedido
          const { error: finUpdateError } = await supabase
            .from('lancamento_financeiro')
            .update(lancFinanceiro)
            .eq('id', lancExistente.id);
            
          if (finUpdateError) console.error("Erro ao atualizar financeiro:", finUpdateError);
        } else {
          // Se for um pedido novo ou sem lançamento, cria o registro
          if (cabecalho.total_liquido_receber > 0) {
            const { error: finInsertError } = await supabase
              .from('lancamento_financeiro')
              .insert([lancFinanceiro]);
              
            if (finInsertError) console.error("Erro ao inserir financeiro:", finInsertError);
          }
        }
      }
      // ====================================================

      setModalAberto(false);
      carregarDadosIniciais();
      alert('Pedido armazenado com sucesso!');
    } catch (err: any) { alert(`Erro ao salvar: ${err.message}`); }
  }

  const formatarMoeda = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const inputStyle = { width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '0.4rem' };
  const miniIndiceStyle = { fontSize: '0.68rem', fontWeight: 'bold' as const, color: '#718096', marginBottom: '2px', paddingLeft: '2px', display: 'block', whiteSpace: 'nowrap' as const };

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <input type="text" placeholder="Buscar pedidos..." value={busca} onChange={(e) => setBusca(e.target.value)} style={{ width: '100%', padding: '0.6rem 2.2rem', borderRadius: '6px', border: '1px solid #c2cdbc', outline: 'none' }} />
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '11px', color: '#a0aec0' }} />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid #2b6cb0', borderRadius: '6px', overflow: 'hidden' }}>
            <select value={marketplaceImportacao} onChange={e => setMarketplaceImportacao(e.target.value)} style={{ padding: '0.6rem', border: 'none', outline: 'none', backgroundColor: '#ebf8ff', color: '#2b6cb0', fontWeight: 'bold' }}>
              <option value="">Selecione o Mkt para Importar...</option>
              {marketplaces.map(m => <option key={m.id_marketplace} value={m.id_marketplace}>{m.descricao}</option>)}
            </select>
            <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} style={{ display: 'none' }} />
            <button onClick={dispararImportacao} style={{ backgroundColor: '#2b6cb0', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <Upload size={18} /> Importar Planilha
            </button>
          </div>
          <button onClick={abrirNovo} style={{ backgroundColor: '#708238', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <Plus size={18} /> Novo Pedido
          </button>
        </div>
      </div>

      {carregando ? <p>Carregando registros...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f6f0', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem', color: '#4b5825' }}>Cód. Pedido</th>
                <th style={{ padding: '0.75rem', color: '#4b5825' }}>Data</th>
                <th style={{ padding: '0.75rem', color: '#4b5825' }}>Cliente</th>
                <th style={{ padding: '0.75rem', color: '#4b5825', textAlign: 'right' }}>Venda Bruta</th>
                <th style={{ padding: '0.75rem', color: '#4b5825', textAlign: 'right' }}>Margem Líq.</th>
                <th style={{ padding: '0.75rem', color: '#4b5825', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((ped) => (
                <tr key={ped.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '600' }}>{ped.codigo_mktplace || 'Manual'}</td>
                  <td style={{ padding: '0.75rem' }}>{new Date(ped.data_emissao).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '0.75rem' }}>{ped.nome_cliente}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatarMoeda(ped.total_valor_venda_produtos)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: ped.margem_liquida_pedido >= 0 ? '#2b6cb0' : '#e53e3e' }}>{formatarMoeda(ped.margem_liquida_pedido)}</td>
                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button type="button" onClick={() => abrirEditar(ped)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568' }}><Edit2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#ffffff', width: '98%', maxWidth: '1650px', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}>
            
            <div style={{ backgroundColor: '#f4f6f0', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: '#4b5825', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingBag size={20} /> Detalhes do Pedido</h3>
              <button onClick={() => setModalAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={salvarPedido} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <button type="button" onClick={() => setAbaAtiva('geral')} style={{ padding: '0.8rem 1.5rem', border: 'none', backgroundColor: abaAtiva === 'geral' ? '#fff' : 'transparent', borderBottom: abaAtiva === 'geral' ? '2px solid #708238' : '2px solid transparent', fontWeight: 'bold', color: abaAtiva === 'geral' ? '#708238' : '#4a5568', cursor: 'pointer', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <User size={16}/> Dados Principais
                </button>
                <button type="button" onClick={() => setAbaAtiva('endereco')} style={{ padding: '0.8rem 1.5rem', border: 'none', backgroundColor: abaAtiva === 'endereco' ? '#fff' : 'transparent', borderBottom: abaAtiva === 'endereco' ? '2px solid #708238' : '2px solid transparent', fontWeight: 'bold', color: abaAtiva === 'endereco' ? '#708238' : '#4a5568', cursor: 'pointer', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <MapPin size={16}/> Endereço
                </button>
                <button type="button" onClick={() => setAbaAtiva('logistica')} style={{ padding: '0.8rem 1.5rem', border: 'none', backgroundColor: abaAtiva === 'logistica' ? '#fff' : 'transparent', borderBottom: abaAtiva === 'logistica' ? '2px solid #708238' : '2px solid transparent', fontWeight: 'bold', color: abaAtiva === 'logistica' ? '#708238' : '#4a5568', cursor: 'pointer', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <Truck size={16}/> Logística & Repasse
                </button>
              </div>

              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, backgroundColor: '#fcfdfa' }}>
                
                <div style={{ display: abaAtiva === 'geral' ? 'grid' : 'none', gridTemplateColumns: '1.5fr 1.5fr 1fr 2fr 1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{...labelStyle, color: '#e53e3e'}}>Marketplace (Bloqueia Grade)*</label>
                    <select required value={cabecalho.id_marketplace} onChange={e => handleCabecalhoChange('id_marketplace', e.target.value)} style={{...inputStyle, borderColor: cabecalho.id_marketplace ? '#cbd5e0' : '#e53e3e', backgroundColor: cabecalho.id_marketplace ? '#fff' : '#fff5f5' }}>
                      <option value="">Selecione...</option>
                      {marketplaces.map(m => <option key={m.id_marketplace} value={m.id_marketplace}>{m.descricao}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Cód. Pedido</label><input type="text" value={cabecalho.codigo_mktplace} onChange={e => handleCabecalhoChange('codigo_mktplace', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Data Emissão</label><input type="date" value={cabecalho.data_emissao} onChange={e => handleCabecalhoChange('data_emissao', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Nome Cliente</label><input type="text" value={cabecalho.nome_cliente} onChange={e => handleCabecalhoChange('nome_cliente', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>CPF</label><input type="text" value={cabecalho.cpf} onChange={e => handleCabecalhoChange('cpf', formataDados(e.target.value, 'cpf'))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Telefone</label><input type="text" value={cabecalho.fone_contato} onChange={e => handleCabecalhoChange('fone_contato', formataDados(e.target.value, 'celular'))} style={inputStyle} /></div>
                </div>

                <div style={{ display: abaAtiva === 'endereco' ? 'grid' : 'none', gridTemplateColumns: '1fr 3fr 1fr 1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
                  <div><label style={labelStyle}>CEP</label><input type="text" value={cabecalho.cep} onChange={e => handleCabecalhoChange('cep', formataDados(e.target.value, 'cep'))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Endereço</label><input type="text" value={cabecalho.endereco} onChange={e => handleCabecalhoChange('endereco', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Bairro</label><input type="text" value={cabecalho.bairro} onChange={e => handleCabecalhoChange('bairro', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Cidade</label><input type="text" value={cabecalho.cidade} onChange={e => handleCabecalhoChange('cidade', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>UF</label><input type="text" value={cabecalho.uf} onChange={e => handleCabecalhoChange('uf', e.target.value)} style={inputStyle} /></div>
                </div>

                <div style={{ display: abaAtiva === 'logistica' ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1.5fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
                  <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '1rem' }}>
                    <label style={{...labelStyle, color: '#805ad5', textAlign: 'right'}}>Data Despacho</label>
                    <input type="date" value={cabecalho.data_despacho} onChange={e => handleCabecalhoChange('data_despacho', e.target.value)} style={{...inputStyle, borderColor: '#d6bcfa', textAlign: 'right'}} />
                  </div>
                  <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '1rem' }}>
                    <label style={{...labelStyle, color: '#805ad5', textAlign: 'right'}}>Prev. Entrega</label>
                    <input type="date" value={cabecalho.data_prevista_entrega} onChange={e => handleCabecalhoChange('data_prevista_entrega', e.target.value)} style={{...inputStyle, borderColor: '#d6bcfa', backgroundColor: '#faf5ff', textAlign: 'right'}} />
                  </div>
                  <div>
                    <label style={{...labelStyle, color: '#319795', textAlign: 'right'}}>Data Entrega (Efetiva)</label>
                    <input type="date" value={cabecalho.data_entrega} onChange={e => handleCabecalhoChange('data_entrega', e.target.value)} style={{...inputStyle, borderColor: '#b2f5ea', textAlign: 'right'}} />
                  </div>
                  <div>
                    <label style={{...labelStyle, color: '#319795', textAlign: 'right'}}>Prev. Vencimento Repasse</label>
                    <input type="date" value={cabecalho.data_vencimento_repasse} onChange={e => handleCabecalhoChange('data_vencimento_repasse', e.target.value)} style={{...inputStyle, borderColor: '#b2f5ea', backgroundColor: '#e6fffa', textAlign: 'right'}} />
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
                    <label style={{...labelStyle, color: '#2b6cb0', textAlign: 'right'}}>Data Repasse (Efetivo)</label>
                    <input type="date" value={cabecalho.data_repasse} onChange={e => handleCabecalhoChange('data_repasse', e.target.value)} style={{...inputStyle, borderColor: '#90cdf4', textAlign: 'right'}} />
                  </div>
                  <div>
                    <label style={{...labelStyle, color: '#2b6cb0', textAlign: 'right'}}>Valor Líquido Real Recebido</label>
                    <InputFormatado valor={cabecalho.valor_liquido_efetivo} onValorChange={(v: any) => handleCabecalhoChange('valor_liquido_efetivo', Number(v))} style={{...inputStyle, borderColor: '#90cdf4', backgroundColor: '#ebf8ff', color: '#2b6cb0', fontWeight: 'bold', textAlign: 'right'}} />
                  </div>
                </div>

                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem', opacity: cabecalho.id_marketplace ? 1 : 0.5, pointerEvents: cabecalho.id_marketplace ? 'auto' : 'none' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <h4 style={{ margin: 0, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShoppingBag size={16}/> Itens, Índices e Descontos Rateados</h4>
                      {!cabecalho.id_marketplace && <span style={{ color: '#e53e3e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14}/> Defina o Marketplace acima para cadastrar produtos</span>}
                    </div>
                    <button type="button" onClick={adicionarItemVazio} style={{ backgroundColor: '#e2e8f0', color: '#2d3748', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>+ Inserir Produto</button>
                  </div>
                  
                  <div style={{ overflowX: 'auto', border: '1px solid #cbd5e0', borderRadius: '6px', backgroundColor: '#fff', minHeight: '380px', paddingBottom: '120px' }}>
                    <table style={{ width: '100%', minWidth: '1600px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e0' }}>
                        <tr>
                          <th style={{ padding: '0.6rem', textAlign: 'left', width: '130px' }}>SKU</th>
                          <th style={{ padding: '0.6rem', textAlign: 'left', minWidth: '180px' }}>Descrição Produto</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '65px' }}>Qtd</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '90px' }}>Vlr Sugerido</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '90px' }}>Subtotal</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '90px' }}>Ajuste</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '95px', fontWeight: 'bold' }}>Total Item</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '95px', color: '#e53e3e' }}>Comissão</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '85px', color: '#e53e3e' }}>Fixo Uni</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '95px', color: '#e53e3e' }}>Tx Transação</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '95px', color: '#e53e3e' }}>Tx Serviços</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '85px', color: '#e53e3e' }}>Desconto Fixo</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '95px', color: '#e53e3e' }}>Diverso</th>
                          <th style={{ padding: '0.6rem', textAlign: 'right', width: '105px', backgroundColor: '#ebf8ff', color: '#2b6cb0', fontWeight: 'bold' }}>Líquido</th>
                          <th style={{ padding: '0.6rem', textAlign: 'center', width: '35px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map((item, idx) => {
                          const filtroSKU = linhaBuscaAtiva?.index === idx && linhaBuscaAtiva.campo === 'sku' ? produtosBase.filter(p => (p.sku || '').toLowerCase().includes(item.sku_produto.toLowerCase())) : [];
                          const filtroDesc = linhaBuscaAtiva?.index === idx && linhaBuscaAtiva.campo === 'desc' ? produtosBase.filter(p => (p.description || '').toLowerCase().includes(item.descricao_produto.toLowerCase())) : [];
                          
                          const abrirParaCima = idx > 1 && idx === itens.length - 1;
                          const posicaoDropdown = abrirParaCima 
                            ? { bottom: '100%', marginBottom: '4px', boxShadow: '0 -4px 6px rgba(0,0,0,0.15)' } 
                            : { top: '100%', marginTop: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.15)' };

                          return (
                            <tr key={idx} style={{ borderBottom: '1px dashed #e2e8f0' }}>
                              
                              <td style={{ padding: '0.4rem', position: 'relative' }}>
                                <span style={miniIndiceStyle}>Busca SKU</span>
                                <input type="text" value={item.sku_produto} placeholder="SKU..." onFocus={() => setLinhaBuscaAtiva({ index: idx, campo: 'sku' })} onBlur={() => setTimeout(() => setLinhaBuscaAtiva(null), 250)} onChange={e => handleItemChange(idx, 'sku_produto', e.target.value)} style={inputStyle} />
                                {linhaBuscaAtiva?.index === idx && linhaBuscaAtiva.campo === 'sku' && item.sku_produto.length > 0 && filtroSKU.length > 0 && (
                                  <ul style={{ position: 'absolute', left: 0, right: '-150px', backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '4px', zIndex: 100, maxHeight: '180px', overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none', ...posicaoDropdown }}>
                                    {filtroSKU.map(p => <li key={p.id} onMouseDown={() => aplicarProdutoSelecionado(idx, p)} style={{ padding: '0.5rem', borderBottom: '1px solid #edf2f7', cursor: 'pointer', fontSize: '0.8rem' }}><strong style={{ color: '#708238' }}>{p.sku}</strong> - {p.description}</li>)}
                                  </ul>
                                )}
                              </td>

                              <td style={{ padding: '0.4rem', position: 'relative' }}>
                                <span style={miniIndiceStyle}>Busca Descrição</span>
                                <input type="text" value={item.descricao_produto} placeholder="Nome..." onFocus={() => setLinhaBuscaAtiva({ index: idx, campo: 'desc' })} onBlur={() => setTimeout(() => setLinhaBuscaAtiva(null), 250)} onChange={e => handleItemChange(idx, 'descricao_produto', e.target.value)} style={inputStyle} />
                                {linhaBuscaAtiva?.index === idx && linhaBuscaAtiva.campo === 'desc' && item.descricao_produto.length > 0 && filtroDesc.length > 0 && (
                                  <ul style={{ position: 'absolute', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '4px', zIndex: 100, maxHeight: '180px', overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none', ...posicaoDropdown }}>
                                    {filtroDesc.map(p => <li key={p.id} onMouseDown={() => aplicarProdutoSelecionado(idx, p)} style={{ padding: '0.5rem', borderBottom: '1px solid #edf2f7', cursor: 'pointer', fontSize: '0.8rem' }}>{p.description} <span style={{ color: '#a0aec0' }}>({p.sku})</span></li>)}
                                  </ul>
                                )}
                              </td>

                              <td style={{ padding: '0.4rem' }}>
                                <span style={miniIndiceStyle}>Qtd</span>
                                <InputFormatado valor={item.quantidade} casasDecimais={3} step="0.001" onValorChange={(v: any) => handleItemChange(idx, 'quantidade', v)} style={{...inputStyle, textAlign: 'right'}} />
                              </td>
                              <td style={{ padding: '0.4rem' }}>
                                <span style={miniIndiceStyle}>Unitário</span>
                                <InputFormatado valor={item.valor_unitario} onValorChange={(v: any) => handleItemChange(idx, 'valor_unitario', v)} style={{...inputStyle, textAlign: 'right', color: '#2b6cb0', fontWeight: 'bold'}} />
                              </td>
                              <td style={{ padding: '0.4rem', textAlign: 'right' }}>
                                <span style={miniIndiceStyle}>Qtd * Vlr</span>
                                <div style={{ padding: '0.4rem 0', color: '#4a5568', fontWeight: 500 }}>{formatarMoeda(item.subtotal)}</div>
                              </td>
                              
                              <td style={{ padding: '0.4rem' }}>
                                <span style={miniIndiceStyle}>Ajuste</span>
                                <InputFormatado valor={item.acrescimo_desconto} onValorChange={(v: any) => handleItemChange(idx, 'acrescimo_desconto', v)} style={{...inputStyle, textAlign: 'right', color: '#805ad5'}} />
                              </td>
                              <td style={{ padding: '0.4rem', textAlign: 'right', backgroundColor: '#e6fffa' }}>
                                <span style={miniIndiceStyle}>Total Item</span>
                                <div style={{ padding: '0.4rem 0', fontWeight: 'bold', color: '#234e52' }}>{formatarMoeda(item.valor_venda_desconto)}</div>
                              </td>
                              
                              <td style={{ padding: '0.4rem' }}>
                                <span style={miniIndiceStyle}>Comissão ({item.perc_comissao_marketplace.toFixed(2)}%)</span>
                                <InputFormatado valor={item.valor_comissao_marketplace} onValorChange={(v: any) => handleItemChange(idx, 'valor_comissao_marketplace', v)} style={{...inputStyle, textAlign: 'right', color: '#e53e3e'}} />
                              </td>
                              <td style={{ padding: '0.4rem' }}>
                                <span style={miniIndiceStyle}>Fixo Uni</span>
                                <InputFormatado valor={item.valor_taxa_fixa} onValorChange={(v: any) => handleItemChange(idx, 'valor_taxa_fixa', v)} style={{...inputStyle, textAlign: 'right', color: '#e53e3e'}} />
                              </td>
                              <td style={{ padding: '0.4rem' }}>
                                <span style={miniIndiceStyle}>Transação ({item.perc_taxa_transacao.toFixed(2)}%)</span>
                                <InputFormatado valor={item.valor_taxa_transacao} onValorChange={(v: any) => handleItemChange(idx, 'valor_taxa_transacao', v)} style={{...inputStyle, textAlign: 'right', color: '#e53e3e'}} />
                              </td>
                              <td style={{ padding: '0.4rem' }}>
                                <span style={miniIndiceStyle}>Serviços ({item.perc_taxa_servico.toFixed(2)}%)</span>
                                <InputFormatado valor={item.valor_taxa_servico} onValorChange={(v: any) => handleItemChange(idx, 'valor_taxa_servico', v)} style={{...inputStyle, textAlign: 'right', color: '#e53e3e'}} />
                              </td>
                              <td style={{ padding: '0.4rem' }}>
                                <span style={miniIndiceStyle}>Desconto Fixo</span>
                                <InputFormatado valor={item.valor_desconto} onValorChange={(v: any) => handleItemChange(idx, 'valor_desconto', v)} style={{...inputStyle, textAlign: 'right', color: '#e53e3e'}} />
                              </td>
                              <td style={{ padding: '0.4rem' }}>
                                <span style={miniIndiceStyle}>Diverso ({item.perc_diverso.toFixed(2)}%)</span>
                                <InputFormatado valor={item.valor_diverso} onValorChange={(v: any) => handleItemChange(idx, 'valor_diverso', v)} style={{...inputStyle, textAlign: 'right', color: '#e53e3e'}} />
                              </td>

                              <td style={{ padding: '0.4rem', backgroundColor: '#ebf8ff' }}>
                                <span style={{...miniIndiceStyle, color: '#2b6cb0'}}>Líquido</span>
                                <InputFormatado valor={item.liquido_pago} onValorChange={(v: any) => handleItemChange(idx, 'liquido_pago', v)} style={{...inputStyle, textAlign: 'right', color: '#2b6cb0', fontWeight: 'bold', backgroundColor: '#fff'}} />
                              </td>
                              
                              <td style={{ padding: '0.4rem', textAlign: 'center' }}><button type="button" onClick={() => { const n = itens.filter((_, i) => i !== idx); setItens(n); recalcularCabecalho(n, cabecalho); }} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', marginTop: '14px' }}><Trash2 size={16}/></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              <div style={{ backgroundColor: '#2d3748', padding: '1.2rem', color: '#fff', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', borderTop: '3px solid #708238' }}>
                <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#a0aec0' }}>Venda Bruta (Itens)</span><strong style={{ fontSize: '1.1rem' }}>{formatarMoeda(cabecalho.total_valor_venda_produtos)}</strong></div>
                <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#fc8181' }}>(-) Despesas Marketplace</span><strong style={{ fontSize: '1.1rem', color: '#feb2b2' }}>{formatarMoeda(cabecalho.total_despesas_marketplace)}</strong></div>
                <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#90cdf4' }}>(=) Líquido a Receber (Teórico)</span><strong style={{ fontSize: '1.1rem', color: '#bee3f8' }}>{formatarMoeda(cabecalho.total_liquido_receber)}</strong></div>
                <div><span style={{ display: 'block', fontSize: '0.75rem', color: '#fbd38d' }}>(-) Custo total Produtos</span><strong style={{ fontSize: '1.1rem', color: '#fef08a' }}>{formatarMoeda(cabecalho.total_custo_produtos)}</strong></div>
                <div style={{ borderLeft: '1px solid #4a5568', paddingLeft: '1rem' }}><span style={{ display: 'block', fontSize: '0.75rem', color: '#68d391', fontWeight: 'bold' }}>Margem Líquida Real</span><strong style={{ fontSize: '1.3rem', color: cabecalho.margem_liquida_pedido >= 0 ? '#9ae6b4' : '#fc8181' }}>{formatarMoeda(cabecalho.margem_liquida_pedido)}</strong></div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#f4f6f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setModalAberto(false)} style={{ padding: '0.6rem 1.5rem', border: '1px solid #cbd5e0', backgroundColor: '#fff', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', color: '#4a5568' }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#708238', color: '#fff', padding: '0.6rem 1.5rem', borderRadius: '4px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}><Save size={18} /> Salvar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}