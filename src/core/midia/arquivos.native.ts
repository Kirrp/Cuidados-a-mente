import * as DocumentPicker from 'expo-document-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import * as Sharing from 'expo-sharing';
import { enderecoBaseApi, obterTokenAtual, ErroApi } from '@/core/api/cliente-api';
export async function escolherEnviarArquivo(pessoa: string, categoria: string) {
  const resultado = await DocumentPicker.getDocumentAsync({
    type: categoria === 'Fotos' ? 'image/*' : categoria === 'Áudios' ? 'audio/*' : 'video/*',
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (resultado.canceled) {
    return null;
  }
  const asset = resultado.assets[0];
  const arquivo = new File(asset.uri);
  if (!arquivo.size || arquivo.size > 10 * 1024 * 1024) {
    arquivo.delete();
    throw new Error('Escolha um arquivo de até 10 MB.');
  }
  try {
    const body = new FormData();
    body.append('arquivo', arquivo);
    const resposta = await fetch(enderecoBaseApi + '/idosos/' + pessoa + '/midias', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + obterTokenAtual() },
      body,
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      throw new ErroApi(dados.message || 'Falha ao enviar arquivo.', resposta.status);
    }
    return { midia: dados.midia as string, nome: asset.name };
  } finally {
    if (arquivo.exists) {
      arquivo.delete();
    }
  }
}
export async function abrirArquivoPrivado(midia: string) {
  const resposta = await fetch(enderecoBaseApi + '/midias/' + midia.slice(6), {
    headers: { Authorization: 'Bearer ' + obterTokenAtual() },
  });
  if (!resposta.ok) {
    throw new Error('Você não tem acesso a este arquivo.');
  }
  const pasta = new Directory(Paths.cache, 'cuidados-midias');
  pasta.create({ intermediates: true, idempotent: true });
  const mime = resposta.headers.get('content-type') || 'application/octet-stream';
  const extensao =
    (
      {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'video/mp4': 'mp4',
      } as Record<string, string>
    )[mime.split(';')[0]] || 'bin';
  const arquivo = new File(pasta, midia.slice(6) + '.' + extensao);
  arquivo.write(await resposta.bytes());
  try {
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Este aparelho não oferece abertura/compartilhamento de arquivos.');
    }
    await Sharing.shareAsync(arquivo.uri, { mimeType: mime });
  } finally {
    if (arquivo.exists) {
      arquivo.delete();
    }
  }
}
export async function limparArquivosTemporarios() {
  const pasta = new Directory(Paths.cache, 'cuidados-midias');
  if (pasta.exists) {
    pasta.delete();
  }
}
