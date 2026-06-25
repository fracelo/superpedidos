
interface SelectStatusProps {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  disabled?: boolean;
}

export default function SelectStatus({
  label,
  value,
  onChange,
  disabled = false
}: SelectStatusProps) {
  const statusOpcoes = ['Ativo', 'Pausado', 'Sem Estoque', 'Inativo'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#4a5568' }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.45rem',
          border: '1px solid #cbd5e0',
          borderRadius: '4px',
          outline: 'none',
          backgroundColor: disabled ? '#edf2f7' : '#ffffff',
          boxSizing: 'border-box',
          fontWeight: '500',
          color: '#2d3748',
          cursor: 'pointer',
          height: '34px'
        }}
      >
        {statusOpcoes.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  );
}