import * as DocumentPicker from 'expo-document-picker';
import { enderecoBaseApi, obterTokenAtual, ErroApi } from '@/core/api/cliente-api';
export async function escolherEnviarArquivo(pessoa: string, categoria: string) {
  const tipo = categoria === 'Fotos' ? 'image/*' : categoria === 'Áudios' ? 'audio/*' : 'video/*';
  const resultado = await DocumentPicker.getDocumentAsync({
    type: tipo,
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (resultado.canceled) {
    return null;
  }
  const asset = resultado.assets[0];
  if (!asset.file || !asset.size || asset.size > 10 * 1024 * 1024) {
    throw new Error('Escolha um arquivo de até 10 MB.');
  }
  const body = new FormData();
  body.append('arquivo', asset.file);
  const res = await fetch(enderecoBaseApi + '/idosos/' + pessoa + '/midias', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + obterTokenAtual() },
    body,
  });
  const dados = await res.json();
  if (!res.ok) {
    throw new ErroApi(dados.message || 'Falha ao enviar arquivo.', res.status);
  }
  return { midia: dados.midia as string, nome: asset.name };
}
export async function abrirArquivoPrivado(midia: string) {
  const id = midia.slice(6);
  const resposta = await fetch(enderecoBaseApi + '/midias/' + id, {
    headers: { Authorization: 'Bearer ' + obterTokenAtual() },
  });
  if (!resposta.ok) {
    throw new Error('Você não tem acesso a este arquivo.');
  }
  const url = URL.createObjectURL(await resposta.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = 'memoria-' + id;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function limparArquivosTemporarios() {}
