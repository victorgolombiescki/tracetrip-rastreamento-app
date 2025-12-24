export const formatarDataParaInput = (data: Date | string | null | undefined): string => {
  if (!data) return '';
  
  const date = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(date.getTime())) return '';
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
};

export const formatarDataParaAPI = (dataString: string): string | null => {
  if (!dataString || dataString.trim() === '') return null;
  
  const partes = dataString.split('/');
  if (partes.length !== 3) return null;
  
  const diaStr = partes[0].trim();
  const mesStr = partes[1].trim();
  const anoStr = partes[2].trim();
  
  if (diaStr.length !== 2 || mesStr.length !== 2 || anoStr.length !== 4) return null;
  
  const dia = parseInt(diaStr, 10);
  const mes = parseInt(mesStr, 10);
  const ano = parseInt(anoStr, 10);
  
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
  
  if (mes < 1 || mes > 12) return null;
  if (dia < 1 || dia > 31) return null;
  
  const anoAtual = new Date().getFullYear();
  if (ano < 1900 || ano > anoAtual + 1) return null;
  
  const data = new Date(ano, mes - 1, dia);
  
  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null;
  }
  
  if (isNaN(data.getTime())) {
    return null;
  }
  
  const diaFormatado = String(dia).padStart(2, '0');
  const mesFormatado = String(mes).padStart(2, '0');
  
  const dataISO = `${ano}-${mesFormatado}-${diaFormatado}T00:00:00.000Z`;
  
  const dataValidacao = new Date(dataISO);
  if (isNaN(dataValidacao.getTime())) {
    return null;
  }
  
  return dataISO;
};

export const formatarDataInput = (texto: string): string => {
  const apenasNumeros = texto.replace(/\D/g, '');
  
  if (apenasNumeros.length <= 2) {
    return apenasNumeros;
  }
  
  if (apenasNumeros.length <= 4) {
    const dia = apenasNumeros.slice(0, 2);
    const mes = apenasNumeros.slice(2);
    
    if (mes.length === 1) {
      const mesNum = parseInt(mes, 10);
      if (mesNum > 1) {
        return `${dia}/0${mes}`;
      }
      return `${dia}/${mes}`;
    }
    
    if (mes.length === 2) {
      const mesNum = parseInt(mes, 10);
      if (mesNum > 12) {
        return `${dia}/12`;
      }
      return `${dia}/${mes}`;
    }
    
    return `${dia}/${mes}`;
  }
  
  return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4, 8)}`;
};


