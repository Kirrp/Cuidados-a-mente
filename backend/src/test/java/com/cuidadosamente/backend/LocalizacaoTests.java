package com.cuidadosamente.backend;

import static org.junit.jupiter.api.Assertions.*;

import com.cuidadosamente.backend.localizacao.LocalizacaoNaoConectada;
import com.cuidadosamente.backend.localizacao.ServicoLocalizacao.Ponto;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class LocalizacaoTests {

  @Test
  void servicoDesconectadoNuncaInventaLocalizacao() {
    var servico = new LocalizacaoNaoConectada();
    assertFalse(servico.conectado());
    assertFalse(servico.coletando("teste-sintetico"));
    assertNull(servico.ultimaConhecida("teste-sintetico"));
  }

  @Test
  void recusaCoordenadasInvalidasEDataFutura() {
    assertThrows(IllegalArgumentException.class, () -> new Ponto(Double.NaN, 0, 1, Instant.now()));
    assertThrows(IllegalArgumentException.class, () -> new Ponto(91, 0, 1, Instant.now()));
    assertThrows(IllegalArgumentException.class, () -> new Ponto(0, 181, 1, Instant.now()));
    assertThrows(IllegalArgumentException.class, () -> new Ponto(0, 0, -1, Instant.now()));
    assertThrows(IllegalArgumentException.class, () ->
      new Ponto(0, 0, 1, Instant.now().plusSeconds(600))
    );
  }
}
