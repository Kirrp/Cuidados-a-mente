package com.cuidadosamente.backend;

import static org.junit.jupiter.api.Assertions.*;

import com.cuidadosamente.backend.configuracao.*;
import com.cuidadosamente.backend.controlador.*;
import com.cuidadosamente.backend.infraestrutura.*;
import com.cuidadosamente.backend.localizacao.*;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

/** Integrações reais em SQLite temporário; nenhum e-mail sai da máquina. */
class EvolucaoTests {

  @TempDir
  Path pasta;

  BancoDados banco;
  CuidadosController cuidados;
  EvolucaoController evo;
  EmailTeste email;
  String o;
  String c;
  String x;
  String oid;
  String cid;
  String p;

  static Map<String, Object> dados(Object... itens) {
    var m = new LinkedHashMap<String, Object>();
    for (int i = 0; i < itens.length; i += 2) {
      m.put(itens[i].toString(), itens[i + 1]);
    }
    return m;
  }

  static Map<String, Object> conta(String email, String tipo) {
    return dados(
      "nome",
      "Conta de teste",
      "email",
      email,
      "tipo",
      tipo,
      "senha",
      "SenhaTeste123!",
      "termsVersion",
      "2026-10-11",
      "privacyVersion",
      "2026-10-11",
      "healthConsent",
      true
    );
  }

  static String autorizacao(Map<String, Object> sessao) {
    return "Bearer " + sessao.get("token");
  }

  String usuarioId(String autorizacao) {
    return banco
      .consultar("SELECT user_id FROM sessions WHERE token=?", hash(autorizacao.substring(7)))
      .getFirst()
      .get("user_id")
      .toString();
  }

  static String hash(String s) {
    try {
      return HexFormat.of().formatHex(
        java.security.MessageDigest.getInstance("SHA-256").digest(
          s.getBytes(java.nio.charset.StandardCharsets.UTF_8)
        )
      );
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  static void negado(int codigo, Runnable r) {
    assertEquals(
      codigo,
      assertThrows(ResponseStatusException.class, r::run).getStatusCode().value()
    );
  }

  String pessoa(String autorizacao, String nome) {
    return cuidados
      .cadastrarIdoso(
        autorizacao,
        dados(
          "nome",
          nome,
          "autorizacaoTitularConfirmada",
          true,
          "representacao",
          "titular_autorizou"
        )
      )
      .get("id")
      .toString();
  }

  @BeforeEach
  void iniciar() throws Exception {
    banco = new BancoDados(pasta.resolve("test.db").toString());
    cuidados = new CuidadosController(banco, new LocalizacaoPersistida(banco));
    ReflectionTestUtils.setField(cuidados, "pastaMidia", pasta.resolve("media").toString());
    email = new EmailTeste();
    evo = new EvolucaoController(banco, cuidados, email);
    o = autorizacao(cuidados.cadastrarConta(conta("dono@teste.invalid", "responsavel")));
    c = autorizacao(cuidados.cadastrarConta(conta("cuidador@teste.invalid", "cuidador")));
    x = autorizacao(cuidados.cadastrarConta(conta("outro@teste.invalid", "responsavel")));
    oid = usuarioId(o);
    cid = usuarioId(c);
    p = pessoa(o, "Pessoa de teste");
  }

  void aceitar() {
    cuidados.vincularCuidador(o, p, dados("email", "cuidador@teste.invalid"));
    evo.responder(c, evo.convites(c).getFirst().get("id").toString(), dados("aceitar", true));
  }

  Map<String, Object> registro(String tipo) {
    return cuidados.criarRegistro(
      o,
      dados(
        "idosoId",
        p,
        "tipo",
        tipo,
        "titulo",
        "Cuidado",
        "data",
        LocalDate.now().toString(),
        "horario",
        "08:00",
        "mutationId",
        UUID.randomUUID().toString()
      )
    );
  }

  @Test
  void cadastroMinimoEConsentimento() {
    negado(400, () -> cuidados.cadastrarIdoso(o, dados("nome", "Sem autorização")));
    assertEquals(
      1,
      banco.consultar("SELECT representation FROM subject_consents WHERE idoso_id=?", p).size()
    );
    var qr = cuidados.gerarQr(o, p);
    assertNotNull(qr.get("codigo"));
    assertEquals("{}", cuidados.listarIdosos(o).getFirst().get("perfil"));
  }

  @Test
  void acessoSenhaIdosoVinculadoERevogavel() {
    var primeiroQr = cuidados.gerarQr(o, p);
    String eid = banco
      .consultar("SELECT user_id FROM elder_accounts WHERE idoso_id=?", p)
      .getFirst()
      .get("user_id")
      .toString();
    // Mesmo com uma senha conhecida, uma conta exclusiva de QR não ganha login por senha.
    banco.executar(
      "UPDATE users SET senha=(SELECT senha FROM users WHERE id=?) WHERE id=?",
      oid,
      eid
    );
    String emailTecnico = banco
      .consultar("SELECT email FROM users WHERE id=?", eid)
      .getFirst()
      .get("email")
      .toString();
    negado(400, () -> cuidados.entrar(dados("email", emailTecnico, "senha", "SenhaTeste123!")));
    negado(404, () ->
      cuidados.configurarAcessoSenha(
        x,
        p,
        dados("email", "idoso@teste.invalid", "senha", "SenhaIdoso123!")
      )
    );
    aceitar();
    negado(403, () ->
      cuidados.configurarAcessoSenha(
        c,
        p,
        dados("email", "idoso@teste.invalid", "senha", "SenhaIdoso123!")
      )
    );
    negado(409, () ->
      cuidados.configurarAcessoSenha(
        o,
        p,
        dados("email", "dono@teste.invalid", "senha", "SenhaIdoso123!")
      )
    );
    negado(400, () ->
      cuidados.configurarAcessoSenha(o, p, dados("email", "idoso@teste.invalid", "senha", "123"))
    );
    cuidados.configurarAcessoSenha(
      o,
      p,
      dados("email", "idoso@teste.invalid", "senha", "SenhaIdoso123!")
    );
    negado(401, () -> cuidados.entrarComQr(dados("codigo", primeiroQr.get("codigo"))));
    negado(401, () ->
      cuidados.entrar(dados("email", "idoso@teste.invalid", "senha", "Errada123!"))
    );
    var sessao = cuidados.entrar(dados("email", "IDOSO@TESTE.INVALID", "senha", "SenhaIdoso123!"));
    assertEquals("idoso", ((Map<?, ?>) sessao.get("usuario")).get("tipo"));
    assertEquals(false, ((Map<?, ?>) sessao.get("usuario")).get("legalAccepted"));
    String e = autorizacao(sessao);
    negado(403, () -> cuidados.listarIdosos(e));
    cuidados.aceitarTermos(
      e,
      dados("termsVersion", "2026-10-11", "privacyVersion", "2026-10-11", "healthConsent", true)
    );
    assertEquals(1, cuidados.listarIdosos(e).size());
    assertEquals(p, cuidados.listarIdosos(e).getFirst().get("id"));
    negado(403, () ->
      cuidados.criarRegistro(
        e,
        dados(
          "idosoId",
          p,
          "tipo",
          "rotinas",
          "titulo",
          "Não permitido",
          "data",
          LocalDate.now().toString()
        )
      )
    );
    assertEquals(false, cuidados.listarIdosos(e).getFirst().get("dono"));
    var qr = cuidados.gerarQr(o, p);
    String q = autorizacao(cuidados.entrarComQr(dados("codigo", qr.get("codigo"))));
    assertEquals(1, cuidados.listarIdosos(q).size());
    cuidados.revogarQr(o, p);
    negado(401, () -> cuidados.meuPerfil(e));
    negado(401, () -> cuidados.meuPerfil(q));
    negado(400, () ->
      cuidados.entrar(dados("email", "idoso@teste.invalid", "senha", "SenhaIdoso123!"))
    );
    cuidados.configurarAcessoSenha(
      o,
      p,
      dados("email", "idoso@teste.invalid", "senha", "NovaSenhaIdoso123!")
    );
    negado(401, () ->
      cuidados.entrar(dados("email", "idoso@teste.invalid", "senha", "SenhaIdoso123!"))
    );
    assertNotNull(
      cuidados
        .entrar(dados("email", "idoso@teste.invalid", "senha", "NovaSenhaIdoso123!"))
        .get("token")
    );
    banco.executar(
      "UPDATE subject_consents SET revoked_at=? WHERE idoso_id=?",
      Instant.now().toString(),
      p
    );
    negado(403, () ->
      cuidados.entrar(dados("email", "idoso@teste.invalid", "senha", "NovaSenhaIdoso123!"))
    );
  }

  @Test
  void conviteExpiracaoRetiradaEPermissoes() {
    cuidados.vincularCuidador(o, p, dados("email", "cuidador@teste.invalid"));
    negado(404, () -> cuidados.listarRegistros(c, "rotinas", p));
    var convite = evo.convites(c).getFirst();
    assertFalse(convite.containsKey("idoso_id"));
    negado(404, () -> evo.responder(x, convite.get("id").toString(), dados("aceitar", true)));
    evo.responder(c, convite.get("id").toString(), dados("aceitar", true));
    cuidados.configurarCuidador(o, p, cid, dados("permissoes", List.of("ver_rotinas")));
    negado(403, () ->
      cuidados.criarRegistro(
        c,
        dados(
          "idosoId",
          p,
          "tipo",
          "rotinas",
          "titulo",
          "Negado",
          "data",
          LocalDate.now().toString()
        )
      )
    );
    assertEquals(1, cuidados.listarIdosos(c).size());
    banco.executar("UPDATE caregiver_links SET expires_at='2000-01-01' WHERE idoso_id=?", p);
    assertTrue(cuidados.listarIdosos(c).isEmpty());
    negado(403, () -> cuidados.listarRegistros(c, "rotinas", p));
    negado(403, () -> cuidados.consultarAcesso(c, p));
    evo.revisar(o, p, cid, dados("validade", LocalDate.now().plusDays(30).toString()));
    assertEquals(1, cuidados.listarIdosos(c).size());
    evo.deixarVinculo(c, p);
    negado(404, () -> cuidados.listarRegistros(c, "rotinas", p));
  }

  @Test
  void versaoAutoriaEIdempotencia() {
    var r = registro("rotinas");
    String id = r.get("id").toString();
    var novo = new LinkedHashMap<>(r);
    novo.put("status", "concluido");
    novo.put("autor", "Pessoa falsificada");
    var fim = cuidados.atualizarRegistro(o, id, novo);
    assertEquals(2, ((Number) fim.get("versao")).intValue());
    negado(409, () -> cuidados.atualizarRegistro(o, id, novo));
    negado(428, () -> cuidados.excluirRegistroVersionado(o, id, Map.of()));
    var eventos = evo.historico(o, p, "rotinas");
    assertEquals(2, eventos.size());
    assertEquals("Conta de teste", eventos.getFirst().get("autor"));
    assertEquals("concluido", eventos.getFirst().get("acao"));
    assertFalse(eventos.getFirst().get("depois").toString().contains("Pessoa falsificada"));
    String mut = UUID.randomUUID().toString();
    var body = dados(
      "idosoId",
      p,
      "tipo",
      "rotinas",
      "titulo",
      "Única",
      "data",
      LocalDate.now().toString(),
      "mutationId",
      mut
    );
    assertEquals(
      cuidados.criarRegistro(o, body).get("id"),
      cuidados.criarRegistro(o, body).get("id")
    );
    var outroTipo = new LinkedHashMap<>(body);
    outroTipo.put("tipo", "medicamentos");
    negado(409, () -> cuidados.criarRegistro(o, outroTipo));
    String outraPessoa = pessoa(o, "Outra pessoa");
    var outroCadastro = new LinkedHashMap<>(body);
    outroCadastro.put("idosoId", outraPessoa);
    negado(409, () -> cuidados.criarRegistro(o, outroCadastro));
    assertTrue(cuidados.listarRegistros(o, "rotinas", outraPessoa).isEmpty());
    cuidados.excluirRegistroVersionado(o, id, dados("versao", 2));
    assertEquals("excluido", evo.historico(o, p, "rotinas").getFirst().get("acao"));
  }

  @Test
  void dosesDiarioContatosEExportacao() {
    aceitar();
    evo.contatos(
      o,
      p,
      dados(
        "nome",
        "Contato A",
        "telefone",
        "11999999999",
        "nomeAlternativo",
        "Contato B",
        "telefoneAlternativo",
        "11888888888"
      )
    );
    String outro = pessoa(o, "Outra pessoa");
    assertFalse(
      cuidados
        .listarIdosos(o)
        .stream()
        .filter(i -> i.get("id").equals(outro))
        .findFirst()
        .get()
        .get("contatoEmergencia")
        .toString()
        .contains("Contato A")
    );
    evo.anotar(c, p, dados("categoria", "passagem_turno", "texto", "Entrega sintética"));
    evo.anotar(c, p, dados("categoria", "correcao", "texto", "Correção sintética"));
    assertEquals(2, evo.diario(o, p).size());
    negado(404, () -> evo.diario(x, p));
    LocalDate amanha = LocalDate.now(ZoneOffset.UTC).plusDays(1);
    var plan = evo.criarPlano(
      o,
      p,
      dados(
        "titulo",
        "Plano informado",
        "inicio",
        amanha.toString(),
        "fim",
        amanha.plusDays(1).toString(),
        "horarios",
        List.of("08:00", "20:00"),
        "intervaloDias",
        1,
        "fuso",
        "America/Sao_Paulo"
      )
    );
    assertEquals(4, plan.get("doses"));
    var dose = cuidados.listarRegistros(o, "medicamentos", p).getFirst();
    assertEquals("America/Sao_Paulo", dose.get("fuso"));
    var edit = new LinkedHashMap<>(dose);
    edit.put("status", "concluido");
    cuidados.atualizarRegistro(c, dose.get("id").toString(), edit);
    evo.cancelarPlano(o, p, plan.get("id").toString());
    assertEquals(1, cuidados.listarRegistros(o, "medicamentos", p).size());
    cuidados.configurarCuidador(
      o,
      p,
      cid,
      dados("permissoes", List.of("ver_relatorios", "ver_rotinas"))
    );
    var exported = evo.exportar(c, p, amanha.toString(), amanha.plusDays(2).toString());
    assertTrue(((List<?>) exported.get("registros")).isEmpty());
    assertFalse(exported.containsKey("perfil"));
  }

  @Test
  void emailSessaoETentativas() {
    var segunda = autorizacao(
      cuidados.entrar(dados("email", "dono@teste.invalid", "senha", "SenhaTeste123!"))
    );
    evo.revogarOutras(o);
    negado(401, () -> cuidados.alterarTema(segunda, dados("tema", "claro")));
    assertFalse(evo.sessoes(o).getFirst().containsKey("token"));
    negado(404, () -> evo.revogarSessao(x, evo.sessoes(o).getFirst().get("id").toString()));
    evo.enviarVerificacao(o);
    String codigo = email.codigo;
    assertFalse(banco.consultar("SELECT token_hash FROM email_tokens").toString().contains(codigo));
    negado(400, () -> evo.confirmarEmail(x, dados("codigo", codigo)));
    assertEquals(true, evo.confirmarEmail(o, dados("codigo", codigo)).get("emailVerificado"));
    negado(400, () -> evo.confirmarEmail(o, dados("codigo", codigo)));
    evo.recuperar(dados("email", "dono@teste.invalid"));
    String reset = email.codigo;
    evo.confirmarRecuperacao(dados("codigo", reset, "senha", "NovaSenha123!"));
    negado(401, () -> cuidados.alterarTema(o, dados("tema", "claro")));
    negado(400, () -> evo.confirmarRecuperacao(dados("codigo", reset, "senha", "OutraSenha123!")));
    assertNotNull(
      cuidados.entrar(dados("email", "dono@teste.invalid", "senha", "NovaSenha123!")).get("token")
    );
    for (int i = 0; i < 10; i++) {
      negado(401, () ->
        cuidados.entrar(dados("email", "limite@teste.invalid", "senha", "Errada123!"))
      );
    }
    negado(429, () ->
      cuidados.entrar(dados("email", "limite@teste.invalid", "senha", "Errada123!"))
    );
  }

  @Test
  void gpsRevogacaoEDireitosSemNovoAceite() {
    String e = autorizacao(
      cuidados.entrarComQr(dados("codigo", cuidados.gerarQr(o, p).get("codigo")))
    );
    cuidados.aceitarTermos(
      e,
      dados("termsVersion", "2026-10-11", "privacyVersion", "2026-10-11", "healthConsent", true)
    );
    var ponto = dados(
      "latitude",
      -23.5,
      "longitude",
      -46.6,
      "precisaoMetros",
      12,
      "capturadaEm",
      Instant.now().toString(),
      "autorizacaoTitularConfirmada",
      true
    );
    negado(403, () -> evo.ponto(o, p, ponto));
    negado(403, () -> evo.ponto(e, p, ponto));
    cuidados.compartilharLocalizacao(
      o,
      p,
      dados("habilitado", true, "autorizacaoTitularConfirmada", true)
    );
    evo.ponto(e, p, ponto);
    assertNotNull(cuidados.consultarLocalizacao(o, p).get("ultimaLocalizacao"));
    evo.consentimento(e, p, dados("autorizado", false, "representacao", "titular"));
    assertTrue(cuidados.listarIdosos(o).isEmpty());
    assertTrue(banco.consultar("SELECT * FROM location_points").isEmpty());
    negado(403, () -> cuidados.listarRegistros(o, "rotinas", p));
    banco.executar("DELETE FROM legal_acceptances WHERE user_id=?", oid);
    var pedido = evo.solicitar(
      o,
      dados("categoria", "informacao", "texto", "Quero informações", "pessoaId", p)
    );
    assertNotNull(pedido.get("id"));
    assertEquals(1, ((List<?>) evo.privacidade(o).get("solicitacoes")).size());
    var ops = new OperacaoController(new FiltroOperacional(banco), banco, "segredo");
    negado(404, () -> ops.pedidos(""));
    ops.atender(
      "segredo",
      pedido.get("id").toString(),
      dados("status", "em_analise", "resposta", "Estamos verificando.")
    );
    assertEquals(
      "em_analise",
      banco.consultar("SELECT status FROM privacy_requests").getFirst().get("status")
    );
  }

  @Test
  void transferenciaEMidiaPrivada() throws Exception {
    aceitar();
    var r = registro("memorias");
    var midia = new MidiaController(banco, cuidados, pasta.resolve("media").toString());
    byte[] png = new byte[20];
    System.arraycopy(new byte[] { (byte) 137, 80, 78, 71, 13, 10, 26, 10 }, 0, png, 0, 8);
    var arquivo = midia.upload(
      o,
      p,
      new MockMultipartFile("arquivo", "teste.png", "image/png", png)
    );
    String id = arquivo.get("id").toString();
    negado(404, () -> midia.download(x, id));
    var body = new LinkedHashMap<>(r);
    body.put("categoria", "Fotos");
    body.put("midia", arquivo.get("midia"));
    cuidados.atualizarRegistro(o, r.get("id").toString(), body);
    assertTrue(Files.exists(pasta.resolve("media").resolve(id)));
    evo.transferir(o, p, dados("email", "outro@teste.invalid", "senha", "SenhaTeste123!"));
    String tid = evo.transferencias(x).getFirst().get("id").toString();
    negado(404, () ->
      evo.aceitarTransferencia(c, tid, dados("aceitar", true, "senha", "SenhaTeste123!"))
    );
    evo.aceitarTransferencia(x, tid, dados("aceitar", true, "senha", "SenhaTeste123!"));
    negado(404, () -> cuidados.listarRegistros(o, "memorias", p));
    negado(404, () -> cuidados.listarRegistros(c, "memorias", p));
    assertNotNull(midia.download(x, id).getBody());
    cuidados.excluirIdoso(x, p);
    assertFalse(Files.exists(pasta.resolve("media").resolve(id)));
    assertTrue(banco.consultar("SELECT * FROM audit_events").isEmpty());
  }

  @Test
  void atualizarRegistroNaoPodeAssociarMidiaDeOutraPessoa() throws Exception {
    String outraPessoa = pessoa(x, "Pessoa de outra conta");
    var midia = new MidiaController(banco, cuidados, pasta.resolve("media").toString());
    byte[] png = new byte[20];
    System.arraycopy(new byte[] { (byte) 137, 80, 78, 71, 13, 10, 26, 10 }, 0, png, 0, 8);
    var arquivo = midia.upload(
      x,
      outraPessoa,
      new MockMultipartFile("arquivo", "teste.png", "image/png", png)
    );
    var r = registro("memorias");
    var body = new LinkedHashMap<>(r);
    body.putAll(dados("idosoId", outraPessoa, "categoria", "Fotos", "midia", arquivo.get("midia")));
    negado(400, () -> cuidados.atualizarRegistro(o, r.get("id").toString(), body));
    assertEquals("", cuidados.listarRegistros(o, "memorias", p).getFirst().get("midia"));
    assertTrue(Files.exists(pasta.resolve("media").resolve(arquivo.get("id").toString())));
    negado(404, () -> midia.download(o, arquivo.get("id").toString()));
  }

  static class EmailTeste extends EnvioEmail {

    String codigo;

    EmailTeste() {
      super("teste", "teste@teste.invalid");
    }

    @Override
    public boolean configurado() {
      return true;
    }

    @Override
    public void enviar(String para, String assunto, String corpo) {
      codigo = corpo.substring("Seu código é: ".length()).split("\n")[0];
    }
  }
}
