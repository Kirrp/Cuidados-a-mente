package com.cuidadosamente.backend.localizacao;

import com.cuidadosamente.backend.infraestrutura.BancoDados;
import java.time.Instant;
import org.springframework.stereotype.Service;

/** Guarda somente a última captura explícita do aparelho autenticado. */
@Service
public class LocalizacaoPersistida implements ServicoLocalizacao {

  private final BancoDados banco;

  public LocalizacaoPersistida(BancoDados banco) {
    this.banco = banco;
  }

  public boolean conectado() {
    return true;
  }

  public boolean coletando(String pessoa) {
    return false;
  }

  public Ponto ultimaConhecida(String pessoa) {
    var linhas = banco.consultar(
      "SELECT * FROM location_points WHERE idoso_id=? AND recorded_at>?",
      pessoa,
      Instant.now().minusSeconds(86400).toString()
    );
    if (linhas.isEmpty()) {
      return null;
    }
    var p = linhas.getFirst();
    return new Ponto(
      ((Number) p.get("latitude")).doubleValue(),
      ((Number) p.get("longitude")).doubleValue(),
      ((Number) p.get("accuracy")).doubleValue(),
      Instant.parse(p.get("recorded_at").toString())
    );
  }
}
