package com.cuidadosamente.backend.controlador;

import com.cuidadosamente.backend.infraestrutura.BancoDados;
import com.cuidadosamente.backend.infraestrutura.EnvioEmail;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

/** Fluxos de continuidade; toda autorização reutiliza a API central. */
@RestController
@RequestMapping("/api")
public class EvolucaoController {

  private final BancoDados banco;
  private final CuidadosController cuidados;
  private final EnvioEmail email;
  private final JsonMapper json = JsonMapper.builder().build();

  @Value("${app.privacy-contact:}")
  private String contatoPrivacidade = "";

  public EvolucaoController(BancoDados banco, CuidadosController cuidados, EnvioEmail email) {
    this.banco = banco;
    this.cuidados = cuidados;
    this.email = email;
  }

  @PutMapping("/auth/me/preferencias")
  public Map<String, Object> preferencias(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @RequestBody Map<String, Object> dados
  ) {
    String usuarioId = cuidados.usuarioDaSessao(autorizacao);
    double escala = numero(dados, "font_scale", 1, 1.6);
    int minutos = (int) numero(dados, "consultation_minutes", 5, 1440);
    if (
      !(dados.get("notifications") instanceof Boolean notificacoesAtivas) ||
      !(dados.get("notification_details") instanceof Boolean mostrarDetalhes)
    ) {
      throw cuidados.erroDadosInvalidos("Informe as preferências de lembretes.");
    }
    banco.executar(
      "INSERT INTO user_preferences(user_id,font_scale,notifications,notification_details,consultation_minutes) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET font_scale=excluded.font_scale,notifications=excluded.notifications,notification_details=excluded.notification_details,consultation_minutes=excluded.consultation_minutes",
      usuarioId,
      escala,
      notificacoesAtivas ? 1 : 0,
      mostrarDetalhes ? 1 : 0,
      minutos
    );
    return cuidados.buscarUsuario(usuarioId);
  }

  @GetMapping("/auth/sessoes")
  public List<Map<String, Object>> sessoes(
    @RequestHeader(value = "Authorization", required = false) String autorizacao
  ) {
    String usuarioId = cuidados.usuarioDaSessao(autorizacao);
    var linhas = banco.consultar(
      "SELECT id,created_at AS criadaEm,expires FROM sessions WHERE user_id=? AND " +
        "expires>? ORDER BY created_at DESC",
      usuarioId,
      Instant.now().getEpochSecond()
    );
    for (var linha : linhas) {
      linha.put(
        "atual",
        !banco
          .consultar(
            "SELECT 1 FROM sessions WHERE id=? AND token=?",
            linha.get("id"),
            cuidados.gerarHash(autorizacao.substring(7))
          )
          .isEmpty()
      );
    }
    return linhas;
  }

  @DeleteMapping("/auth/sessoes/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void revogarSessao(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    if (
      banco.executar(
        "DELETE FROM sessions WHERE user_id=? AND id=?",
        cuidados.usuarioDaSessao(autorizacao),
        id
      ) == 0
    ) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sessão não encontrada.");
    }
  }

  @PostMapping("/auth/sessoes/revogar-outras")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void revogarOutras(
    @RequestHeader(value = "Authorization", required = false) String autorizacao
  ) {
    banco.executar(
      "DELETE FROM sessions WHERE user_id=? AND token<>?",
      cuidados.usuarioDaSessao(autorizacao),
      cuidados.gerarHash(autorizacao.substring(7))
    );
  }

  @PostMapping("/auth/recuperacao")
  public synchronized Map<String, Object> recuperar(@RequestBody Map<String, Object> dados) {
    String destino = cuidados.validarEmail(dados);
    cuidados.limitarTentativas("recover:" + cuidados.gerarHash(destino), 3, 900);
    if (!email.configurado()) {
      throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "O serviço de e-mail ainda não foi configurado."
      );
    }
    var linhas = banco.consultar("SELECT id FROM users WHERE email=? AND tipo<>'idoso'", destino);
    if (!linhas.isEmpty()) {
      try {
        enviarToken(linhas.getFirst().get("id").toString(), destino, "recuperacao");
      } catch (RuntimeException e) {
        /* A resposta pública não revela se a conta existe nem falhas específicas de entrega. */
      }
    }
    return Map.of("message", "Se houver uma conta com esse e-mail, enviaremos as instruções.");
  }

  @PostMapping("/auth/verificacao/enviar")
  public synchronized Map<String, Object> enviarVerificacao(
    @RequestHeader(value = "Authorization", required = false) String autorizacao
  ) {
    String usuarioId = cuidados.usuarioDaSessao(autorizacao);
    var conta = cuidados.buscarUsuario(usuarioId);
    if ("idoso".equals(conta.get("tipo"))) {
      throw cuidados.erroDadosInvalidos("O acesso por QR não usa e-mail.");
    }
    cuidados.limitarTentativas("verify:" + usuarioId, 3, 900);
    if (!email.configurado()) {
      throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "O serviço de e-mail ainda não foi configurado."
      );
    }
    enviarToken(usuarioId, conta.get("email").toString(), "verificacao");
    return Map.of("message", "Enviamos um código para confirmar seu e-mail.");
  }

  private void enviarToken(String usuarioId, String destino, String kind) {
    String token = novoToken();
    banco.executarTransacao(
      new Object[] { "DELETE FROM email_tokens WHERE user_id=? AND kind=?", usuarioId, kind },
      new Object[] {
        "INSERT INTO email_tokens(token_hash,user_id,kind,expires) VALUES(?,?,?,?)",
        cuidados.gerarHash(token),
        usuarioId,
        kind,
        Instant.now().plusSeconds(1800).getEpochSecond(),
      }
    );
    try {
      email.enviar(
        destino,
        kind.equals("recuperacao") ? "Recuperação de acesso" : "Confirmação de e-mail",
        "Seu código é: " +
          token +
          ("\nEle expira em 30 minutos e funciona uma única vez. Abra o aplicativo e " +
            "cole o código. Se não solicitou, ignore esta mensagem.")
      );
    } catch (RuntimeException e) {
      banco.executar("DELETE FROM email_tokens WHERE token_hash=?", cuidados.gerarHash(token));
      throw e;
    }
  }

  @PostMapping("/auth/recuperacao/confirmar")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public synchronized void confirmarRecuperacao(@RequestBody Map<String, Object> dados) {
    String hash = cuidados.gerarHash(cuidados.campoObrigatorio(dados, "codigo", 100));
    String senha = cuidados.validarSenha(dados);
    var t = token(hash, "recuperacao");
    String usuarioId = t.get("user_id").toString();
    banco.executarTransacao(
      new Object[] {
        "UPDATE users SET senha=? WHERE id=?",
        new BCryptPasswordEncoder(12).encode(senha),
        usuarioId,
      },
      new Object[] { "DELETE FROM sessions WHERE user_id=?", usuarioId },
      new Object[] { "DELETE FROM email_tokens WHERE user_id=? AND kind='recuperacao'", usuarioId }
    );
  }

  @PostMapping("/auth/verificacao/confirmar")
  public synchronized Map<String, Object> confirmarEmail(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @RequestBody Map<String, Object> dados
  ) {
    String usuarioId = cuidados.usuarioDaSessao(autorizacao);
    String hash = cuidados.gerarHash(cuidados.campoObrigatorio(dados, "codigo", 100));
    var t = token(hash, "verificacao");
    if (!usuarioId.equals(t.get("user_id"))) {
      throw cuidados.erroDadosInvalidos("Código inválido.");
    }
    banco.executarTransacao(
      new Object[] { "UPDATE users SET email_verified=1 WHERE id=?", usuarioId },
      new Object[] { "DELETE FROM email_tokens WHERE token_hash=?", hash }
    );
    return cuidados.buscarUsuario(usuarioId);
  }

  private Map<String, Object> token(String hash, String kind) {
    var t = banco.consultar(
      "SELECT user_id FROM email_tokens WHERE token_hash=? AND kind=? AND expires>?",
      hash,
      kind,
      Instant.now().getEpochSecond()
    );
    if (t.isEmpty()) {
      throw cuidados.erroDadosInvalidos("Código inválido, expirado ou já utilizado.");
    }
    return t.getFirst();
  }

  @GetMapping("/convites")
  public List<Map<String, Object>> convites(
    @RequestHeader(value = "Authorization", required = false) String autorizacao
  ) {
    return banco.consultar(
      "SELECT c.id,u.nome AS convidadoPor,c.expires FROM caregiver_invitations c " +
        "JOIN users u ON u.id=c.invited_by WHERE c.user_id=? AND c.expires>?",
      cuidados.usuarioAutorizado(autorizacao),
      Instant.now().getEpochSecond()
    );
  }

  @PostMapping("/convites/{id}/responder")
  public synchronized Map<String, Object> responder(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    synchronized (cuidados) {
      String usuarioId = cuidados.usuarioAutorizado(autorizacao);
      var linhas = banco.consultar(
        "SELECT * FROM caregiver_invitations WHERE id=? AND user_id=? AND expires>?",
        id,
        usuarioId,
        Instant.now().getEpochSecond()
      );
      if (linhas.isEmpty()) {
        throw new ResponseStatusException(
          HttpStatus.NOT_FOUND,
          "Convite expirado ou indisponível."
        );
      }
      var c = linhas.getFirst();
      String pessoa = c.get("idoso_id").toString();
      if (!(dados.get("aceitar") instanceof Boolean aceitar)) {
        throw cuidados.erroDadosInvalidos("Responda ao convite.");
      }
      if (aceitar) {
        if (!cuidados.donoDosDados(pessoa).equals(c.get("invited_by"))) {
          throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "A administração mudou. Peça um novo convite."
          );
        }
        var comandos = new ArrayList<Object[]>();
        comandos.add(new Object[] {
          "INSERT INTO caregiver_links(idoso_id,user_id,expires_at,reviewed_at) VALUES(?,?,?,?)",
          pessoa,
          usuarioId,
          LocalDate.now().plusDays(90).toString(),
          Instant.now().toString(),
        });
        comandos.add(new Object[] {
          "INSERT INTO access_policies(idoso_id,user_id) VALUES(?,?)",
          pessoa,
          usuarioId,
        });
        for (String grant : cuidados.permissoesPadraoCuidador()) {
          comandos.add(new Object[] {
            "INSERT INTO access_grants(idoso_id,user_id,permission) VALUES(?,?,?)",
            pessoa,
            usuarioId,
            grant,
          });
        }
        comandos.add(
          cuidados.evento(
            pessoa,
            usuarioId,
            "acesso",
            id,
            "convite_aceito",
            Map.of(),
            Map.of("validade", LocalDate.now().plusDays(90).toString())
          )
        );
        comandos.add(new Object[] { "DELETE FROM caregiver_invitations WHERE id=?", id });
        banco.executarTransacao(comandos.toArray(new Object[0][]));
      } else {
        banco.executar("DELETE FROM caregiver_invitations WHERE id=?", id);
      }
      return Map.of("message", aceitar ? "Vínculo confirmado." : "Convite recusado.");
    }
  }

  @DeleteMapping("/idosos/{id}/meu-vinculo")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public synchronized void deixarVinculo(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    String usuarioId = cuidados.usuarioAutorizado(autorizacao);
    if (
      banco
        .consultar("SELECT 1 FROM caregiver_links WHERE idoso_id=? AND user_id=?", id, usuarioId)
        .isEmpty()
    ) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vínculo indisponível.");
    }
    removerVinculo(id, usuarioId, usuarioId);
  }

  void removerVinculo(String pessoa, String alvo, String autor) {
    banco.executarTransacao(
      new Object[] { "DELETE FROM location_access WHERE idoso_id=? AND user_id=?", pessoa, alvo },
      new Object[] { "DELETE FROM access_grants WHERE idoso_id=? AND user_id=?", pessoa, alvo },
      new Object[] { "DELETE FROM access_policies WHERE idoso_id=? AND user_id=?", pessoa, alvo },
      new Object[] { "DELETE FROM caregiver_links WHERE idoso_id=? AND user_id=?", pessoa, alvo },
      cuidados.evento(pessoa, autor, "acesso", alvo, "vinculo_removido", Map.of(), Map.of())
    );
  }

  @PutMapping("/idosos/{id}/cuidadores/{alvo}/revisao")
  public synchronized Map<String, Object> revisar(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @PathVariable String alvo,
    @RequestBody Map<String, Object> dados
  ) {
    String usuarioId = cuidados.usuarioAutorizado(autorizacao);
    cuidados.exigirDonoResponsavel(id, usuarioId);
    String validade = cuidados.campoObrigatorio(dados, "validade", 10);
    cuidados.validarData(validade);
    if (
      !LocalDate.parse(validade).isAfter(LocalDate.now()) ||
      LocalDate.parse(validade).isAfter(LocalDate.now().plusDays(365))
    ) {
      throw cuidados.erroDadosInvalidos("Escolha uma validade de até um ano.");
    }
    if (
      banco
        .consultar("SELECT 1 FROM caregiver_links WHERE idoso_id=? AND user_id=?", id, alvo)
        .isEmpty()
    ) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuidador não vinculado.");
    }
    banco.executarTransacao(
      new Object[] {
        "UPDATE caregiver_links SET expires_at=?,reviewed_at=? WHERE idoso_id=? AND user_id=?",
        validade,
        Instant.now().toString(),
        id,
        alvo,
      },
      cuidados.evento(
        id,
        usuarioId,
        "acesso",
        alvo,
        "acesso_revisado",
        Map.of(),
        Map.of("validade", validade)
      )
    );
    return cuidados.consultarAcesso(autorizacao, id);
  }

  @PostMapping("/idosos/{id}/transferencia")
  public synchronized Map<String, Object> transferir(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    String usuarioId = cuidados.exigirAdulto(autorizacao);
    cuidados.exigirDono(id, usuarioId);
    cuidados.confirmarSenha(usuarioId, dados);
    var contas = banco.consultar(
      "SELECT id FROM users WHERE email=? AND tipo='responsavel'",
      cuidados.validarEmail(dados)
    );
    if (contas.isEmpty()) {
      throw cuidados.erroDadosInvalidos("O destinatário precisa ter uma conta de responsável.");
    }
    String target = contas.getFirst().get("id").toString();
    if (target.equals(usuarioId)) {
      throw cuidados.erroDadosInvalidos("Escolha outro responsável.");
    }
    banco.executar(
      "INSERT INTO ownership_transfers(id,idoso_id,source_id,target_id,expires) " +
        "VALUES(?,?,?,?,?) ON CONFLICT(idoso_id) DO UPDATE SET " +
        "id=excluded.id,source_id=excluded.source_id,target_id=excluded.target_id,expires=excluded.expires",
      UUID.randomUUID().toString(),
      id,
      usuarioId,
      target,
      Instant.now().plusSeconds(86400).getEpochSecond()
    );
    return Map.of("message", "Transferência pendente de confirmação do destinatário.");
  }

  @GetMapping("/transferencias")
  public List<Map<String, Object>> transferencias(
    @RequestHeader(value = "Authorization", required = false) String autorizacao
  ) {
    return banco.consultar(
      "SELECT t.id,u.nome AS enviadoPor,t.expires FROM ownership_transfers t JOIN " +
        "users u ON u.id=t.source_id WHERE t.target_id=? AND t.expires>?",
      cuidados.usuarioAutorizado(autorizacao),
      Instant.now().getEpochSecond()
    );
  }

  @PostMapping("/transferencias/{id}/responder")
  public synchronized Map<String, Object> aceitarTransferencia(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    synchronized (cuidados) {
      String usuarioId = cuidados.usuarioAutorizado(autorizacao);
      var linhas = banco.consultar(
        "SELECT * FROM ownership_transfers WHERE id=? AND target_id=? AND expires>?",
        id,
        usuarioId,
        Instant.now().getEpochSecond()
      );
      if (linhas.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Transferência indisponível.");
      }
      if (!(dados.get("aceitar") instanceof Boolean aceitar)) {
        throw cuidados.erroDadosInvalidos("Confirme a transferência.");
      }
      var t = linhas.getFirst();
      String pessoa = t.get("idoso_id").toString();
      String administradorAnterior = t.get("source_id").toString();
      if (!aceitar) {
        banco.executar("DELETE FROM ownership_transfers WHERE id=?", id);
        return Map.of("message", "Transferência recusada.");
      }
      cuidados.confirmarSenha(usuarioId, dados);
      if (!administradorAnterior.equals(cuidados.donoDosDados(pessoa))) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "A administração já mudou.");
      }
      banco.executarTransacao(
        new Object[] {
          "UPDATE idosos SET owner_id=? WHERE id=? AND owner_id=?",
          usuarioId,
          pessoa,
          administradorAnterior,
        },
        new Object[] {
          "UPDATE registros SET owner_id=?,versao=versao+1 WHERE idoso_id=?",
          usuarioId,
          pessoa,
        },
        new Object[] { "DELETE FROM caregiver_invitations WHERE idoso_id=?", pessoa },
        new Object[] { "DELETE FROM access_grants WHERE idoso_id=?", pessoa },
        new Object[] { "DELETE FROM access_policies WHERE idoso_id=?", pessoa },
        new Object[] { "DELETE FROM caregiver_links WHERE idoso_id=?", pessoa },
        new Object[] { "DELETE FROM location_access WHERE idoso_id=?", pessoa },
        new Object[] { "DELETE FROM location_points WHERE idoso_id=?", pessoa },
        new Object[] { "DELETE FROM location_sharing WHERE idoso_id=?", pessoa },
        new Object[] { "DELETE FROM qr_access WHERE idoso_id=?", pessoa },
        new Object[] {
          "DELETE FROM sessions WHERE user_id IN (SELECT user_id FROM elder_accounts WHERE idoso_id=?)",
          pessoa,
        },
        new Object[] {
          "UPDATE users SET password_login_enabled=0 WHERE id IN (SELECT user_id FROM " +
            "elder_accounts WHERE idoso_id=?)",
          pessoa,
        },
        new Object[] { "DELETE FROM ownership_transfers WHERE id=?", id },
        cuidados.evento(
          pessoa,
          usuarioId,
          "acesso",
          id,
          "administracao_transferida",
          Map.of("administrador", administradorAnterior),
          Map.of("administrador", usuarioId)
        )
      );
      return Map.of(
        "message",
        "Administração transferida. Revise os acessos e a autorização do titular."
      );
    }
  }

  @PutMapping("/idosos/{id}/contatos")
  public synchronized Map<String, Object> contatos(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    String usuarioId = cuidados.usuarioAutorizado(autorizacao);
    cuidados.exigirPermissao(id, usuarioId, "editar_perfil_idoso");
    String nome = cuidados.campoObrigatorio(dados, "nome", 150);
    String tel = telefone(dados, "telefone");
    String alt = cuidados.campoOpcional(dados, "nomeAlternativo", 150);
    String telAlt = cuidados.campoOpcional(dados, "telefoneAlternativo", 30);
    if (!alt.isEmpty() || !telAlt.isEmpty()) {
      if (alt.isEmpty()) {
        throw cuidados.erroDadosInvalidos("Informe o nome alternativo.");
      }
      telAlt = telefone(dados, "telefoneAlternativo");
    }
    var novo = Map.<String, Object>of(
      "nome",
      nome,
      "telefone",
      tel,
      "nomeAlternativo",
      alt,
      "telefoneAlternativo",
      telAlt
    );
    banco.executarTransacao(
      new Object[] {
        "INSERT INTO emergency_contacts(idoso_id,nome,telefone,nome_alternativo,telefone_alternativo) VALUES(?,?,?,?,?) ON CONFLICT(idoso_id) DO UPDATE SET nome=excluded.nome,telefone=excluded.telefone,nome_alternativo=excluded.nome_alternativo,telefone_alternativo=excluded.telefone_alternativo",
        id,
        nome,
        tel,
        alt,
        telAlt,
      },
      cuidados.evento(
        id,
        usuarioId,
        "contato",
        id,
        "contatos_atualizados",
        cuidados.contatoEmergencia(id),
        novo
      )
    );
    return novo;
  }

  private String telefone(Map<String, Object> dados, String campo) {
    String tel = cuidados.campoObrigatorio(dados, campo, 30);
    if (!tel.matches("[+()0-9 .-]+") || tel.replaceAll("\\D", "").length() < 8) {
      throw cuidados.erroDadosInvalidos("Informe um telefone válido.");
    }
    return tel;
  }

  @GetMapping("/idosos/{id}/historico")
  public List<Map<String, Object>> historico(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestParam(defaultValue = "") String tipo
  ) {
    String usuarioId = cuidados.usuarioAutorizado(autorizacao);
    cuidados.validarAcessoIdoso(id, usuarioId);
    if (Set.of("consultas", "medicamentos", "rotinas", "memorias").contains(tipo)) {
      cuidados.exigirPermissao(id, usuarioId, "ver_" + tipo);
    } else if (tipo.equals("diario")) {
      cuidados.exigirPermissao(id, usuarioId, "ver_rotinas");
    } else if (tipo.equals("contato")) {
      cuidados.exigirPermissao(id, usuarioId, "ver_contato_emergencia");
    } else {
      cuidados.exigirDono(id, usuarioId);
    }
    return banco.consultar(
      "SELECT id,actor_name AS autor,tipo,entity_id AS entidade,action AS " +
        "acao,occurred_at AS instante,before_json AS antes,after_json AS depois FROM " +
        "audit_events WHERE idoso_id=? AND (?='' OR tipo=?) ORDER BY occurred_at " +
        "DESC LIMIT 300",
      id,
      tipo,
      tipo
    );
  }

  @GetMapping("/idosos/{id}/diario")
  public List<Map<String, Object>> diario(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    cuidados.exigirPermissao(id, cuidados.exigirAdulto(autorizacao), "ver_rotinas");
    return banco.consultar(
      "SELECT id,actor_name AS autor,kind AS categoria,texto,occurred_at AS " +
        "instante FROM care_notes WHERE idoso_id=? ORDER BY occurred_at DESC LIMIT " +
        "200",
      id
    );
  }

  @PostMapping("/idosos/{id}/diario")
  public synchronized Map<String, Object> anotar(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    String usuarioId = cuidados.exigirAdulto(autorizacao);
    cuidados.exigirPermissao(id, usuarioId, "criar_rotinas");
    String kind = cuidados.campoObrigatorio(dados, "categoria", 30);
    String texto = cuidados.campoObrigatorio(dados, "texto", 4000);
    String nid = UUID.randomUUID().toString();
    if (!Set.of("observacao", "passagem_turno", "correcao").contains(kind)) {
      throw cuidados.erroDadosInvalidos("Categoria inválida.");
    }
    banco.executarTransacao(
      new Object[] {
        "INSERT INTO care_notes(id,idoso_id,actor_id,actor_name,kind,texto,occurred_at) VALUES(?,?,?,?,?,?,?)",
        nid,
        id,
        usuarioId,
        cuidados.buscarUsuario(usuarioId).get("nome"),
        kind,
        texto,
        Instant.now().toString(),
      },
      cuidados.evento(
        id,
        usuarioId,
        "diario",
        nid,
        "anotacao_criada",
        Map.of(),
        Map.of("categoria", kind, "texto", texto)
      )
    );
    return Map.of("message", "Anotação registrada. Para corrigir, acrescente uma nova anotação.");
  }

  @GetMapping("/idosos/{id}/planos")
  public List<Map<String, Object>> planos(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    cuidados.exigirPermissao(id, cuidados.usuarioAutorizado(autorizacao), "ver_medicamentos");
    return banco.consultar(
      "SELECT id,titulo,start_date AS inicio,end_date AS fim,times AS " +
        "horarios,interval_days AS intervaloDias,timezone AS fuso,active AS ativo " +
        "FROM dose_plans WHERE idoso_id=? ORDER BY start_date DESC",
      id
    );
  }

  @PostMapping("/idosos/{id}/planos")
  public synchronized Map<String, Object> criarPlano(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    synchronized (cuidados) {
      String usuarioId = cuidados.exigirAdulto(autorizacao);
      cuidados.exigirPermissao(id, usuarioId, "criar_medicamentos");
      String titulo = cuidados.campoObrigatorio(dados, "titulo", 200);
      String inicio = cuidados.campoObrigatorio(dados, "inicio", 10);
      String fim = cuidados.campoObrigatorio(dados, "fim", 10);
      String fuso = cuidados.campoObrigatorio(dados, "fuso", 80);
      String detalhes = cuidados.campoOpcional(dados, "detalhes", 4000);
      cuidados.validarData(inicio);
      cuidados.validarData(fim);
      try {
        ZoneId.of(fuso);
      } catch (Exception e) {
        throw cuidados.erroDadosInvalidos("Fuso inválido.");
      }
      LocalDate dataInicial = LocalDate.parse(inicio);
      LocalDate dataFinal = LocalDate.parse(fim);
      if (
        dataInicial.isBefore(LocalDate.now(ZoneId.of(fuso))) ||
        dataFinal.isBefore(dataInicial) ||
        ChronoUnit.DAYS.between(dataInicial, dataFinal) > 365
      ) {
        throw cuidados.erroDadosInvalidos(
          "O plano deve começar hoje ou depois e durar até um ano."
        );
      }
      double informado = numero(dados, "intervaloDias", 1, 30);
      if (informado != Math.floor(informado)) {
        throw cuidados.erroDadosInvalidos("O intervalo deve ser um número inteiro de dias.");
      }
      int intervalo = (int) informado;
      if (!(dados.get("horarios") instanceof List<?> raw) || raw.isEmpty() || raw.size() > 8) {
        throw cuidados.erroDadosInvalidos("Informe entre um e oito horários.");
      }
      var horarios = new TreeSet<String>();
      for (Object h : raw) {
        if (!(h instanceof String hora) || hora.isBlank()) {
          throw cuidados.erroDadosInvalidos("Horário inválido.");
        }
        cuidados.validarHorario(hora);
        horarios.add(hora);
      }
      if (
        (ChronoUnit.DAYS.between(dataInicial, dataFinal) / intervalo + 1) * horarios.size() > 730
      ) {
        throw cuidados.erroDadosInvalidos("Reduza o período para até 730 doses.");
      }
      String planoId = UUID.randomUUID().toString();
      var comandos = new ArrayList<Object[]>();
      comandos.add(new Object[] {
        "INSERT INTO dose_plans(id,idoso_id,actor_id,titulo,start_date,end_date,times,interval_days,timezone) VALUES(?,?,?,?,?,?,?,?,?)",
        planoId,
        id,
        usuarioId,
        titulo,
        inicio,
        fim,
        json.writeValueAsString(horarios),
        intervalo,
        fuso,
      });
      int doses = 0;
      for (LocalDate dia = dataInicial; !dia.isAfter(dataFinal); dia = dia.plusDays(intervalo)) {
        for (String hora : horarios) {
          String registroId = UUID.randomUUID().toString();
          doses++;
          comandos.add(new Object[] {
            "INSERT INTO registros(id,owner_id,idoso_id,tipo,titulo,data,horario,detalhes,status,plano_id,fuso) VALUES(?,?,?,'medicamentos',?,?,?,?, 'pendente',?,?)",
            registroId,
            cuidados.donoDosDados(id),
            id,
            titulo,
            dia.toString(),
            hora,
            detalhes,
            planoId,
            fuso,
          });
          comandos.add(
            cuidados.evento(
              id,
              usuarioId,
              "medicamentos",
              registroId,
              "dose_programada",
              Map.of(),
              Map.of("plano", planoId, "titulo", titulo, "data", dia.toString(), "horario", hora)
            )
          );
        }
      }
      banco.executarTransacao(comandos.toArray(new Object[0][]));
      return Map.of("id", planoId, "doses", doses);
    }
  }

  @PostMapping("/idosos/{id}/planos/{plano}/cancelar")
  public synchronized Map<String, Object> cancelarPlano(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @PathVariable String plano
  ) {
    synchronized (cuidados) {
      String usuarioId = cuidados.exigirAdulto(autorizacao);
      cuidados.exigirPermissao(id, usuarioId, "excluir_medicamentos");
      var linhas = banco.consultar(
        "SELECT * FROM dose_plans WHERE id=? AND idoso_id=? AND active=1",
        plano,
        id
      );
      if (linhas.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Plano ativo não encontrado.");
      }
      ZonedDateTime agora = ZonedDateTime.now(
        ZoneId.of(linhas.getFirst().get("timezone").toString())
      );
      var comandos = new ArrayList<Object[]>();
      for (var dose : banco.consultar(
        "SELECT id,data,horario FROM registros WHERE plano_id=? AND idoso_id=? AND " +
          "status='pendente' AND (data>? OR (data=? AND horario>?))",
        plano,
        id,
        agora.toLocalDate().toString(),
        agora.toLocalDate().toString(),
        agora.toLocalTime().toString().substring(0, 5)
      )) {
        comandos.add(new Object[] { "DELETE FROM registros WHERE id=?", dose.get("id") });
        comandos.add(
          cuidados.evento(
            id,
            usuarioId,
            "medicamentos",
            dose.get("id").toString(),
            "dose_cancelada",
            dose,
            Map.of("plano", plano)
          )
        );
      }
      comandos.add(new Object[] { "UPDATE dose_plans SET active=0 WHERE id=?", plano });
      banco.executarTransacao(comandos.toArray(new Object[0][]));
      return Map.of("message", "Plano cancelado. Doses passadas e concluídas foram preservadas.");
    }
  }

  @GetMapping("/idosos/{id}/exportacao")
  public Map<String, Object> exportar(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestParam String inicio,
    @RequestParam String fim
  ) {
    String usuarioId = cuidados.usuarioAutorizado(autorizacao);
    cuidados.exigirPermissao(id, usuarioId, "ver_relatorios");
    cuidados.validarData(inicio);
    cuidados.validarData(fim);
    if (
      fim.compareTo(inicio) < 0 ||
      ChronoUnit.DAYS.between(LocalDate.parse(inicio), LocalDate.parse(fim)) > 366
    ) {
      throw cuidados.erroDadosInvalidos("Escolha um período de até um ano.");
    }
    var registros = new ArrayList<Map<String, Object>>();
    for (String tipo : List.of("consultas", "medicamentos", "rotinas"))
      if (cuidados.permissoesEfetivas(id, usuarioId).contains("ver_" + tipo)) {
        registros.addAll(
          banco.consultar(
            "SELECT tipo,titulo,data,horario,detalhes,status FROM registros WHERE " +
              "idoso_id=? AND tipo=? AND data BETWEEN ? AND ? ORDER BY data,horario",
            id,
            tipo,
            inicio,
            fim
          )
        );
      }
    return Map.of(
      "nome",
      banco.consultar("SELECT nome FROM idosos WHERE id=?", id).getFirst().get("nome"),
      "inicio",
      inicio,
      "fim",
      fim,
      "geradoEm",
      Instant.now().toString(),
      "registros",
      registros
    );
  }

  @GetMapping("/privacidade")
  public Map<String, Object> privacidade(
    @RequestHeader(value = "Authorization", required = false) String autorizacao
  ) {
    String usuarioId = cuidados.usuarioDaSessao(autorizacao);
    var pessoas = banco.consultar(
      "SELECT id,nome FROM idosos WHERE owner_id=? OR id IN (SELECT idoso_id FROM " +
        "elder_accounts WHERE user_id=?)",
      usuarioId,
      usuarioId
    );
    for (var p : pessoas) {
      var consent = banco.consultar(
        "SELECT representation AS representacao,accepted_at AS aceitoEm,revoked_at " +
          "AS revogadoEm FROM subject_consents WHERE idoso_id=?",
        p.get("id")
      );
      p.put("consentimento", consent.isEmpty() ? Map.of() : consent.getFirst());
    }
    return Map.of(
      "contato",
      contatoPrivacidade,
      "pessoas",
      pessoas,
      "solicitacoes",
      banco.consultar(
        "SELECT id,subject_id AS pessoaId,kind AS categoria,texto,status,response AS " +
          "resposta,updated_at AS atualizadoEm,created_at AS criadoEm FROM " +
          "privacy_requests WHERE user_id=? ORDER BY created_at DESC",
        usuarioId
      )
    );
  }

  @PostMapping("/privacidade/solicitacoes")
  public Map<String, Object> solicitar(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @RequestBody Map<String, Object> dados
  ) {
    String usuarioId = cuidados.usuarioDaSessao(autorizacao);
    String pessoa = cuidados.campoOpcional(dados, "pessoaId", 80);
    String kind = cuidados.campoObrigatorio(dados, "categoria", 30);
    String texto = cuidados.campoObrigatorio(dados, "texto", 2000);
    if (!Set.of("acesso", "correcao", "exclusao", "revogacao", "informacao").contains(kind)) {
      throw cuidados.erroDadosInvalidos("Pedido inválido.");
    }
    if (!pessoa.isEmpty()) {
      exigirTitularOuRepresentante(pessoa, usuarioId);
    }
    String id = UUID.randomUUID().toString();
    banco.executar(
      "INSERT INTO privacy_requests(id,user_id,subject_id,kind,texto,created_at) VALUES(?,?,?,?,?,?)",
      id,
      usuarioId,
      pessoa,
      kind,
      texto,
      Instant.now().toString()
    );
    return Map.of(
      "id",
      id,
      "message",
      "Pedido registrado. Acompanhe o protocolo e procure o canal responsável."
    );
  }

  @PutMapping("/privacidade/pessoas/{id}/consentimento")
  public synchronized Map<String, Object> consentimento(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    synchronized (cuidados) {
      String usuarioId = cuidados.usuarioDaSessao(autorizacao);
      exigirTitularOuRepresentante(id, usuarioId);
      if (!(dados.get("autorizado") instanceof Boolean permitido)) {
        throw cuidados.erroDadosInvalidos("Informe sua escolha.");
      }
      String papel = cuidados.campoObrigatorio(dados, "representacao", 60);
      boolean proprio = !banco
        .consultar("SELECT 1 FROM elder_accounts WHERE idoso_id=? AND user_id=?", id, usuarioId)
        .isEmpty();
      if (
        permitido &&
        !(proprio
          ? papel.equals("titular")
          : Set.of("titular_autorizou", "representante_legal").contains(papel))
      ) {
        throw cuidados.erroDadosInvalidos(
          "O cadastro exige autorização do titular ou representação válida."
        );
      }
      var comandos = new ArrayList<Object[]>();
      comandos.add(new Object[] {
        "INSERT INTO subject_consents(idoso_id,actor_id,representation,accepted_at,revoked_at) VALUES(?,?,?,?,?) ON CONFLICT(idoso_id) DO UPDATE SET actor_id=excluded.actor_id,representation=excluded.representation,accepted_at=excluded.accepted_at,revoked_at=excluded.revoked_at",
        id,
        usuarioId,
        papel,
        permitido ? Instant.now().toString() : "",
        permitido ? "" : Instant.now().toString(),
      });
      if (!permitido) {
        comandos.add(new Object[] { "DELETE FROM location_points WHERE idoso_id=?", id });
        comandos.add(new Object[] { "DELETE FROM location_sharing WHERE idoso_id=?", id });
        comandos.add(new Object[] { "DELETE FROM qr_access WHERE idoso_id=?", id });
      }
      comandos.add(
        cuidados.evento(
          id,
          usuarioId,
          "acesso",
          id,
          permitido ? "consentimento_registrado" : "consentimento_revogado",
          Map.of(),
          Map.of("representacao", papel)
        )
      );
      banco.executarTransacao(comandos.toArray(new Object[0][]));
      return Map.of(
        "message",
        permitido
          ? "Declaração registrada. A representação precisa ser verificada pelo responsável pelos dados."
          : "Consentimento revogado. O acesso ao cuidado e à localização foi interrompido."
      );
    }
  }

  private void exigirTitularOuRepresentante(String id, String usuarioId) {
    if (
      banco
        .consultar(
          "SELECT 1 FROM idosos WHERE id=? AND (owner_id=? OR id IN (SELECT idoso_id " +
            "FROM elder_accounts WHERE user_id=?))",
          id,
          usuarioId,
          usuarioId
        )
        .isEmpty()
    ) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pessoa indisponível.");
    }
  }

  @PostMapping("/idosos/{id}/localizacao/ponto")
  public Map<String, Object> ponto(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    // A checagem e a gravação compartilham o bloqueio usado ao desligar
    // localização e revogar consentimento, evitando restaurar um ponto.
    synchronized (cuidados) {
      String usuarioId = cuidados.usuarioAutorizado(autorizacao);
      if (
        banco
          .consultar("SELECT 1 FROM elder_accounts WHERE idoso_id=? AND user_id=?", id, usuarioId)
          .isEmpty()
      ) {
        throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "A posição deve vir do aparelho vinculado à pessoa idosa."
        );
      }
      cuidados.validarAcessoIdoso(id, usuarioId);
      if (
        banco
          .consultar("SELECT 1 FROM location_sharing WHERE idoso_id=? AND enabled=1", id)
          .isEmpty()
      ) {
        throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "O compartilhamento está desligado."
        );
      }
      if (!Boolean.TRUE.equals(dados.get("autorizacaoTitularConfirmada"))) {
        throw cuidados.erroDadosInvalidos("A captura exige sua autorização explícita.");
      }
      double lat = numero(dados, "latitude", -90, 90);
      double lon = numero(dados, "longitude", -180, 180);
      double acc = numero(dados, "precisaoMetros", 0, 10000);
      Instant instante;
      try {
        instante = Instant.parse(cuidados.campoObrigatorio(dados, "capturadaEm", 40));
      } catch (Exception e) {
        throw cuidados.erroDadosInvalidos("Instante inválido.");
      }
      if (
        instante.isAfter(Instant.now().plusSeconds(30)) ||
        instante.isBefore(Instant.now().minusSeconds(300))
      ) {
        throw cuidados.erroDadosInvalidos("Capture uma posição atual.");
      }
      banco.executar(
        "INSERT INTO location_points(idoso_id,latitude,longitude,accuracy,recorded_at) VALUES(?,?,?,?,?) ON CONFLICT(idoso_id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,accuracy=excluded.accuracy,recorded_at=excluded.recorded_at WHERE excluded.recorded_at>location_points.recorded_at",
        id,
        lat,
        lon,
        acc,
        instante.toString()
      );
      return Map.of("message", "Última posição atualizada. Não há coleta em segundo plano.");
    }
  }

  @DeleteMapping("/idosos/{id}/localizacao/ponto")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void apagarPonto(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    synchronized (cuidados) {
      String usuarioId = cuidados.usuarioDaSessao(autorizacao);
      exigirTitularOuRepresentante(id, usuarioId);
      banco.executarTransacao(
        new Object[] { "DELETE FROM location_points WHERE idoso_id=?", id },
        new Object[] { "DELETE FROM location_sharing WHERE idoso_id=?", id }
      );
    }
  }

  private double numero(Map<String, Object> dados, String key, double min, double max) {
    if (
      !(dados.get(key) instanceof Number n) ||
      !Double.isFinite(n.doubleValue()) ||
      n.doubleValue() < min ||
      n.doubleValue() > max
    ) {
      throw cuidados.erroDadosInvalidos("Valor inválido: " + key);
    }
    return n.doubleValue();
  }

  private String novoToken() {
    byte[] bytes = new byte[32];
    new java.security.SecureRandom().nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}
