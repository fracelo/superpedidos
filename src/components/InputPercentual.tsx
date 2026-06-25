import React, { useState, useEffect } from 'react';

interface InputPercentualProps {
  label: string;
  value: number;
  onChange: (valor: number) => void;
  casasDecimais?: number; // Permite alternar entre 2 ou 3 casas (Custo Adicional)
  required?: boolean;
  disabled?: boolean;
}

export default function InputPercentual({
  label,
  value,
  onChange,
  casasDecimais = 2,
  required = false,
  disabled = false
}: InputPercentualProps) {
  const [valorExibido, setValorExibido] = useState<string>('0,00 %');

  // Formata o número puro para a exibição visual (Ex: 5.5 -> "5,50 %")
  const formatarVisual = (num: number): string => {
    const stringFormatada = num.toLocaleString('pt-BR', {
      minimumFractionDigits: casasDecimais,
      maximumFractionDigits: casasDecimais
    });
    return `${stringFormatada} %`;
  };

  // Sincroniza quando o formulário limpa ou abre dados existentes
  useEffect(() => {
    setValorExibido(formatarVisual(value || 0));
  }, [value, casasDecimais]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo o que não for número (inclusive o símbolo % digitado ou residual)
    let apenasNumeros = e.target.value.replace(/\D/g, '');
    
    // Calcula o divisor com base nas casas decimais (2 casas = 100, 3 casas = 1000)
    const divisor = Math.pow(10, casasDecimais);
    const valorNumerico = parseFloat(apenasNumeros) / divisor;
    
    if (isNaN(valorNumerico)) {
      setValorExibido(formatarVisual(0));
      onChange(0);
    } else {
      setValorExibido(formatarVisual(valorNumerico));
      onChange(valorNumerico);
    }
  };

  const handleBlur = () => {
    setValorExibido(formatarVisual(value || 0));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#4a5568' }}>
        {label} {required && '*'}
      </label>
      <input
        type="text"
        inputMode="numeric"
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