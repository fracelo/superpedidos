import React, { useState, useEffect } from 'react';

interface InputDecimalProps {
  label: string;
  value: number;
  onChange: (valor: number) => void;
  casasDecimais?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function InputDecimal({
  label,
  value,
  onChange,
  casasDecimais = 2,
  placeholder = '0,00',
  required = false,
  disabled = false
}: InputDecimalProps) {
  const [valorExibido, setValorExibido] = useState<string>('');

  // Formata o número puro para exibição com vírgula (Ex: 12.5 -> "12,50")
  const formatarValor = (num: number): string => {
    if (!num && num !== 0) return '';
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: casasDecimais,
      maximumFractionDigits: casasDecimais
    });
  };

  // Sincroniza o estado interno quando o formulário carrega os dados do pai
  useEffect(() => {
    if (value === 0 && (valorExibido === '' || valorExibido === formatarValor(0))) {
      return;
    }
    setValorExibido(value === 0 ? '' : formatarValor(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let texto = e.target.value;

    // Permite apenas números, vírgulas e pontos
    texto = texto.replace(/[^0-9,.]/g, '');

    setValorExibido(texto);

    // Converte temporariamente para ponto para fazer os cálculos em tempo real no pai
    const stringLimpa = texto.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(stringLimpa);
    onChange(isNaN(num) ? 0 : num);
  };

  // Ao sair do campo (onBlur), sanitiza e crava as casas decimais estritas
  const handleBlur = () => {
    const stringLimpa = valorExibido.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(stringLimpa);

    if (isNaN(num) || num === 0) {
      setValorExibido('');
      onChange(0);
    } else {
      const numeroArredondado = Number(num.toFixed(casasDecimais));
      setValorExibido(formatarValor(numeroArredondado));
      onChange(numeroArredondado);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#4a5568' }}>
        {label} {required && '*'}
      </label>
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
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