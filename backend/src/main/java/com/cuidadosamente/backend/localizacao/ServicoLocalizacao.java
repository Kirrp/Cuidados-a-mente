package com.cuidadosamente.backend.localizacao;

import java.time.Instant;

/** Ponto de integração com GPS; não recebe coordenadas da conta do observador. */
public interface ServicoLocalizacao {
  record Ponto(double latitude, double longitude, double precisaoMetros, Instant atualizadaEm) {
    public Ponto {
      if (
        !Double.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Double.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180 ||
        !Double.isFinite(precisaoMetros) ||
        precisaoMetros < 0 ||
        atualizadaEm == null ||
        atualizadaEm.isAfter(Instant.now().plusSeconds(30))
      ) {
        throw new IllegalArgumentException("Posição inválida");
      }
    }
  }

  boolean conectado();
  boolean coletando(String idosoId);
  Ponto ultimaConhecida(String idosoId);
}
