package com.cuidadosamente.backend.controlador;

import com.cuidadosamente.backend.configuracao.FiltroOperacional;
import com.cuidadosamente.backend.infraestrutura.BancoDados;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Endpoints operacionais restritos ao canal administrativo, nunca às contas de cuidado. */
@RestController
@RequestMapping("/api/operacao")
public class OperacaoController {

  private final FiltroOperacional filtro;
  private final String chave;
  private final BancoDados banco;

  public OperacaoController(
    FiltroOperacional filtro,
    BancoDados banco,
    @Value("${app.ops-token:}") String chave
  ) {
    this.filtro = filtro;
    this.banco = banco;
    this.chave = chave;
  }

  private void autenticar(String recebido) {
    if (
      chave.isBlank() ||
      !MessageDigest.isEqual(
        chave.getBytes(StandardCharsets.UTF_8),
        recebido.getBytes(StandardCharsets.UTF_8)
      )
    ) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
  }

  @GetMapping("/metricas")
  public Map<String, Object> metricas(
    @RequestHeader(value = "X-Operations-Token", defaultValue = "") String recebido
  ) {
    autenticar(recebido);
    long n = filtro.requisicoes.sum();
    return Map.of(
      "requisicoes",
      n,
      "falhasServidor",
      filtro.falhas.sum(),
      "duracaoMediaMs",
      n == 0 ? 0 : filtro.tempoNanos.sum() / n / 1_000_000
    );
  }

  @GetMapping("/privacidade")
  public List<Map<String, Object>> pedidos(
    @RequestHeader(value = "X-Operations-Token", defaultValue = "") String recebido
  ) {
    autenticar(recebido);
    return banco.consultar(
      "SELECT p.id,p.subject_id AS pessoaId,p.kind AS " +
        "categoria,p.texto,p.status,p.response AS resposta,p.created_at AS " +
        "criadoEm,p.updated_at AS atualizadoEm,u.nome,u.email FROM privacy_requests " +
        "p JOIN users u ON u.id=p.user_id ORDER BY created_at LIMIT 200"
    );
  }

  @PutMapping("/privacidade/{id}")
  public synchronized Map<String, Object> atender(
    @RequestHeader(value = "X-Operations-Token", defaultValue = "") String recebido,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    autenticar(recebido);
    if (banco.consultar("SELECT 1 FROM privacy_requests WHERE id=?", id).isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    if (
      !(dados.get("status") instanceof String status) ||
      !Set.of("em_analise", "aguardando_titular", "concluido", "indeferido").contains(status) ||
      !(dados.get("resposta") instanceof String resposta) ||
      resposta.isBlank() ||
      resposta.length() > 2000
    ) {
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Informe o estado e uma resposta de até 2000 caracteres."
      );
    }
    String instante = Instant.now().toString();
    banco.executarTransacao(
      new Object[] {
        "UPDATE privacy_requests SET status=?,response=?,updated_at=? WHERE id=?",
        status,
        resposta,
        instante,
        id,
      },
      new Object[] {
        "INSERT INTO privacy_request_history(id,request_id,status,response,occurred_at) VALUES(?,?,?,?,?)",
        UUID.randomUUID().toString(),
        id,
        status,
        resposta,
        instante,
      }
    );
    return Map.of(
      "message",
      "Resposta registrada. A medida solicitada deve ser executada e verificada pelo responsável."
    );
  }
}
