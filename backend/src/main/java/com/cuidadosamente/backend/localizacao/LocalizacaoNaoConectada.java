package com.cuidadosamente.backend.localizacao;

import org.springframework.stereotype.Service;

/** Substituir por um serviço autenticado do dispositivo da pessoa idosa. */
public class LocalizacaoNaoConectada implements ServicoLocalizacao {

  public boolean conectado() {
    return false;
  }

  public boolean coletando(String idosoId) {
    return false;
  }

  public Ponto ultimaConhecida(String idosoId) {
    return null;
  }
}
