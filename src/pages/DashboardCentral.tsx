import { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function DashboardCentral() {
  const [periodo, setPeriodo] = useState<'hoje' | 'ontem' | 'semana' | 'mes' | 'config'>('hoje');

  // Dados simulados para a Situação dos Pedidos
  const dadosPedidos = [
    { name: 'A Receber', value: 12, valorFinanceiro: 2400.00 },
    { name: 'Recebidos', value: 25, valorFinanceiro: 5800.50 },
    { name: 'A Entregar', value: 8, valorFinanceiro: 1950.00 }
  ];

  // Dados simulados para a Participação por Produto
  const dadosProdutos = [
    { name: 'Produto Premium A', value: 45, totalReal: 4500.00 },
    { name: 'Produto Standard B', value: 30, totalReal: 3000.00 },
    { name: 'Acessório C', value: 25, totalReal: 2500.00 }
  ];

  // Paleta de Cores baseada no padrão Oliva e Bege do sistema
  const CORES_OLIVA = ['#708238', '#a3b19b', '#4b5825', '#c2cdbc'];

  // Formatador de moeda nacional (BRL)
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div>
      {/* Cabeçalho com Filtros de Período */}
      <div className="dashboard-header-filtros">
        <h2>Visão Geral Operacional</h2>
        <div className="filtro-periodo-grupo">
          <button className={`btn-filtro ${periodo === 'hoje' ? 'active' : ''}`} onClick={() => setPeriodo('hoje')}>Hoje</button>
          <button className={`btn-filtro ${periodo === 'ontem' ? 'active' : ''}`} onClick={() => setPeriodo('ontem')}>Ontem</button>
          <button className={`btn-filtro ${periodo === 'semana' ? 'active' : ''}`} onClick={() => setPeriodo('semana')}>Semana</button>
          <button className={`btn-filtro ${periodo === 'mes' ? 'active' : ''}`} onClick={() => setPeriodo('mes')}>Mês</button>
          <button className={`btn-filtro ${periodo === 'config' ? 'active' : ''}`} onClick={() => setPeriodo('config')}>Configurável</button>
        </div>
      </div>

      {/* Grade de Gráficos */}
      <div className="dashboard-grid-graficos">
        
        {/* GRÁFICO 1: SITUAÇÃO DOS PEDIDOS */}
        <div className="card-grafico">
          <h3>Situação Geral dos Pedidos</h3>
          <div className="area-grafico">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={dadosPedidos} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={4} 
                  dataKey="value"
                >
                  {dadosPedidos.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_OLIVA[index % CORES_OLIVA.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} pedidos`, 'Quantidade']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="custom-legend">
            {dadosPedidos.map((item, index) => (
              <div key={item.name} className="legend-item">
                <div className="legend-label">
                  <div className="legend-color-box" style={{ backgroundColor: CORES_OLIVA[index] }}></div>
                  <span>{item.name}</span>
                </div>
                <span className="legend-value">{item.value} un</span>
              </div>
            ))}
          </div>
        </div>

        {/* GRÁFICO 2: PARTICIPAÇÃO POR PRODUTO */}
        <div className="card-grafico">
          <h3>Participação por Produto</h3>
          <div className="area-grafico">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={dadosProdutos} 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={90} 
                  // Correção TypeScript: validação segura para evitar erro de 'undefined'
                  label={({ percent }) => `${percent ? (percent * 100).toFixed(0) : 0}%`} 
                  dataKey="value"
                >
                  {dadosProdutos.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_OLIVA[index % CORES_OLIVA.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Participação']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="custom-legend">
            {dadosProdutos.map((item, index) => (
              <div key={item.name} className="legend-item">
                <div className="legend-label">
                  <div className="legend-color-box" style={{ backgroundColor: CORES_OLIVA[index] }}></div>
                  <span>{item.name} ({item.value}%)</span>
                </div>
                <span className="legend-value">{formatarMoeda(item.totalReal)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}