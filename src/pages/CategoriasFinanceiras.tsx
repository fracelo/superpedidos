import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Search, Edit2, Tags, X, Save } from 'lucide-react';

interface CategoriaFinanceira {
  id?: number;
  descricao: string;
  tipo: 'RECEITA' | 'DESPESA' | '';
  is_active: boolean;
}

export default function CategoriasFinanceiras() {
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  
  const [formData, setFormData] = useState<CategoriaFinanceira>({
    descricao: '',
    tipo: '',
    is_active: true
  });

  useEffect(() => {
    document.title = 'Super Pedidos - Categorias Financeiras';
    carregarCategorias();
  }, []);

  async function carregarCategorias() {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('categoria_financeira')
        .select('*')
        .order('tipo', { ascending: false })
        .order('descricao', { ascending: true });
        
      if (!error && data) setCategorias(data);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    } finally {
      setCarregando(false);
    }
  }

  const handleInputChange = (field: keyof CategoriaFinanceira, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.tipo) {
      alert("Por favor, selecione se é Receita ou Despesa.");
      return;
    }

    try {
      const payload = { 
        descricao: formData.descricao,
        tipo: formData.tipo,
        is_active: formData.is_active
      };

      if (formData.id) {
        const { error } = await supabase
          .from('categoria_financeira')
          .update(payload)
          .eq('id', formData.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categoria_financeira')
          .insert([payload]);
        
        if (error) throw error;
      }
      
      setModalAberto(false);
      carregarCategorias();
    } catch (err) {
      console.error('Erro ao salvar categoria:', err);
      alert('Não foi possível salvar os dados.');
    }
  }

  function abrirEditar(cat: CategoriaFinanceira) {
    setFormData(cat);
    setModalAberto(true);
  }

  function abrirNovo() {
    setFormData({
      descricao: '',
      tipo: '',
      is_active: true
    });
    setModalAberto(true);
  }

  const categoriasFiltradas = categorias.filter(c => 
    c.descricao.toLowerCase().includes(busca.toLowerCase()) || 
    c.tipo.toLowerCase().includes(busca.toLowerCase())
  );

  const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' as const, outline: 'none' };
  const labelStyle = { display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.3rem', color: '#4a5568' };

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <input 
            type="text" placeholder="Buscar categoria ou tipo..." value={busca} onChange={(e) => setBusca(e.target.value)} 
            style={{ width: '100%', padding: '0.6rem 2.2rem', borderRadius: '6px', border: '1px solid #c2cdbc', outline: 'none' }} 
          />
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '11px', color: '#a0aec0' }} />
        </div>
        
        <button onClick={abrirNovo} style={{ backgroundColor: '#708238', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <Plus size={18} /> Nova Categoria
        </button>
      </div>

      {carregando ? <p>Carregando registros...</p> : (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f6f0', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.8rem', color: '#4b5825', width: '60px' }}>ID</th>
                <th style={{ padding: '0.8rem', color: '#4b5825' }}>Descrição da Categoria</th>
                <th style={{ padding: '0.8rem', color: '#4b5825', width: '150px' }}>Tipo</th>
                <th style={{ padding: '0.8rem', color: '#4b5825', width: '100px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.8rem', color: '#4b5825', width: '80px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categoriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>Nenhuma categoria encontrada.</td>
                </tr>
              ) : (
                categoriasFiltradas.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '0.8rem', color: '#718096' }}>#{cat.id}</td>
                    <td style={{ padding: '0.8rem', fontWeight: 'bold', color: '#2d3748' }}>{cat.descricao}</td>
                    <td style={{ padding: '0.8rem' }}>
                      <span style={{ 
                        backgroundColor: cat.tipo === 'RECEITA' ? '#f0fff4' : '#fff5f5', 
                        color: cat.tipo === 'RECEITA' ? '#2f855a' : '#c53030', 
                        padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' 
                      }}>
                        {cat.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                      <span style={{ color: cat.is_active ? '#38a169' : '#a0aec0', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {cat.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button type="button" onClick={() => abrirEditar(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568' }}><Edit2 size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE CADASTRO */}
      {modalAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#ffffff', width: '90%', maxWidth: '500px', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            
            <div style={{ backgroundColor: '#f4f6f0', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: '#4b5825', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tags size={20} /> {formData.id ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setModalAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSalvar} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div>
                <label style={labelStyle}>Descrição da Categoria *</label>
                <input 
                  type="text" 
                  value={formData.descricao} 
                  onChange={e => handleInputChange('descricao', e.target.value)} 
                  required 
                  placeholder="Ex: Venda Marketplace, Energia Elétrica..."
                  style={inputStyle} 
                />
              </div>

              <div>
                <label style={labelStyle}>Tipo de Movimentação *</label>
                <select 
                  required 
                  value={formData.tipo} 
                  onChange={e => handleInputChange('tipo', e.target.value)} 
                  style={{...inputStyle, backgroundColor: '#f8fafc', fontWeight: 'bold', color: formData.tipo === 'RECEITA' ? '#2f855a' : formData.tipo === 'DESPESA' ? '#c53030' : '#4a5568'}}
                >
                  <option value="">Selecione o tipo...</option>
                  <option value="RECEITA">Entrada (Receita)</option>
                  <option value="DESPESA">Saída (Despesa)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="ativoCheckbox"
                  checked={formData.is_active} 
                  onChange={e => handleInputChange('is_active', e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="ativoCheckbox" style={{ fontWeight: 'bold', color: '#4a5568', cursor: 'pointer' }}>Categoria Ativa</label>
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