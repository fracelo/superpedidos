export function formataDados(d: string | number | null | undefined, tipo: string): string {
  if (d === undefined || d === null || d === "") return "";

  // Converte para string para garantir que o replace(/\D/g, "") funcione
  const valorTexto = String(d);

  switch (tipo.toLowerCase()) {
    case "moeda": {
      const valorLimpo = valorTexto.replace(/\D/g, "");
      if (!valorLimpo) return "R$ 0,00";
      const valorNumerico = parseFloat(valorLimpo) / 100;
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(valorNumerico);
    }

    case "cpf": {
      let valor = valorTexto.replace(/\D/g, "");
      if (valor.length !== 11) return valor;

      // Mantendo sua validação original
      if (/^(\d)\1+$/.test(valor)) return "CPF inválido";

      let soma = 0;
      for (let i = 0; i < 9; i++) soma += parseInt(valor.charAt(i)) * (10 - i);
      let digito1 = (soma * 10) % 11;
      if (digito1 === 10) digito1 = 0;
      if (digito1 !== parseInt(valor.charAt(9))) return "CPF inválido";

      soma = 0;
      for (let i = 0; i < 10; i++) soma += parseInt(valor.charAt(i)) * (11 - i);
      let digito2 = (soma * 10) % 11;
      if (digito2 === 10) digito2 = 0;
      if (digito2 !== parseInt(valor.charAt(10))) return "CPF inválido";

      return valor
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    case "cnpj": {
      let valor = valorTexto.replace(/\D/g, "");
      if (valor.length !== 14) return valor;

      // Mantendo sua validação original
      if (/^(\d)\1+$/.test(valor)) return "CNPJ inválido";

      const calcDigito = (base: string, pesoInicial: number) => {
        let soma = 0;
        let peso = pesoInicial;
        for (let i = 0; i < base.length; i++) {
          soma += parseInt(base.charAt(i)) * peso;
          peso = peso === 2 ? 9 : peso - 1;
        }
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
      };

      const digito1 = calcDigito(valor.substring(0, 12), 5);
      const digito2 = calcDigito(valor.substring(0, 13), 6);

      if (digito1 !== parseInt(valor.charAt(12)) || digito2 !== parseInt(valor.charAt(13))) {
        return "CNPJ inválido";
      }

      return valor
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    case "cep": {
      let valor = valorTexto.replace(/\D/g, "");
      return valor.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
    }

    case "celular": {
      let valor = valorTexto.replace(/\D/g, "");
      return valor
        .replace(/^(\d{2})(\d)/, "$1 $2")
        .replace(/(\d{1})(\d{4})(\d)/, "$1 $2-$3")
        .replace(/(-\d{4})(\d+?)$/, "$1");
    }

    case "email": {
      return valorTexto.trim().toLowerCase();
    }

    case "decimal": {
      const valorLimpo = valorTexto.replace(/\D/g, "");
      if (!valorLimpo) return "0,00";
      const valorNumerico = parseFloat(valorLimpo) / 100;
      return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(valorNumerico);
    }

    default:
      return valorTexto;
  }
}