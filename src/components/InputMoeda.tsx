import React, { useState, useEffect } from 'react';

interface InputMoedaProps {
  label: string;
  value: number;
  onChange: (valor: number) => void;
  required?: boolean;
  disabled?: boolean;
}

export default function InputMoeda({
  label,
  value,
  onChange,
  required = false,
  disabled = false
}: InputMoedaProps) {
  const [valorExibido, setValorExibido] = useState<string>('R$ 0,00');

  // Formata o número vindo do banco/pai para o padrão brasileiro (Ex: 10.5 -> R$ 10,50)
  const formatarParaBRL = (num: number): string => {
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Sincroniza o estado quando o formulário é carregado ou limpo
  useEffect(() => {
    setValorExibido(formatarParaBRL(value || 0));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo o que não for número
    let apenasNumeros = e.target.value.replace(/\D/g, '');
    
    // Transforma a string de números em centavos (Ex: "1050" -> 10.50)
    const valorNumerico = parseFloat(apenasNumeros) / 100;
    
    if (isNaN(valorNumerico)) {
      setValorExibido('R$ 0,00');
      onChange(0);
    } else {
      setValorExibido(formatarParaBRL(valorNumerico));
      onChange(valorNumerico);
    }
  };

  // Garante a formatação estrita ao sair do campo
  const handleBlur = () => {
    setValorExibido(formatarParaBRL(value || 0));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#4a5568' }}>
        {label} {required && '*'}
      </label>
      <input
        type="text"
        value={valorExibido}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.4rem',
          border: '1px solid #cbd5e0',
          borderRadius: '4px',
          textAlign: 'right',
          outline: 'none',
          backgroundColor: disabled ? '#edf2f7' : '#ffffff',
          boxSizing: 'border-box',
          fontWeight: '500',
          color: '#2d3748'
        }}
      />
    </div>
  );
}