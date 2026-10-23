import com.cuidadosamente.backend.controlador.CuidadosController;
import com.cuidadosamente.backend.infraestrutura.BancoDados;
import com.cuidadosamente.backend.localizacao.*;
import java.nio.file.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.web.server.ResponseStatusException;

/** Teste de integração local sem sockets; usa SQLite temporário e regras reais. */
public class TesteBackendLocal {

  static int checks = 0;

  static void check(boolean ok, String label) {
    checks++;
    if (!ok) {
      throw new AssertionError(label);
    }
  }

  static void denied(int status, Runnable action) {
    checks++;
    try {
      action.run();
      throw new AssertionError("Esperava HTTP " + status);
    } catch (ResponseStatusException e) {
      if (e.getStatusCode().value() != status) {
        throw e;
      }
    }
  }

  static Map<String, Object> data(Object... pairs) {
    var m = new LinkedHashMap<String, Object>();
    for (int i = 0; i < pairs.length; i += 2) {
      m.put(pairs[i].toString(), pairs[i + 1]);
    }
    return m;
  }

  static Map<String, Object> account(String email, String type) {
    return data(
      "nome",
      "Conta sintética de teste",
      "email",
      email,
      "senha",
      "TesteSeguro123!",
      "tipo",
      type,
      "termsVersion",
      "2026-10-11",
      "privacyVersion",
      "2026-10-11",
      "healthConsent",
      true
    );
  }

  static String token(Map<String, Object> session) {
    return "Bearer " + session.get("token");
  }

  @SuppressWarnings("unchecked")
  public static void main(String[] args) throws Exception {
    Path path = Files.createTempDirectory(Path.of(args[0]), "direto-").resolve("test.db");
    var banco = new BancoDados(path.toString());
    var cuidados = new CuidadosController(banco, new LocalizacaoNaoConectada());
    var erros = new com.cuidadosamente.backend.erros.TratadorErrosApi();
    check(
      erros
        .inesperado(
          new org.springframework.web.bind.MissingServletRequestParameterException("tipo", "String")
        )
        .getStatusCode()
        .value() == 400,
      "Parâmetro ausente mantém HTTP 400"
    );
    var metodoInvalido = erros.inesperado(
      new org.springframework.web.HttpRequestMethodNotSupportedException("PATCH", List.of("GET"))
    );
    check(
      metodoInvalido.getStatusCode().value() == 405 &&
        metodoInvalido.getHeaders().getAllow().contains(org.springframework.http.HttpMethod.GET),
      "Método inválido mantém HTTP 405 e Allow"
    );
    check(
      erros
        .inesperado(
          new org.springframework.web.servlet.resource.NoResourceFoundException(
            org.springframework.http.HttpMethod.GET,
            "inexistente",
            "/inexistente"
          )
        )
        .getStatusCode()
        .value() == 404,
      "Rota ausente mantém HTTP 404"
    );
    check(
      erros.inesperado(new IllegalStateException("segredo interno")).getStatusCode().value() == 500,
      "Falha inesperada mantém HTTP 500"
    );
    check(
      !erros
        .inesperado(new IllegalStateException("segredo interno"))
        .getBody()
        .toString()
        .contains("segredo interno"),
      "Falha inesperada oculta detalhes internos"
    );
    var evo = new com.cuidadosamente.backend.controlador.EvolucaoController(
      banco,
      cuidados,
      new com.cuidadosamente.backend.infraestrutura.EnvioEmail("", "")
    );
    var owner = cuidados.cadastrarConta(account("responsavel@teste.invalid", "responsavel"));
    var carer = cuidados.cadastrarConta(account("cuidador@teste.invalid", "cuidador"));
    var other = cuidados.cadastrarConta(account("outro@teste.invalid", "responsavel"));
    String o = token(owner);
    String c = token(carer);
    String x = token(other);
    String oid = ((Map<String, Object>) owner.get("usuario")).get("id").toString();
    String cid = ((Map<String, Object>) carer.get("usuario")).get("id").toString();
    check(((Map<String, Object>) owner.get("usuario")).get("tema").equals("claro"), "Tema padrão");
    denied(401, () -> cuidados.alterarTema(null, data("tema", "escuro")));
    denied(400, () -> cuidados.alterarTema(o, data("tema", "sistema")));
    check(
      cuidados.alterarTema(o, data("tema", "escuro")).get("tema").equals("escuro"),
      "Tema persistido adulto"
    );
    check(
      cuidados
        .alterarTema(c, data("tema", "claro", "userId", oid))
        .get("tema")
        .equals("claro"),
      "Tema próprio ignora alvo"
    );
    check(
      (
        (Map<String, Object>) cuidados
          .entrar(data("email", "responsavel@teste.invalid", "senha", "TesteSeguro123!"))
          .get("usuario")
      )
        .get("tema")
        .equals("escuro"),
      "Tema entre sessões"
    );
    var personData = data(
      "autorizacaoTitularConfirmada",
      true,
      "representacao",
      "titular_autorizou",
      "nome",
      "Pessoa sintética de teste",
      "nascimento",
      "1950-01-01",
      "rg",
      "123",
      "cpf",
      "00000000000",
      "celular",
      "11999999999",
      "cep",
      "01001000",
      "rua",
      "Rua teste",
      "bairro",
      "Teste",
      "cidade",
      "Teste",
      "estado",
      "SP",
      "numero",
      "1"
    );
    String p = cuidados.cadastrarIdoso(o, personData).get("id").toString();
    String p2 = cuidados.cadastrarIdoso(x, personData).get("id").toString();
    String cp = cuidados.cadastrarIdoso(c, personData).get("id").toString();
    // Um PUT mantém o vínculo original mesmo se o cliente adulterar idosoId.
    var memory = cuidados.criarRegistro(
      o,
      data("idosoId", p, "tipo", "memorias", "titulo", "Isolamento", "data", "2026-10-12")
    );
    String foreignMedia = UUID.randomUUID().toString();
    banco.executar(
      "INSERT INTO media_files(id,idoso_id,mime,size,created_at) VALUES(?,?,'image/png',20,?)",
      foreignMedia,
      p2,
      Instant.now().toString()
    );
    var mediaEdit = new LinkedHashMap<>(memory);
    mediaEdit.putAll(data("idosoId", p2, "categoria", "Fotos", "midia", "media:" + foreignMedia));
    denied(400, () -> cuidados.atualizarRegistro(o, memory.get("id").toString(), mediaEdit));
    check(
      cuidados.listarRegistros(o, "memorias", p).getFirst().get("midia").equals(""),
      "PUT negado preserva mídia original"
    );
    cuidados.excluirRegistro(o, memory.get("id").toString());
    // Repetir uma criação funciona, mas sua chave não pode trocar de destino/tipo.
    String mutation = UUID.randomUUID().toString();
    var mutationData = data(
      "idosoId",
      p,
      "tipo",
      "rotinas",
      "titulo",
      "Única",
      "data",
      "2026-10-12",
      "mutationId",
      mutation
    );
    var once = cuidados.criarRegistro(o, mutationData);
    check(
      once.get("id").equals(cuidados.criarRegistro(o, mutationData).get("id")),
      "Criação idempotente mantém identificador"
    );
    check(cuidados.listarRegistros(o, "rotinas", p).size() == 1, "Retry não duplica registro");
    var wrongType = new LinkedHashMap<>(mutationData);
    wrongType.put("tipo", "medicamentos");
    denied(409, () -> cuidados.criarRegistro(o, wrongType));
    var extraData = new LinkedHashMap<>(personData);
    extraData.put("nome", "ZZ Pessoa para testar isolamento");
    String extra = cuidados.cadastrarIdoso(o, extraData).get("id").toString();
    var wrongPerson = new LinkedHashMap<>(mutationData);
    wrongPerson.put("idosoId", extra);
    denied(409, () -> cuidados.criarRegistro(o, wrongPerson));
    check(
      cuidados.listarRegistros(o, "rotinas", extra).isEmpty(),
      "Retry inválido não cria em outra pessoa"
    );
    cuidados.excluirIdoso(o, extra);
    cuidados.excluirRegistro(o, once.get("id").toString());
    check(
      cuidados.listarIdosos(o).getFirst().get("podeVerLocalizacao").equals(true),
      "Responsável dono tem acesso"
    );
    check(
      cuidados.listarIdosos(c).getFirst().get("podeVerLocalizacao").equals(false),
      "Cuidador dono não ganha localização"
    );
    denied(403, () -> cuidados.consultarLocalizacao(c, cp));
    denied(404, () -> cuidados.consultarLocalizacao(x, p));
    denied(404, () -> cuidados.consultarLocalizacao(o, p2));
    denied(401, () -> cuidados.consultarLocalizacao(null, p));
    var state = cuidados.consultarLocalizacao(o, p);
    check(state.get("ultimaLocalizacao") == null, "Não inventa ponto");
    check(state.get("coletando").equals(false), "Coleta desconectada");
    check(state.get("servicoConectado").equals(false), "Serviço desconectado");
    check(state.get("compartilhando").equals(false), "Não compartilha");
    check(state.get("compartilhamentoHabilitado").equals(false), "Sharing desativado padrão");
    denied(400, () -> cuidados.compartilharLocalizacao(o, p, data("habilitado", true)));
    denied(400, () -> cuidados.compartilharLocalizacao(o, p, data("habilitado", "sim")));
    check(
      cuidados
        .compartilharLocalizacao(
          o,
          p,
          data("habilitado", true, "autorizacaoTitularConfirmada", true)
        )
        .get("compartilhando")
        .equals(false),
      "Flag não cria dados"
    );
    cuidados.vincularCuidador(o, p, data("email", "cuidador@teste.invalid"));
    denied(404, () -> cuidados.consultarLocalizacao(c, p));
    evo.responder(c, evo.convites(c).getFirst().get("id").toString(), data("aceitar", true));
    banco.executar(
      "UPDATE caregiver_links SET expires_at=? WHERE idoso_id=? AND user_id=?",
      LocalDate.now().minusDays(1).toString(),
      p,
      cid
    );
    denied(403, () -> cuidados.consultarAcesso(c, p));
    denied(403, () -> cuidados.listarRegistros(c, "rotinas", p));
    check(
      cuidados
        .listarIdosos(c)
        .stream()
        .noneMatch(person -> person.get("id").equals(p)),
      "Vínculo expirado não aparece na lista"
    );
    evo.revisar(o, p, cid, data("validade", LocalDate.now().plusDays(30).toString()));
    check(
      !((List<?>) cuidados.consultarAcesso(c, p).get("minhasPermissoes")).isEmpty(),
      "Revisão restaura vínculo e permissões"
    );
    denied(403, () -> cuidados.consultarLocalizacao(c, p));
    denied(403, () -> cuidados.autorizarLocalizacaoCuidador(c, p, cid, data("autorizado", true)));
    denied(403, () ->
      cuidados.compartilharLocalizacao(
        c,
        p,
        data("habilitado", true, "autorizacaoTitularConfirmada", true)
      )
    );
    denied(400, () -> cuidados.autorizarLocalizacaoCuidador(o, p, cid, data("autorizado", "sim")));
    denied(404, () ->
      cuidados.autorizarLocalizacaoCuidador(o, p, "nao-vinculado", data("autorizado", true))
    );
    cuidados.autorizarLocalizacaoCuidador(o, p, cid, data("autorizado", true));
    check(
      cuidados
        .listarIdosos(c)
        .stream()
        .filter(a -> a.get("id").equals(p))
        .findFirst()
        .get()
        .get("podeVerLocalizacao")
        .equals(true),
      "Grant aparece no menu"
    );
    var cs = cuidados.consultarLocalizacao(c, p);
    check(cs.get("podeGerenciar").equals(false), "Cuidador somente visualiza");
    check(((List<?>) cs.get("cuidadores")).isEmpty(), "Oculta dados de outros cuidadores");
    check(cs.get("ultimaLocalizacao") == null, "Cuidador sem coordenada inventada");
    denied(400, () ->
      cuidados.configurarCuidador(o, p, cid, data("permissoes", List.of("ver_localizacao")))
    );
    denied(400, () ->
      cuidados.configurarIdoso(o, p, data("permissoes", List.of("ver_localizacao")))
    );
    cuidados.compartilharLocalizacao(o, p, data("habilitado", false));
    // Provedor sintético usado apenas neste teste: nenhum dado entra no app entregue.
    ServicoLocalizacao fake = new ServicoLocalizacao() {
      public boolean conectado() {
        return true;
      }

      public boolean coletando(String id) {
        return true;
      }

      public Ponto ultimaConhecida(String id) {
        return new Ponto(0, 0, 10, Instant.now().minusSeconds(600));
      }
    };
    var gpsApi = new CuidadosController(banco, fake);
    check(
      gpsApi.consultarLocalizacao(o, p).get("ultimaLocalizacao") != null,
      "Owner pode ver último ponto"
    );
    check(
      gpsApi.consultarLocalizacao(c, p).get("ultimaLocalizacao") == null,
      "Sharing desligado oculta ponto"
    );
    gpsApi.compartilharLocalizacao(
      o,
      p,
      data("habilitado", true, "autorizacaoTitularConfirmada", true)
    );
    check(
      gpsApi.consultarLocalizacao(c, p).get("ultimaLocalizacao") != null,
      "Compartilhar permite ponto autorizado"
    );
    check(
      gpsApi.consultarLocalizacao(c, p).get("desatualizada").equals(true),
      "Ponto antigo sinalizado"
    );
    check(
      gpsApi.consultarLocalizacao(c, p).get("compartilhando").equals(true),
      "Compartilhando com ponto existente"
    );
    cuidados.autorizarLocalizacaoCuidador(o, p, cid, data("autorizado", false));
    denied(403, () -> cuidados.consultarLocalizacao(c, p));
    var qr = cuidados.gerarQr(o, p);
    var elder = cuidados.entrarComQr(data("codigo", qr.get("codigo")));
    String e = token(elder);
    check(
      cuidados.alterarTema(e, data("tema", "escuro")).get("tema").equals("escuro"),
      "Tema idoso independente antes aceite"
    );
    cuidados.aceitarTermos(
      e,
      data("termsVersion", "2026-10-11", "privacyVersion", "2026-10-11", "healthConsent", true)
    );
    check(
      cuidados.listarIdosos(e).getFirst().get("podeVerLocalizacao").equals(false),
      "Idoso não recebe mapa"
    );
    denied(403, () -> cuidados.consultarLocalizacao(e, p));
    denied(403, () ->
      cuidados.compartilharLocalizacao(
        e,
        p,
        data("habilitado", true, "autorizacaoTitularConfirmada", true)
      )
    );
    denied(403, () -> cuidados.autorizarLocalizacaoCuidador(e, p, cid, data("autorizado", true)));
    denied(404, () -> cuidados.consultarLocalizacao(e, p2));
    for (String kind : List.of("rotinas", "medicamentos", "consultas", "memorias")) {
      var record = cuidados.criarRegistro(
        o,
        data("idosoId", p, "tipo", kind, "titulo", "Teste " + kind, "data", "2026-10-11")
      );
      check(
        cuidados.listarRegistros(e, kind, p).size() == 1,
        "Idoso só registros próprios " + kind
      );
      denied(404, () -> cuidados.listarRegistros(x, kind, p));
      cuidados.excluirRegistro(o, record.get("id").toString());
    }
    cuidados.autorizarLocalizacaoCuidador(o, p, cid, data("autorizado", true));
    var restarted = new CuidadosController(
      new BancoDados(path.toString()),
      new LocalizacaoNaoConectada()
    );
    check(
      restarted.consultarLocalizacao(c, p).get("autorizado").equals(true),
      "Grant persiste reinício"
    );
    check(
      restarted.consultarLocalizacao(o, p).get("compartilhamentoHabilitado").equals(true),
      "Sharing persiste reinício"
    );
    check(
      restarted.alterarTema(o, data("tema", "escuro")).get("tema").equals("escuro"),
      "Tema no banco reiniciado"
    );
    cuidados.removerCuidador(o, p, cid);
    check(
      banco
        .consultar("SELECT 1 FROM location_access WHERE idoso_id=? AND user_id=?", p, cid)
        .isEmpty(),
      "Remover vínculo limpa grant"
    );
    denied(404, () -> cuidados.consultarLocalizacao(c, p));
    cuidados.excluirIdoso(o, p);
    check(
      banco.consultar("SELECT 1 FROM location_sharing WHERE idoso_id=?", p).isEmpty(),
      "Excluir idoso limpa sharing"
    );
    check(
      banco
        .consultar(
          "SELECT 1 FROM user_preferences WHERE user_id=?",
          ((Map<String, Object>) elder.get("usuario")).get("id")
        )
        .isEmpty(),
      "Excluir idoso limpa tema sua conta"
    );
    denied(401, () -> cuidados.alterarTema(e, data("tema", "claro")));
    cuidados.excluirMinhaConta(c, data("senha", "TesteSeguro123!"));
    check(
      banco.consultar("SELECT 1 FROM user_preferences WHERE user_id=?", cid).isEmpty(),
      "Excluir conta limpa tema"
    );
    denied(401, () -> cuidados.alterarTema(c, data("tema", "escuro")));
    for (Runnable invalid : List.<Runnable>of(
      () -> new ServicoLocalizacao.Ponto(Double.NaN, 0, 1, Instant.now()),
      () -> new ServicoLocalizacao.Ponto(91, 0, 1, Instant.now()),
      () -> new ServicoLocalizacao.Ponto(0, 181, 1, Instant.now()),
      () -> new ServicoLocalizacao.Ponto(0, 0, -1, Instant.now()),
      () -> new ServicoLocalizacao.Ponto(0, 0, 1, Instant.now().plusSeconds(600))
    )) {
      checks++;
      try {
        invalid.run();
        throw new AssertionError("Ponto inválido aceito");
      } catch (IllegalArgumentException expected) {}
    }
    testarRevogacaoConcorrente(Path.of(args[0]));
    System.out.println(
      "OK: " +
        checks +
        (" verificações locais de SQLite, tema, permissões, localização, isolamento, " +
          "QR, CRUD, revogação, cascatas, ponto, persistência, idempotência e " +
          "concorrência.")
    );
  }

  /** Reproduz uma captura que já passou pela autorização quando chega a revogação. */
  @SuppressWarnings("unchecked")
  static void testarRevogacaoConcorrente(Path root) throws Exception {
    var banco = new BancoCorrida(
      Files.createTempDirectory(root, "concorrencia-").resolve("test.db").toString()
    );
    var cuidados = new CuidadosController(banco, new LocalizacaoPersistida(banco));
    var evo = new com.cuidadosamente.backend.controlador.EvolucaoController(
      banco,
      cuidados,
      new com.cuidadosamente.backend.infraestrutura.EnvioEmail("", "")
    );
    String o = token(cuidados.cadastrarConta(account("corrida@teste.invalid", "responsavel")));
    String p = cuidados
      .cadastrarIdoso(
        o,
        data(
          "nome",
          "Pessoa de teste",
          "autorizacaoTitularConfirmada",
          true,
          "representacao",
          "titular_autorizou"
        )
      )
      .get("id")
      .toString();
    String e = token(cuidados.entrarComQr(data("codigo", cuidados.gerarQr(o, p).get("codigo"))));
    cuidados.aceitarTermos(
      e,
      data("termsVersion", "2026-10-11", "privacyVersion", "2026-10-11", "healthConsent", true)
    );
    try (var executor = Executors.newFixedThreadPool(2)) {
      for (String caso : List.of("compartilhamento", "consentimento", "exclusao_ponto")) {
        cuidados.compartilharLocalizacao(
          o,
          p,
          data("habilitado", true, "autorizacaoTitularConfirmada", true)
        );
        banco.preparar();
        var captura = executor.submit(() ->
          evo.ponto(
            e,
            p,
            data(
              "latitude",
              -23.5,
              "longitude",
              -46.6,
              "precisaoMetros",
              10,
              "capturadaEm",
              Instant.now().toString(),
              "autorizacaoTitularConfirmada",
              true
            )
          )
        );
        check(
          banco.validado.await(5, TimeUnit.SECONDS),
          "Captura validada antes de revogar " + caso
        );
        var revogar = executor.submit(() -> {
          try {
            switch (caso) {
              case "compartilhamento" -> cuidados.compartilharLocalizacao(
                o,
                p,
                data("habilitado", false)
              );
              case "consentimento" -> evo.consentimento(
                e,
                p,
                data("autorizado", false, "representacao", "titular")
              );
              case "exclusao_ponto" -> evo.apagarPonto(e, p);
            }
          } finally {
            banco.revogado.countDown();
          }
        });
        captura.get(10, TimeUnit.SECONDS);
        revogar.get(10, TimeUnit.SECONDS);
        check(
          banco.consultar("SELECT 1 FROM location_points WHERE idoso_id=?", p).isEmpty(),
          "Revogação concorrente não restaura ponto: " + caso
        );
        check(
          banco
            .consultar("SELECT 1 FROM location_sharing WHERE idoso_id=? AND enabled=1", p)
            .isEmpty(),
          "Revogação concorrente mantém compartilhamento desligado: " + caso
        );
        if (caso.equals("consentimento")) {
          evo.consentimento(e, p, data("autorizado", true, "representacao", "titular"));
        }
      }
    }
  }

  static class BancoCorrida extends BancoDados {

    AtomicBoolean armado = new AtomicBoolean();
    CountDownLatch validado;
    CountDownLatch revogado;

    BancoCorrida(String caminho) throws Exception {
      super(caminho);
    }

    void preparar() {
      validado = new CountDownLatch(1);
      revogado = new CountDownLatch(1);
      armado.set(true);
    }

    @Override
    public List<Map<String, Object>> consultar(String sql, Object... parametros) {
      var resultado = super.consultar(sql, parametros);
      if (
        armado != null &&
        sql.startsWith("SELECT 1 FROM location_sharing") &&
        armado.compareAndSet(true, false)
      ) {
        validado.countDown();
        try {
          revogado.await(1, TimeUnit.SECONDS);
        } catch (InterruptedException ex) {
          Thread.currentThread().interrupt();
          throw new RuntimeException(ex);
        }
      }
      return resultado;
    }
  }
}
