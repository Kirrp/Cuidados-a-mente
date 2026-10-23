package com.cuidadosamente.backend.controlador;

import com.cuidadosamente.backend.infraestrutura.BancoDados;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Controlador principal da API REST.
 *
 * O fluxo de cada método público é: receber dados HTTP, autenticar/autorizar,
 * validar campos, acessar o SQLite e devolver um objeto que o Spring converte
 * para JSON. Os métodos privados concentram regras repetidas para que nenhum
 * endpoint esqueça validação de sessão, propriedade ou formato.
 */
@RestController
@RequestMapping("/api")
public class CuidadosController {

  // Lista fechada usada na validação dos endpoints de registros.
  private static final Set<String> TIPOS = Set.of(
    "consultas",
    "medicamentos",
    "rotinas",
    "memorias"
  );
  private static final List<String> ACOES = List.of(
    "ver",
    "criar",
    "editar",
    "concluir",
    "excluir"
  );
  private static final Set<String> PERMISSOES = criarCatalogoPermissoes();
  private static final Set<String> PERMISSOES_IDOSO = permissoesPermitidasIdoso();

  private static Set<String> permissoesPermitidasIdoso() {
    Set<String> permitidas = new HashSet<>(PERMISSOES);
    permitidas.removeAll(
      Set.of(
        "editar_perfil_idoso",
        "gerar_qr",
        "revogar_qr",
        "gerenciar_permissoes_idoso",
        "ver_relatorios"
      )
    );
    return Set.copyOf(permitidas);
  }

  private static Set<String> criarCatalogoPermissoes() {
    Set<String> catalogo = new HashSet<>();
    for (String tipo : TIPOS) {
      for (String acao : ACOES) {
        catalogo.add(acao + "_" + tipo);
      }
    }
    catalogo.addAll(
      Set.of(
        "ver_perfil_idoso",
        "editar_perfil_idoso",
        "editar_perfil_proprio",
        "ver_contato_emergencia",
        "ver_relatorios",
        "usar_atividade_dia",
        "gerar_qr",
        "revogar_qr",
        "gerenciar_permissoes_idoso"
      )
    );
    return Set.copyOf(catalogo);
  }

  // Precisa acompanhar LEGAL_VERSION do frontend. Uma mudança força novo aceite.
  private static final String LEGAL_VERSION = "2026-10-11";
  private final BancoDados banco;

  @org.springframework.beans.factory.annotation.Value("${app.media-path:./data/media}")
  private String pastaMidia = "./data/media";

  private final com.cuidadosamente.backend.localizacao.ServicoLocalizacao localizacao;

  // Custo 12 torna a tentativa de adivinhar senhas mais cara, sem guardar a senha original.
  private final BCryptPasswordEncoder codificadorSenhas = new BCryptPasswordEncoder(12);

  // Alguns campos flexíveis de perfil são serializados em uma coluna JSON.
  private final JsonMapper conversorJson = JsonMapper.builder().build();

  public CuidadosController(
    BancoDados banco,
    com.cuidadosamente.backend.localizacao.ServicoLocalizacao localizacao
  ) {
    this.banco = banco;
    this.localizacao = localizacao;
  }

  // -------------------------------------------------------------------------
  // SAÚDE DO SERVIÇO E AUTENTICAÇÃO
  // -------------------------------------------------------------------------

  @PutMapping("/auth/me/tema")
  public Map<String, Object> alterarTema(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @RequestBody Map<String, Object> dados
  ) {
    String usuarioId = usuarioDaSessao(autorizacao);
    String tema = campoObrigatorio(dados, "tema", 10);
    if (!Set.of("claro", "escuro").contains(tema)) {
      throw erroDadosInvalidos("Escolha modo claro ou modo escuro.");
    }
    banco.executar(
      "INSERT INTO user_preferences(user_id,theme) VALUES(?,?) ON " +
        "CONFLICT(user_id) DO UPDATE SET theme=excluded.theme",
      usuarioId,
      tema
    );
    return buscarUsuario(usuarioId);
  }

  // Localização não é uma permissão genérica delegável ao idoso.
  private boolean podeVerLocalizacao(String id, String usuarioId) {
    String tipo = buscarTipo(usuarioId);
    if ("responsavel".equals(tipo)) {
      return ehDono(id, usuarioId);
    }
    return (
      "cuidador".equals(tipo) &&
      !banco
        .consultar(
          "SELECT 1 FROM location_access l JOIN caregiver_links c ON " +
            "c.idoso_id=l.idoso_id AND c.user_id=l.user_id WHERE (c.expires_at='' OR " +
            "c.expires_at>?) AND l.idoso_id=? AND l.user_id=?",
          LocalDate.now().toString(),
          id,
          usuarioId
        )
        .isEmpty()
    );
  }

  private String buscarTipo(String usuarioId) {
    return banco
      .consultar("SELECT tipo FROM users WHERE id=?", usuarioId)
      .getFirst()
      .get("tipo")
      .toString();
  }

  private void exigirLocalizacao(String id, String usuarioId) {
    validarAcessoIdoso(id, usuarioId);
    if (!podeVerLocalizacao(id, usuarioId)) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "Você não tem autorização para visualizar a localização."
      );
    }
  }

  @GetMapping("/idosos/{id}/localizacao")
  public Map<String, Object> consultarLocalizacao(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    String usuarioId = usuarioAutorizado(autorizacao);
    exigirLocalizacao(id, usuarioId);
    boolean dono = ehDono(id, usuarioId);
    var preferencias = banco.consultar("SELECT enabled FROM location_sharing WHERE idoso_id=?", id);
    boolean compartilhar =
      !preferencias.isEmpty() && ((Number) preferencias.getFirst().get("enabled")).intValue() == 1;
    var resultado = new LinkedHashMap<String, Object>();
    resultado.put("idosoId", id);
    resultado.put(
      "nome",
      banco.consultar("SELECT nome FROM idosos WHERE id=?", id).getFirst().get("nome")
    );
    resultado.put("autorizado", true);
    resultado.put("podeGerenciar", dono);
    resultado.put("servicoConectado", localizacao.conectado());
    resultado.put("coletando", localizacao.coletando(id));
    resultado.put("compartilhamentoHabilitado", compartilhar);
    // Sem compartilhar, apenas o responsável pode consultar a última posição.
    var ponto = dono || compartilhar ? localizacao.ultimaConhecida(id) : null;
    resultado.put("ultimaLocalizacao", ponto);
    resultado.put("compartilhando", compartilhar && localizacao.conectado() && ponto != null);
    resultado.put(
      "desatualizada",
      ponto != null && ponto.atualizadaEm().isBefore(Instant.now().minusSeconds(300))
    );
    resultado.put("limiteDesatualizacaoSegundos", 300);
    if (dono) {
      var cuidadores = banco.consultar(
        "SELECT u.id,u.nome,u.email FROM users u JOIN caregiver_links c ON " +
          "c.user_id=u.id WHERE c.idoso_id=? ORDER BY u.nome",
        id
      );
      for (var cuidador : cuidadores) {
        cuidador.put("autorizado", podeVerLocalizacao(id, cuidador.get("id").toString()));
      }
      resultado.put("cuidadores", cuidadores);
    } else {
      resultado.put("cuidadores", List.of());
    }
    return resultado;
  }

  @PutMapping("/idosos/{id}/localizacao/compartilhamento")
  public synchronized Map<String, Object> compartilharLocalizacao(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    exigirDonoResponsavel(id, usuarioAutorizado(autorizacao));
    if (!(dados.get("habilitado") instanceof Boolean habilitado)) {
      throw erroDadosInvalidos("Informe se deseja compartilhar.");
    }
    if (habilitado && !Boolean.TRUE.equals(dados.get("autorizacaoTitularConfirmada"))) {
      throw erroDadosInvalidos(
        "Confirme a autorização da pessoa idosa ou uma representação legal válida."
      );
    }
    banco.executar(
      "INSERT INTO location_sharing(idoso_id,enabled,updated_at) VALUES(?,?,?) ON " +
        "CONFLICT(idoso_id) DO UPDATE SET " +
        "enabled=excluded.enabled,updated_at=excluded.updated_at",
      id,
      habilitado ? 1 : 0,
      Instant.now().toString()
    );
    if (!habilitado) {
      banco.executar("DELETE FROM location_points WHERE idoso_id=?", id);
    }
    return consultarLocalizacao(autorizacao, id);
  }

  @PutMapping("/idosos/{id}/localizacao/cuidadores/{cuidadorId}")
  public synchronized Map<String, Object> autorizarLocalizacaoCuidador(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @PathVariable String cuidadorId,
    @RequestBody Map<String, Object> dados
  ) {
    String usuarioId = usuarioAutorizado(autorizacao);
    exigirDonoResponsavel(id, usuarioId);
    if (
      banco
        .consultar(
          "SELECT 1 FROM caregiver_links c JOIN users u ON u.id=c.user_id WHERE " +
            "c.idoso_id=? AND c.user_id=? AND u.tipo='cuidador'",
          id,
          cuidadorId
        )
        .isEmpty()
    ) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuidador não vinculado.");
    }
    if (!(dados.get("autorizado") instanceof Boolean permitido)) {
      throw erroDadosInvalidos("Informe a autorização.");
    }
    if (permitido) {
      banco.executar(
        "INSERT INTO location_access(idoso_id,user_id,granted_by,updated_at) " +
          "VALUES(?,?,?,?) ON CONFLICT(idoso_id,user_id) DO UPDATE SET " +
          "granted_by=excluded.granted_by,updated_at=excluded.updated_at",
        id,
        cuidadorId,
        usuarioId,
        Instant.now().toString()
      );
    } else {
      banco.executar("DELETE FROM location_access WHERE idoso_id=? AND user_id=?", id, cuidadorId);
    }
    return consultarLocalizacao(autorizacao, id);
  }

  // Verifica se a API e o banco estão funcionando.
  @GetMapping("/health")
  public Map<String, Object> verificarSaude() {
    banco.consultar("SELECT 1");
    return Map.of("status", "ok", "database", "sqlite");
  }

  // Cria uma nova conta de responsável/cuidador e salva os dados no banco.
  @PostMapping("/auth/cadastro")
  @ResponseStatus(HttpStatus.CREATED)
  public synchronized Map<String, Object> cadastrarConta(@RequestBody Map<String, Object> dados) {
    // `synchronized` serializa cadastros concorrentes neste processo e reduz
    // corrida entre a consulta do e-mail e a restrição UNIQUE do banco.
    validarAceiteDocumentos(dados);
    String nome = campoObrigatorio(dados, "nome", 150);
    String email = validarEmail(dados);
    String senha = validarSenha(dados);
    String tipo = campoObrigatorio(dados, "tipo", 20);
    if (!Set.of("responsavel", "cuidador").contains(tipo)) {
      throw erroDadosInvalidos("A conta do idoso deve ser criada por um cuidador ou responsável.");
    }
    if (!banco.consultar("SELECT id FROM users WHERE email=?", email).isEmpty()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado.");
    }
    Map<String, Object> perfil = new LinkedHashMap<>();
    for (String campo : List.of(
      "cpf",
      "rg",
      "dataNascimento",
      "celular",
      "telefone",
      "cep",
      "rua",
      "bairro",
      "cidade",
      "estado",
      "numero",
      "complemento",
      "temFilhos",
      "quantosFilhos",
      "idadeFilhos",
      "trabalha",
      "empresa",
      "periodo",
      "nomeResponsavel",
      "celularResponsavel",
      "telefoneResponsavel",
      "nomeEmergencia",
      "telefoneEmergencia"
    )) {
      perfil.put(campo, campoOpcional(dados, campo, 300));
    }
    String id = UUID.randomUUID().toString();
    // Usuário e aceite são inseparáveis: a transação não permite que apenas
    // um dos dois seja gravado em caso de falha.
    banco.executarTransacao(
      new Object[] {
        "INSERT INTO users(id,nome,email,senha,tipo,perfil) VALUES(?,?,?,?,?,?)",
        id,
        nome,
        email,
        codificadorSenhas.encode(senha),
        tipo,
        conversorJson.writeValueAsString(perfil),
      },
      new Object[] {
        "INSERT INTO legal_acceptances(user_id,terms_version,privacy_version,health_version,accepted_at) VALUES(?,?,?,?,?)",
        id,
        LEGAL_VERSION,
        LEGAL_VERSION,
        LEGAL_VERSION,
        Instant.now().toString(),
      }
    );
    return criarSessao(id);
  }

  // Faz login usando e-mail e senha.
  // A pessoa idosa entra por senha apenas quando o proprietário configurou este acesso.
  @PostMapping("/auth/login")
  public synchronized Map<String, Object> entrar(@RequestBody Map<String, Object> dados) {
    String email = validarEmail(dados);
    String senha = campoObrigatorio(dados, "senha", 72);
    limitarTentativas("login:" + gerarHash(email), 10, 900);
    var linhas = banco.consultar("SELECT * FROM users WHERE email=?", email);
    if (
      linhas.isEmpty() ||
      !codificadorSenhas.matches(senha, linhas.getFirst().get("senha").toString())
    ) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos.");
    }
    if ("idoso".equals(linhas.getFirst().get("tipo"))) {
      if (((Number) linhas.getFirst().get("password_login_enabled")).intValue() != 1) {
        throw erroDadosInvalidos(
          "Use o QR Code ou peça ao responsável para configurar seu e-mail e senha."
        );
      }
      String usuarioId = linhas.getFirst().get("id").toString();
      var vinculo = banco.consultar(
        "SELECT idoso_id FROM elder_accounts WHERE user_id=?",
        usuarioId
      );
      if (vinculo.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta sem vínculo.");
      }
      validarAcessoIdoso(vinculo.getFirst().get("idoso_id").toString(), usuarioId);
    }
    banco.executar("DELETE FROM auth_limits WHERE key=?", "login:" + gerarHash(email));
    return criarSessao(linhas.getFirst().get("id").toString());
  }

  // -------------------------------------------------------------------------
  // ACESSO TEMPORÁRIO DO IDOSO POR QR CODE
  // -------------------------------------------------------------------------

  // Gera um código QR temporário para o idoso acessar o app sem senha convencional.
  @PostMapping("/idosos/{id}/qr")
  public synchronized Map<String, Object> gerarQr(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    String manager = exigirAdulto(autorizacao);
    exigirPermissao(id, manager, "gerar_qr");
    String contaIdoso = garantirContaIdoso(id);
    // 32 bytes aleatórios produzem um segredo impraticável de adivinhar. Só
    // o hash vai ao banco; o texto original é mostrado uma vez no QR.
    byte[] bytes = new byte[32];
    new SecureRandom().nextBytes(bytes);
    String code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    long expires = Instant.now().plusSeconds(600).getEpochSecond();
    banco.executar(
      "INSERT INTO qr_access(token_hash,idoso_id,expires) VALUES(?,?,?) ON " +
        "CONFLICT(idoso_id) DO UPDATE SET " +
        "token_hash=excluded.token_hash,expires=excluded.expires",
      gerarHash(code),
      id,
      expires
    );
    return Map.of(
      "codigo",
      code,
      "expires",
      expires,
      "nome",
      buscarUsuario(contaIdoso).get("nome")
    );
  }

  // Credenciais opcionais: o proprietário prepara o acesso, sem delegar funções administrativas.
  @PutMapping("/idosos/{id}/acesso-senha")
  public synchronized Map<String, Object> configurarAcessoSenha(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    String manager = exigirAdulto(autorizacao);
    exigirDono(id, manager);
    String email = validarEmail(dados);
    String senha = validarSenha(dados);
    var vinculo = banco.consultar("SELECT user_id FROM elder_accounts WHERE idoso_id=?", id);
    String atual = vinculo.isEmpty() ? "" : vinculo.getFirst().get("user_id").toString();
    var outra = banco.consultar("SELECT id FROM users WHERE email=?", email);
    if (!outra.isEmpty() && !outra.getFirst().get("id").equals(atual)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado.");
    }
    String usuarioId = garantirContaIdoso(id);
    String anterior = banco
      .consultar("SELECT email FROM users WHERE id=?", usuarioId)
      .getFirst()
      .get("email")
      .toString();
    banco.executarTransacao(
      new Object[] {
        "UPDATE users SET email=?,senha=?,password_login_enabled=1,email_verified=CASE WHEN email=? THEN email_verified ELSE 0 END WHERE id=?",
        email,
        codificadorSenhas.encode(senha),
        email,
        usuarioId,
      },
      new Object[] { "DELETE FROM sessions WHERE user_id=?", usuarioId },
      new Object[] { "DELETE FROM qr_access WHERE idoso_id=?", id },
      evento(
        id,
        manager,
        "acesso",
        usuarioId,
        "acesso_senha_configurado",
        Map.of("email", anterior),
        Map.of("email", email)
      )
    );
    return Map.of(
      "email",
      email,
      "nome",
      buscarUsuario(usuarioId).get("nome"),
      "tipo",
      "idoso",
      "message",
      "Acesso por e-mail e senha configurado."
    );
  }

  private String garantirContaIdoso(String id) {
    var idoso = banco.consultar("SELECT * FROM idosos WHERE id=?", id).getFirst();
    Map<String, Object> perfil = conversorJson.readValue(idoso.get("perfil").toString(), Map.class);
    exigirCadastroCompleto(idoso, perfil);
    perfil.put("dataNascimento", idoso.get("nascimento"));
    var contato = contatoEmergencia(id);
    perfil.put("nomeEmergencia", contato.get("nome"));
    perfil.put("telefoneEmergencia", contato.get("telefone"));
    var vinculo = banco.consultar("SELECT user_id FROM elder_accounts WHERE idoso_id=?", id);
    if (vinculo.isEmpty()) {
      String usuarioId = UUID.randomUUID().toString();
      banco.executarTransacao(
        new Object[] {
          "INSERT INTO users(id,nome,email,senha,tipo,perfil) VALUES(?,?,?,?,?,?)",
          usuarioId,
          idoso.get("nome"),
          "qr-" + usuarioId + "@access.invalid",
          codificadorSenhas.encode(UUID.randomUUID().toString()),
          "idoso",
          conversorJson.writeValueAsString(perfil),
        },
        new Object[] { "INSERT INTO elder_accounts(idoso_id,user_id) VALUES(?,?)", id, usuarioId }
      );
      return usuarioId;
    }
    String usuarioId = vinculo.getFirst().get("user_id").toString();
    banco.executar(
      "UPDATE users SET nome=?,perfil=? WHERE id=?",
      idoso.get("nome"),
      conversorJson.writeValueAsString(perfil),
      usuarioId
    );
    return usuarioId;
  }

  @PostMapping("/auth/qr")
  public synchronized Map<String, Object> entrarComQr(@RequestBody Map<String, Object> dados) {
    String code = campoObrigatorio(dados, "codigo", 100);
    // DELETE RETURNING garante uso único inclusive com requisições simultâneas.
    var linhas = banco.consultar(
      "DELETE FROM qr_access WHERE token_hash=? AND expires>? RETURNING idoso_id",
      gerarHash(code),
      Instant.now().getEpochSecond()
    );
    if (linhas.isEmpty()) {
      throw new ResponseStatusException(
        HttpStatus.UNAUTHORIZED,
        "QR Code inválido, expirado ou já utilizado. Peça um novo código."
      );
    }
    String id = linhas.getFirst().get("idoso_id").toString();
    return criarSessao(
      banco
        .consultar("SELECT user_id FROM elder_accounts WHERE idoso_id=?", id)
        .getFirst()
        .get("user_id")
        .toString()
    );
  }

  @DeleteMapping("/idosos/{id}/qr")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public synchronized void revogarQr(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    // Revogar remove o QR pendente e todas as sessões abertas daquela conta,
    // mas mantém cadastro, vínculo e registros de cuidado.
    exigirPermissao(id, exigirAdulto(autorizacao), "revogar_qr");
    banco.executarTransacao(
      new Object[] { "DELETE FROM qr_access WHERE idoso_id=?", id },
      new Object[] {
        "DELETE FROM sessions WHERE user_id IN (SELECT user_id FROM elder_accounts WHERE idoso_id=?)",
        id,
      },
      new Object[] {
        "UPDATE users SET password_login_enabled=0 WHERE id IN (SELECT user_id FROM " +
          "elder_accounts WHERE idoso_id=?)",
        id,
      }
    );
  }

  // -------------------------------------------------------------------------
  // CONTA, DOCUMENTOS LEGAIS E PERFIL
  // -------------------------------------------------------------------------

  // Retorna os dados do usuário logado a partir do token recebido no header Authorization.
  @GetMapping("/auth/me")
  public Map<String, Object> meuPerfil(
    @RequestHeader(value = "Authorization", required = false) String autorizacao
  ) {
    var perfil = buscarUsuario(usuarioDaSessao(autorizacao));
    perfil.put(
      "sessaoExpira",
      banco
        .consultar(
          "SELECT expires FROM sessions WHERE token=?",
          gerarHash(autorizacao.substring(7))
        )
        .getFirst()
        .get("expires")
    );
    return perfil;
  }

  @PostMapping("/legal/accept")
  public synchronized Map<String, Object> aceitarTermos(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @RequestBody Map<String, Object> dados
  ) {
    // usuarioDaSessao valida a sessão, mas ainda permite chegar aqui com aceite
    // antigo; contaAutorizadaId não poderia ser usado porque ele exige aceite atual.
    String id = usuarioDaSessao(autorizacao);
    validarAceiteDocumentos(dados);
    banco.executar(
      "INSERT INTO legal_acceptances(user_id,terms_version,privacy_version,health_version,accepted_at) VALUES(?,?,?,?,?) " +
        ("ON CONFLICT(user_id) DO UPDATE SET " +
          "terms_version=excluded.terms_version,privacy_version=excluded.privacy_version,health_version=excluded.health_version,accepted_at=excluded.accepted_at"),
      id,
      LEGAL_VERSION,
      LEGAL_VERSION,
      LEGAL_VERSION,
      Instant.now().toString()
    );
    return buscarUsuario(id);
  }

  // Atualiza dados do perfil do usuário autenticado.
  @PutMapping("/auth/me")
  public Map<String, Object> atualizarMeuPerfil(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @RequestBody Map<String, Object> dados
  ) {
    String id = usuarioAutorizado(autorizacao);
    String nome = campoObrigatorio(dados, "nome", 150);
    boolean idoso = "idoso".equals(buscarUsuario(id).get("tipo"));
    String idosoId = null;
    if (idoso) {
      var vinculo = banco.consultar("SELECT idoso_id FROM elder_accounts WHERE user_id=?", id);
      if (vinculo.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta sem vínculo.");
      }
      idosoId = vinculo.getFirst().get("idoso_id").toString();
      exigirPermissao(idosoId, id, "editar_perfil_proprio");
      exigirPermissao(idosoId, id, "ver_perfil_idoso");
    }
    Map<String, Object> perfil = conversorJson.readValue(
      banco
        .consultar("SELECT perfil FROM users WHERE id=?", id)
        .getFirst()
        .get("perfil")
        .toString(),
      Map.class
    );
    for (String campo : List.of(
      "celular",
      "telefone",
      "cep",
      "rua",
      "bairro",
      "cidade",
      "estado",
      "numero",
      "complemento",
      "nomeEmergencia",
      "telefoneEmergencia"
    ))
      if (
        dados.containsKey(campo) &&
        !(idoso && Set.of("nomeEmergencia", "telefoneEmergencia").contains(campo))
      ) {
        perfil.put(campo, campoOpcional(dados, campo, 300));
      }
    if (idoso) {
      Map<String, Object> cadastro = conversorJson.readValue(
        banco
          .consultar("SELECT perfil FROM idosos WHERE id=?", idosoId)
          .getFirst()
          .get("perfil")
          .toString(),
        Map.class
      );
      for (String campo : List.of(
        "celular",
        "telefone",
        "cep",
        "rua",
        "bairro",
        "cidade",
        "estado",
        "numero",
        "complemento"
      ))
        if (dados.containsKey(campo)) {
          cadastro.put(campo, perfil.get(campo));
        }
      banco.executarTransacao(
        new Object[] {
          "UPDATE users SET nome=?,perfil=? WHERE id=?",
          nome,
          conversorJson.writeValueAsString(perfil),
          id,
        },
        new Object[] {
          "UPDATE idosos SET nome=?,perfil=? WHERE id=?",
          nome,
          conversorJson.writeValueAsString(cadastro),
          idosoId,
        }
      );
    } else {
      banco.executar(
        "UPDATE users SET nome=?,perfil=? WHERE id=?",
        nome,
        conversorJson.writeValueAsString(perfil),
        id
      );
    }
    return buscarUsuario(id);
  }

  @PostMapping("/auth/logout")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void sair(@RequestHeader(value = "Authorization", required = false) String autorizacao) {
    // O cliente envia o token puro; o banco localiza e remove somente o hash.
    usuarioDaSessao(autorizacao);
    banco.executar("DELETE FROM sessions WHERE token=?", gerarHash(autorizacao.substring(7)));
  }

  /** Encerra a conta adulta e todos os cadastros que pertencem a ela. */
  @DeleteMapping("/auth/me")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public synchronized void excluirMinhaConta(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @RequestBody Map<String, Object> dados
  ) {
    // A exclusão exige apenas uma sessão válida: a pessoa pode encerrar a
    // conta mesmo se preferir não aceitar uma versão nova dos documentos.
    String id = usuarioDaSessao(autorizacao);
    var conta = banco.consultar("SELECT tipo,senha FROM users WHERE id=?", id).getFirst();
    if (!Set.of("responsavel", "cuidador").contains(conta.get("tipo"))) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "Peça ao responsável pelo cadastro para remover seu acesso de idoso."
      );
    }
    String senha = campoObrigatorio(dados, "senha", 72);
    if (!codificadorSenhas.matches(senha, conta.get("senha").toString())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Senha incorreta.");
    }

    var arquivos = banco.consultar(
      "SELECT m.id FROM media_files m JOIN idosos i ON i.id=m.idoso_id WHERE i.owner_id=?",
      id
    );
    List<Object[]> comandos = new ArrayList<>();
    for (var pessoa : banco.consultar("SELECT id FROM idosos WHERE owner_id=?", id)) {
      adicionarExclusaoIdoso(comandos, pessoa.get("id").toString());
    }
    comandos.add(new Object[] { "DELETE FROM access_grants WHERE user_id=?", id });
    comandos.add(new Object[] { "DELETE FROM access_policies WHERE user_id=?", id });
    comandos.add(new Object[] { "DELETE FROM caregiver_links WHERE user_id=?", id });
    comandos.add(new Object[] { "DELETE FROM sessions WHERE user_id=?", id });
    comandos.add(new Object[] { "DELETE FROM legal_acceptances WHERE user_id=?", id });
    comandos.add(new Object[] {
      "DELETE FROM location_access WHERE granted_by=? OR user_id=?",
      id,
      id,
    });
    comandos.add(new Object[] { "DELETE FROM users WHERE id=?", id });
    banco.executarTransacao(comandos.toArray(new Object[0][]));
    apagarArquivos(arquivos);
  }

  // -------------------------------------------------------------------------
  // PESSOAS ACOMPANHADAS
  // -------------------------------------------------------------------------

  // Lista os idosos vinculados ao responsável/cuidador ou ao próprio idoso.
  @GetMapping("/idosos")
  public List<Map<String, Object>> listarIdosos(
    @RequestHeader(value = "Authorization", required = false) String autorizacao
  ) {
    String usuarioId = usuarioAutorizado(autorizacao);
    var pessoas = banco.consultar(
      "SELECT id,nome,nascimento,observacoes,perfil FROM idosos WHERE owner_id=? " +
        "OR id IN (SELECT idoso_id FROM elder_accounts WHERE user_id=?) OR id IN " +
        "(SELECT idoso_id FROM caregiver_links WHERE user_id=?) ORDER BY nome",
      usuarioId,
      usuarioId,
      usuarioId
    );
    for (var pessoa : pessoas) {
      String id = pessoa.get("id").toString();
      var permissoes = permissoesEfetivas(id, usuarioId);
      if (
        !banco
          .consultar("SELECT 1 FROM subject_consents WHERE idoso_id=? AND revoked_at<>''", id)
          .isEmpty()
      ) {
        pessoa.clear();
        continue;
      }
      if (
        !ehDono(id, usuarioId) &&
        !banco
          .consultar(
            "SELECT 1 FROM caregiver_links WHERE idoso_id=? AND user_id=? AND expires_at<>'' AND expires_at<=?",
            id,
            usuarioId,
            LocalDate.now().toString()
          )
          .isEmpty()
      ) {
        pessoa.clear();
        continue;
      }
      pessoa.put("permissoes", permissoes.stream().sorted().toList());
      pessoa.put("dono", ehDono(id, usuarioId));
      pessoa.put("podeVerLocalizacao", podeVerLocalizacao(id, usuarioId));
      if (permissoes.contains("ver_contato_emergencia")) {
        pessoa.put("contatoEmergencia", contatoEmergencia(id));
      }
      if (!permissoes.contains("ver_perfil_idoso")) {
        pessoa.put("nascimento", "");
        pessoa.put("observacoes", "");
        pessoa.put("perfil", "{}");
      }
    }
    pessoas.removeIf(Map::isEmpty);
    return pessoas;
  }

  @PostMapping("/idosos")
  @ResponseStatus(HttpStatus.CREATED)
  public synchronized Map<String, Object> cadastrarIdoso(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @RequestBody Map<String, Object> dados
  ) {
    String contaAutorizadaId = exigirAdulto(autorizacao);
    String id = UUID.randomUUID().toString();
    String nascimento = campoOpcional(dados, "nascimento", 10);
    if (!nascimento.isEmpty()) {
      validarData(nascimento);
      if (LocalDate.parse(nascimento).isAfter(LocalDate.now())) {
        throw erroDadosInvalidos("Nascimento não pode estar no futuro.");
      }
    }
    if (!Boolean.TRUE.equals(dados.get("autorizacaoTitularConfirmada"))) {
      throw erroDadosInvalidos(
        "Confirme a autorização válida da pessoa acompanhada antes de cadastrá-la."
      );
    }
    String representacao = campoObrigatorio(dados, "representacao", 60);
    if (!Set.of("titular_autorizou", "representante_legal").contains(representacao)) {
      throw erroDadosInvalidos("Informe quem autorizou o cadastro.");
    }
    banco.executarTransacao(
      new Object[] {
        "INSERT INTO idosos(id,owner_id,nome,nascimento,observacoes,perfil) VALUES(?,?,?,?,?,?)",
        id,
        contaAutorizadaId,
        campoObrigatorio(dados, "nome", 150),
        nascimento,
        campoOpcional(dados, "observacoes", 2000),
        conversorJson.writeValueAsString(perfilIdoso(dados, Map.of())),
      },
      new Object[] {
        "INSERT INTO subject_consents(idoso_id,actor_id,representation,accepted_at) VALUES(?,?,?,?)",
        id,
        contaAutorizadaId,
        representacao,
        Instant.now().toString(),
      },
      evento(
        id,
        contaAutorizadaId,
        "acesso",
        id,
        "cadastro_autorizado",
        Map.of(),
        Map.of("representacao", representacao)
      )
    );
    return banco
      .consultar("SELECT id,nome,nascimento,observacoes,perfil FROM idosos WHERE id=?", id)
      .getFirst();
  }

  @PutMapping("/idosos/{id}")
  public synchronized Map<String, Object> atualizarIdoso(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    exigirPermissao(id, exigirAdulto(autorizacao), "editar_perfil_idoso");
    String birth = campoOpcional(dados, "nascimento", 10);
    if (!birth.isEmpty()) {
      validarData(birth);
      if (LocalDate.parse(birth).isAfter(LocalDate.now())) {
        throw erroDadosInvalidos("Nascimento não pode estar no futuro.");
      }
    }
    var previous = banco.consultar("SELECT perfil FROM idosos WHERE id=?", id).getFirst();
    // Campos ausentes no PUT preservam os valores antigos do JSON de perfil.
    Map<String, Object> oldProfile = conversorJson.readValue(
      previous.get("perfil").toString(),
      Map.class
    );
    banco.executar(
      "UPDATE idosos SET nome=?,nascimento=?,observacoes=?,perfil=? WHERE id=?",
      campoObrigatorio(dados, "nome", 150),
      birth,
      campoOpcional(dados, "observacoes", 2000),
      conversorJson.writeValueAsString(perfilIdoso(dados, oldProfile)),
      id
    );
    banco.executar(
      "UPDATE users SET nome=? WHERE id IN (SELECT user_id FROM elder_accounts WHERE idoso_id=?)",
      campoObrigatorio(dados, "nome", 150),
      id
    );
    return banco
      .consultar("SELECT id,nome,nascimento,observacoes,perfil FROM idosos WHERE id=?", id)
      .getFirst();
  }

  /** Remove uma pessoa e seus registros, QR e conta de acesso em uma transação. */
  @DeleteMapping("/idosos/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public synchronized void excluirIdoso(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    exigirDono(id, exigirAdulto(autorizacao));
    var arquivos = banco.consultar("SELECT id FROM media_files WHERE idoso_id=?", id);
    List<Object[]> comandos = new ArrayList<>();
    adicionarExclusaoIdoso(comandos, id);
    banco.executarTransacao(comandos.toArray(new Object[0][]));
    apagarArquivos(arquivos);
  }

  private void apagarArquivos(List<Map<String, Object>> arquivos) {
    var pasta = java.nio.file.Path.of(pastaMidia).toAbsolutePath().normalize();
    for (var item : arquivos) {
      String id = item.get("id").toString();
      if (id.matches("[a-f0-9-]{36}")) {
        try {
          java.nio.file.Files.deleteIfExists(pasta.resolve(id));
        } catch (java.io.IOException e) {
          /* A manutenção tenta novamente sem registrar dados privados. */
        }
      }
    }
  }

  private void adicionarExclusaoIdoso(List<Object[]> comandos, String id) {
    var contas = banco.consultar("SELECT user_id FROM elder_accounts WHERE idoso_id=?", id);
    comandos.add(new Object[] { "DELETE FROM qr_access WHERE idoso_id=?", id });
    comandos.add(new Object[] { "DELETE FROM access_grants WHERE idoso_id=?", id });
    comandos.add(new Object[] { "DELETE FROM access_policies WHERE idoso_id=?", id });
    comandos.add(new Object[] { "DELETE FROM elder_grants WHERE idoso_id=?", id });
    comandos.add(new Object[] { "DELETE FROM elder_policies WHERE idoso_id=?", id });
    comandos.add(new Object[] { "DELETE FROM caregiver_links WHERE idoso_id=?", id });
    if (!contas.isEmpty()) {
      String contaIdoso = contas.getFirst().get("user_id").toString();
      comandos.add(new Object[] { "DELETE FROM sessions WHERE user_id=?", contaIdoso });
      comandos.add(new Object[] { "DELETE FROM legal_acceptances WHERE user_id=?", contaIdoso });
      comandos.add(new Object[] { "DELETE FROM elder_accounts WHERE idoso_id=?", id });
      comandos.add(new Object[] {
        "DELETE FROM location_access WHERE granted_by=? OR user_id=?",
        contaIdoso,
        contaIdoso,
      });
      comandos.add(new Object[] { "DELETE FROM users WHERE id=?", contaIdoso });
    }
    comandos.add(new Object[] { "DELETE FROM location_access WHERE idoso_id=?", id });
    comandos.add(new Object[] { "DELETE FROM registros WHERE idoso_id=?", id });
    comandos.add(new Object[] { "DELETE FROM idosos WHERE id=?", id });
  }

  // O responsável configura cada vínculo. O cuidador delegado configura somente o idoso.
  @GetMapping("/idosos/{id}/acesso")
  public Map<String, Object> consultarAcesso(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    String usuarioId = usuarioAutorizado(autorizacao);
    validarAcessoIdoso(id, usuarioId);
    boolean dono = ehDono(id, usuarioId);
    var cuidadores = new ArrayList<Map<String, Object>>();
    if (dono) {
      for (var cuidador : banco.consultar(
        "SELECT u.id,u.nome,u.email FROM users u JOIN caregiver_links c ON " +
          "c.user_id=u.id WHERE c.idoso_id=? ORDER BY u.nome",
        id
      )) {
        var item = new LinkedHashMap<>(cuidador);
        var revisao = banco
          .consultar(
            "SELECT expires_at AS validade,reviewed_at AS revisadoEm FROM " +
              "caregiver_links WHERE idoso_id=? AND user_id=?",
            id,
            cuidador.get("id")
          )
          .getFirst();
        item.putAll(revisao);
        item.put(
          "permissoes",
          permissoesEfetivas(id, cuidador.get("id").toString()).stream().sorted().toList()
        );
        cuidadores.add(item);
      }
    }
    return Map.of(
      "catalogo",
      PERMISSOES.stream().sorted().toList(),
      "minhasPermissoes",
      permissoesEfetivas(id, usuarioId).stream().sorted().toList(),
      "permissoesIdoso",
      permissoesIdoso(id).stream().sorted().toList(),
      "cuidadores",
      cuidadores,
      "dono",
      dono
    );
  }

  @PostMapping("/idosos/{id}/cuidadores")
  @ResponseStatus(HttpStatus.CREATED)
  public synchronized Map<String, Object> vincularCuidador(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    String usuarioId = usuarioAutorizado(autorizacao);
    exigirDonoResponsavel(id, usuarioId);
    var usuarios = banco.consultar(
      "SELECT id FROM users WHERE email=? AND tipo='cuidador'",
      validarEmail(dados)
    );
    if (usuarios.isEmpty()) {
      throw new ResponseStatusException(
        HttpStatus.NOT_FOUND,
        "Cadastre primeiro uma conta de cuidador com esse e-mail."
      );
    }
    String cuidador = usuarios.getFirst().get("id").toString();
    if (
      !banco
        .consultar("SELECT 1 FROM caregiver_links WHERE idoso_id=? AND user_id=?", id, cuidador)
        .isEmpty()
    ) {
      throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "Este cuidador já acompanha a pessoa."
      );
    }
    banco.executar(
      "INSERT INTO caregiver_invitations(id,idoso_id,user_id,invited_by,expires) " +
        "VALUES(?,?,?,?,?) ON CONFLICT(idoso_id,user_id) DO UPDATE SET " +
        "expires=excluded.expires",
      UUID.randomUUID().toString(),
      id,
      cuidador,
      usuarioId,
      Instant.now().plusSeconds(604800).getEpochSecond()
    );
    return consultarAcesso(autorizacao, id);
  }

  @DeleteMapping("/idosos/{id}/cuidadores/{cuidadorId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public synchronized void removerCuidador(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @PathVariable String cuidadorId
  ) {
    String autor = usuarioAutorizado(autorizacao);
    exigirDonoResponsavel(id, autor);
    banco.executarTransacao(
      new Object[] { "DELETE FROM location_access WHERE idoso_id=? AND user_id=?", id, cuidadorId },
      new Object[] { "DELETE FROM access_grants WHERE idoso_id=? AND user_id=?", id, cuidadorId },
      new Object[] { "DELETE FROM access_policies WHERE idoso_id=? AND user_id=?", id, cuidadorId },
      new Object[] { "DELETE FROM caregiver_links WHERE idoso_id=? AND user_id=?", id, cuidadorId },
      evento(id, autor, "acesso", cuidadorId, "vinculo_removido", Map.of(), Map.of())
    );
  }

  @PutMapping("/idosos/{id}/cuidadores/{cuidadorId}/permissoes")
  public synchronized Map<String, Object> configurarCuidador(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @PathVariable String cuidadorId,
    @RequestBody Map<String, Object> dados
  ) {
    exigirDonoResponsavel(id, usuarioAutorizado(autorizacao));
    if (
      banco
        .consultar("SELECT 1 FROM caregiver_links WHERE idoso_id=? AND user_id=?", id, cuidadorId)
        .isEmpty()
    ) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cuidador não vinculado.");
    }
    Set<String> novas = lerPermissoes(dados);
    if (novas.contains("editar_perfil_proprio")) {
      throw erroDadosInvalidos("Esta permissão é exclusiva da conta do idoso.");
    }
    salvarPolitica(id, cuidadorId, novas, usuarioAutorizado(autorizacao));
    return consultarAcesso(autorizacao, id);
  }

  @PutMapping("/idosos/{id}/permissoes-idoso")
  public synchronized Map<String, Object> configurarIdoso(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    String usuarioId = usuarioAutorizado(autorizacao);
    exigirPermissao(id, usuarioId, "gerenciar_permissoes_idoso");
    if ("idoso".equals(buscarUsuario(usuarioId).get("tipo"))) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "O idoso não administra permissões.");
    }
    Set<String> novas = lerPermissoes(dados);
    if (!PERMISSOES_IDOSO.containsAll(novas)) {
      throw erroDadosInvalidos("A conta do idoso não pode receber permissões administrativas.");
    }
    if (!ehDono(id, usuarioId) && !permissoesEfetivas(id, usuarioId).containsAll(novas)) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "O cuidador só pode conceder permissões que possui."
      );
    }
    var comandos = new ArrayList<Object[]>();
    comandos.add(new Object[] { "INSERT OR IGNORE INTO elder_policies(idoso_id) VALUES(?)", id });
    comandos.add(new Object[] { "DELETE FROM elder_grants WHERE idoso_id=?", id });
    for (String permissao : novas) {
      comandos.add(new Object[] {
        "INSERT INTO elder_grants(idoso_id,permission) VALUES(?,?)",
        id,
        permissao,
      });
    }
    comandos.add(
      evento(
        id,
        usuarioId,
        "acesso",
        id,
        "permissoes_idoso_alteradas",
        Map.of(),
        Map.of("permissoes", novas.stream().sorted().toList())
      )
    );
    banco.executarTransacao(comandos.toArray(new Object[0][]));
    return consultarAcesso(autorizacao, id);
  }

  private Map<String, Object> perfilIdoso(
    Map<String, Object> dados,
    Map<String, Object> perfilAnterior
  ) {
    // Copia antes de alterar para não modificar o mapa original recebido.
    Map<String, Object> perfil = new LinkedHashMap<>(perfilAnterior);
    for (String campo : List.of(
      "email",
      "cpf",
      "rg",
      "telefone",
      "celular",
      "cep",
      "rua",
      "bairro",
      "cidade",
      "estado",
      "numero",
      "complemento"
    ))
      if (dados.containsKey(campo)) {
        perfil.put(campo, campoOpcional(dados, campo, campo.equals("email") ? 254 : 300));
      }
    String email = perfil.getOrDefault("email", "").toString();
    if (!email.isEmpty() && !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
      throw erroDadosInvalidos("Informe um e-mail válido para o idoso.");
    }
    return perfil;
  }

  private void exigirCadastroCompleto(Map<String, Object> idoso, Map<String, Object> perfil) {
    if (idoso.get("nome").toString().isBlank()) {
      throw erroDadosInvalidos("Informe o nome da pessoa.");
    }
  }

  // -------------------------------------------------------------------------
  // REGISTROS DE CUIDADO
  // -------------------------------------------------------------------------

  // Busca os registros de um tipo específico (consultas, medicamentos, rotinas ou memórias).
  @GetMapping("/registros")
  public List<Map<String, Object>> listarRegistros(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @RequestParam String tipo,
    @RequestParam String idosoId
  ) {
    String contaAutorizadaId = usuarioAutorizado(autorizacao);
    validarTipoRegistro(tipo);
    exigirPermissao(idosoId, contaAutorizadaId, "ver_" + tipo);
    return banco.consultar(
      "SELECT id,idoso_id AS " +
        "idosoId,tipo,titulo,data,horario,detalhes,status,categoria,midia,versao,plano_id AS planoId,fuso FROM registros WHERE owner_id=? AND idoso_id=? AND tipo=? ORDER BY data,horario",
      donoDosDados(idosoId),
      idosoId,
      tipo
    );
  }

  // Cria um novo item de registro, como consulta, medicamento, rotina ou memória.
  @PostMapping("/registros")
  @ResponseStatus(HttpStatus.CREATED)
  public synchronized Map<String, Object> criarRegistro(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @RequestBody Map<String, Object> dados
  ) {
    String contaAutorizadaId = usuarioAutorizado(autorizacao);
    String id = UUID.randomUUID().toString();
    String idoso = campoObrigatorio(dados, "idosoId", 80);
    String tipo = campoObrigatorio(dados, "tipo", 30);
    validarTipoRegistro(tipo);
    exigirPermissao(idoso, contaAutorizadaId, "criar_" + tipo);
    String mutation = campoOpcional(dados, "mutationId", 80);
    if (!mutation.isEmpty()) {
      var receipt = banco.consultar(
        "SELECT record_id FROM mutation_receipts WHERE id=? AND user_id=?",
        mutation,
        contaAutorizadaId
      );
      if (!receipt.isEmpty()) {
        var anterior = buscarRegistro(
          receipt.getFirst().get("record_id").toString(),
          contaAutorizadaId
        );
        if (!idoso.equals(anterior.get("idosoId")) || !tipo.equals(anterior.get("tipo"))) {
          throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "Esta tentativa pertence a outro cadastro ou tipo de registro. Recarregue " +
              "antes de tentar novamente."
          );
        }
        return anterior;
      }
    }
    String titulo = campoObrigatorio(dados, "titulo", 200);
    String data = campoObrigatorio(dados, "data", 10);
    String horario = campoOpcional(dados, "horario", 5);
    validarData(data);
    validarHorario(horario);
    String category = validarCategoria(dados);
    String media = validarMidia(dados, category);
    var novo = Map.<String, Object>of(
      "titulo",
      titulo,
      "data",
      data,
      "horario",
      horario,
      "detalhes",
      campoOpcional(dados, "detalhes", 4000),
      "status",
      "pendente"
    );
    var comandos = new ArrayList<Object[]>();
    comandos.add(new Object[] {
      "INSERT INTO registros(id,owner_id,idoso_id,tipo,titulo,data,horario,detalhes,status,categoria,midia) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      id,
      donoDosDados(idoso),
      idoso,
      tipo,
      titulo,
      data,
      horario,
      novo.get("detalhes"),
      "pendente",
      category,
      media,
    });
    comandos.add(evento(idoso, contaAutorizadaId, tipo, id, "criado", Map.of(), novo));
    if (!mutation.isEmpty()) {
      comandos.add(new Object[] {
        "INSERT INTO mutation_receipts(id,user_id,record_id) VALUES(?,?,?)",
        mutation,
        contaAutorizadaId,
        id,
      });
    }
    banco.executarTransacao(comandos.toArray(new Object[0][]));
    return buscarRegistro(id, contaAutorizadaId);
  }

  @PutMapping("/registros/{id}")
  public synchronized Map<String, Object> atualizarRegistro(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    String contaAutorizadaId = usuarioAutorizado(autorizacao);
    var previous = buscarRegistro(id, contaAutorizadaId);
    exigirVersao(previous, dados);
    String titulo = campoObrigatorio(dados, "titulo", 200);
    String data = campoObrigatorio(dados, "data", 10);
    String horario = campoOpcional(dados, "horario", 5);
    String status = campoObrigatorio(dados, "status", 20);
    if (!Set.of("pendente", "concluido").contains(status)) {
      throw erroDadosInvalidos("Status inválido.");
    }
    validarData(data);
    validarHorario(horario);
    // Categoria e mídia são opcionais. Mesclar com o registro anterior evita
    // apagá-las quando uma atualização altera apenas o status.
    Map<String, Object> merged = new HashMap<>(previous);
    merged.putAll(dados);
    // O vínculo vem do registro persistido; o corpo não pode validar uma
    // mídia de outra pessoa fingindo que o registro pertence a ela.
    merged.put("idosoId", previous.get("idosoId"));
    String category = validarCategoria(merged);
    String media = validarMidia(merged, category);
    String idosoId = previous.get("idosoId").toString();
    String tipo = previous.get("tipo").toString();
    String detalhes = campoOpcional(dados, "detalhes", 4000);
    if (
      !Objects.equals(previous.get("titulo"), titulo) ||
      !Objects.equals(previous.get("data"), data) ||
      !Objects.equals(previous.get("horario"), horario) ||
      !Objects.equals(previous.get("detalhes"), detalhes) ||
      !Objects.equals(previous.get("categoria"), category) ||
      !Objects.equals(previous.get("midia"), media)
    ) {
      exigirPermissao(idosoId, contaAutorizadaId, "editar_" + tipo);
    }
    if (!Objects.equals(previous.get("status"), status)) {
      exigirPermissao(idosoId, contaAutorizadaId, "concluir_" + tipo);
    }
    exigirPermissao(idosoId, contaAutorizadaId, "ver_" + tipo);
    var depois = new LinkedHashMap<String, Object>(previous);
    depois.putAll(
      Map.of(
        "titulo",
        titulo,
        "data",
        data,
        "horario",
        horario,
        "detalhes",
        detalhes,
        "status",
        status,
        "categoria",
        category,
        "midia",
        media
      )
    );
    banco.executarTransacao(
      new Object[] {
        "UPDATE registros SET " +
          "titulo=?,data=?,horario=?,detalhes=?,status=?,categoria=?,midia=?,versao=versao+1 WHERE id=? AND owner_id=?",
        titulo,
        data,
        horario,
        detalhes,
        status,
        category,
        media,
        id,
        donoDosDados(idosoId),
      },
      evento(
        idosoId,
        contaAutorizadaId,
        tipo,
        id,
        Objects.equals(previous.get("status"), status)
          ? "editado"
          : status.equals("concluido")
            ? "concluido"
            : "reaberto",
        previous,
        depois
      )
    );
    apagarMidiaSemUso(previous.get("midia").toString());
    return buscarRegistro(id, contaAutorizadaId);
  }

  @DeleteMapping("/registros/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public synchronized void excluirRegistroVersionado(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestBody Map<String, Object> dados
  ) {
    var anterior = buscarRegistro(id, usuarioAutorizado(autorizacao));
    exigirVersao(anterior, dados);
    excluirRegistro(autorizacao, id);
  }

  @ResponseStatus(HttpStatus.NO_CONTENT)
  public synchronized void excluirRegistro(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    String contaAutorizadaId = usuarioAutorizado(autorizacao);
    var previous = buscarRegistro(id, contaAutorizadaId);
    String idosoId = previous.get("idosoId").toString();
    exigirPermissao(idosoId, contaAutorizadaId, "excluir_" + previous.get("tipo"));
    banco.executarTransacao(
      new Object[] { "DELETE FROM registros WHERE id=? AND owner_id=?", id, donoDosDados(idosoId) },
      evento(
        idosoId,
        contaAutorizadaId,
        previous.get("tipo").toString(),
        id,
        "excluido",
        previous,
        Map.of()
      )
    );
    apagarMidiaSemUso(previous.get("midia").toString());
  }

  private void apagarMidiaSemUso(String midia) {
    if (
      !midia.startsWith("media:") ||
      !banco.consultar("SELECT 1 FROM registros WHERE midia=?", midia).isEmpty()
    ) {
      return;
    }
    String id = midia.substring(6);
    banco.executar("DELETE FROM media_files WHERE id=?", id);
    apagarArquivos(List.of(Map.of("id", id)));
  }

  // -------------------------------------------------------------------------
  // AUTORIZAÇÃO, SESSÃO E BUSCAS PROTEGIDAS
  // -------------------------------------------------------------------------

  // Garante que a pessoa autenticada tem permissão de gerenciar o idoso.
  String exigirAdulto(String autorizacao) {
    String id = usuarioAutorizado(autorizacao);
    if (!Set.of("responsavel", "cuidador").contains(buscarUsuario(id).get("tipo"))) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "Esta ação é do cuidador ou responsável."
      );
    }
    return id;
  }

  String donoDosDados(String idosoId) {
    return banco
      .consultar("SELECT owner_id FROM idosos WHERE id=?", idosoId)
      .getFirst()
      .get("owner_id")
      .toString();
  }

  private boolean ehDono(String idosoId, String usuarioId) {
    return donoDosDados(idosoId).equals(usuarioId);
  }

  void exigirDono(String idosoId, String usuarioId) {
    validarAcessoIdoso(idosoId, usuarioId);
    if (!ehDono(idosoId, usuarioId)) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "Só o titular do cadastro pode excluir a pessoa."
      );
    }
  }

  void exigirDonoResponsavel(String idosoId, String usuarioId) {
    exigirDono(idosoId, usuarioId);
    if (!"responsavel".equals(buscarUsuario(usuarioId).get("tipo"))) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "Só a conta responsável pode administrar cuidadores."
      );
    }
  }

  Set<String> permissoesPadraoCuidador() {
    Set<String> defaults = new HashSet<>(PERMISSOES);
    defaults.remove("gerenciar_permissoes_idoso");
    defaults.remove("editar_perfil_proprio");
    return defaults;
  }

  private Set<String> permissoesPadraoIdoso() {
    Set<String> defaults = new HashSet<>(
      Set.of(
        "ver_perfil_idoso",
        "editar_perfil_proprio",
        "ver_contato_emergencia",
        "usar_atividade_dia"
      )
    );
    for (String tipo : TIPOS) {
      defaults.add("ver_" + tipo);
      defaults.add("concluir_" + tipo);
    }
    return defaults;
  }

  private Set<String> permissoesIdoso(String idosoId) {
    if (banco.consultar("SELECT 1 FROM elder_policies WHERE idoso_id=?", idosoId).isEmpty()) {
      return permissoesPadraoIdoso();
    }
    Set<String> result = new HashSet<>();
    for (var linha : banco.consultar(
      "SELECT permission FROM elder_grants WHERE idoso_id=?",
      idosoId
    )) {
      result.add(linha.get("permission").toString());
    }
    return result;
  }

  Set<String> permissoesEfetivas(String idosoId, String usuarioId) {
    if (ehDono(idosoId, usuarioId)) {
      return PERMISSOES;
    }
    if (
      !banco
        .consultar(
          "SELECT 1 FROM elder_accounts WHERE idoso_id=? AND user_id=?",
          idosoId,
          usuarioId
        )
        .isEmpty()
    ) {
      return permissoesIdoso(idosoId);
    }
    if (
      !banco
        .consultar(
          "SELECT 1 FROM caregiver_links WHERE idoso_id=? AND user_id=? AND (expires_at='' OR expires_at>?)",
          idosoId,
          usuarioId,
          LocalDate.now().toString()
        )
        .isEmpty()
    ) {
      if (
        banco
          .consultar(
            "SELECT 1 FROM access_policies WHERE idoso_id=? AND user_id=?",
            idosoId,
            usuarioId
          )
          .isEmpty()
      ) {
        return Set.of();
      }
      Set<String> result = new HashSet<>();
      for (var linha : banco.consultar(
        "SELECT permission FROM access_grants WHERE idoso_id=? AND user_id=?",
        idosoId,
        usuarioId
      )) {
        result.add(linha.get("permission").toString());
      }
      return result;
    }
    return Set.of();
  }

  void exigirPermissao(String idosoId, String usuarioId, String permissao) {
    validarAcessoIdoso(idosoId, usuarioId);
    if (!permissoesEfetivas(idosoId, usuarioId).contains(permissao)) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "Sem permissão para " + permissao.replace('_', ' ') + "."
      );
    }
  }

  private Set<String> lerPermissoes(Map<String, Object> dados) {
    if (!(dados.get("permissoes") instanceof List<?> lista)) {
      throw erroDadosInvalidos("Informe a lista de permissões.");
    }
    Set<String> result = new HashSet<>();
    for (Object item : lista) {
      if (!(item instanceof String valor) || !PERMISSOES.contains(valor)) {
        throw erroDadosInvalidos("Permissão desconhecida.");
      }
      result.add(valor);
    }
    return result;
  }

  void salvarPolitica(String idosoId, String usuarioId, Set<String> grants, String autor) {
    var comandos = new ArrayList<Object[]>();
    comandos.add(new Object[] {
      "INSERT OR IGNORE INTO access_policies(idoso_id,user_id) VALUES(?,?)",
      idosoId,
      usuarioId,
    });
    comandos.add(new Object[] {
      "DELETE FROM access_grants WHERE idoso_id=? AND user_id=?",
      idosoId,
      usuarioId,
    });
    for (String grant : grants) {
      comandos.add(new Object[] {
        "INSERT INTO access_grants(idoso_id,user_id,permission) VALUES(?,?,?)",
        idosoId,
        usuarioId,
        grant,
      });
    }
    comandos.add(
      evento(
        idosoId,
        autor,
        "acesso",
        usuarioId,
        "permissoes_cuidador_alteradas",
        Map.of("permissoes", permissoesEfetivas(idosoId, usuarioId).stream().sorted().toList()),
        Map.of("permissoes", grants.stream().sorted().toList())
      )
    );
    banco.executarTransacao(comandos.toArray(new Object[0][]));
  }

  private Map<String, Object> criarSessao(String id) {
    // O token bruto volta ao cliente. Somente SHA-256(token) fica persistido,
    // portanto uma cópia do banco não revela sessões utilizáveis diretamente.
    byte[] bytes = new byte[32];
    new SecureRandom().nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    banco.executar("DELETE FROM sessions WHERE expires<=?", Instant.now().getEpochSecond());
    // Sessões duram 12 horas (43.200 segundos).
    banco.executar(
      "INSERT INTO sessions(token,user_id,expires,id,created_at) VALUES(?,?,?,?,?)",
      gerarHash(token),
      id,
      Instant.now().plusSeconds(43200).getEpochSecond(),
      UUID.randomUUID().toString(),
      Instant.now().toString()
    );
    return Map.of("token", token, "usuario", buscarUsuario(id));
  }

  Map<String, Object> buscarUsuario(String id) {
    Map<String, Object> result = new LinkedHashMap<>(
      banco.consultar("SELECT id,nome,email,tipo,perfil FROM users WHERE id=?", id).getFirst()
    );
    boolean accepted = aceitouDocumentosAtuais(id);
    result.put("legalAccepted", accepted);
    var preferencias = banco.consultar(
      "SELECT theme,font_scale,notifications,notification_details,consultation_minutes FROM user_preferences WHERE user_id=?",
      id
    );
    result.put(
      "preferencias",
      preferencias.isEmpty()
        ? Map.of(
            "font_scale",
            1,
            "notifications",
            0,
            "notification_details",
            0,
            "consultation_minutes",
            60
          )
        : preferencias.getFirst()
    );
    result.put(
      "emailVerificado",
      (
        (Number) banco
          .consultar("SELECT email_verified FROM users WHERE id=?", id)
          .getFirst()
          .get("email_verified")
      ).intValue() == 1
    );
    result.put("tema", preferencias.isEmpty() ? "claro" : preferencias.getFirst().get("theme"));
    // Enquanto falta aceite atual, dados adicionais ficam ocultos; o cliente
    // recebe só o necessário para apresentar o bloqueio jurídico.
    if (!accepted) {
      result.put("perfil", "{}");
    } else if ("idoso".equals(result.get("tipo"))) {
      var vinculo = banco.consultar("SELECT idoso_id FROM elder_accounts WHERE user_id=?", id);
      if (!vinculo.isEmpty()) {
        String idosoId = vinculo.getFirst().get("idoso_id").toString();
        Map<String, Object> perfil = conversorJson.readValue(
          result.get("perfil").toString(),
          Map.class
        );
        if (!permissoesIdoso(idosoId).contains("ver_contato_emergencia")) {
          perfil.remove("nomeEmergencia");
          perfil.remove("telefoneEmergencia");
        }
        if (!permissoesIdoso(idosoId).contains("ver_perfil_idoso")) {
          perfil.clear();
        }
        result.put("perfil", conversorJson.writeValueAsString(perfil));
      }
    }
    return result;
  }

  String usuarioAutorizado(String authorization) {
    // Endpoints de dados protegidos exigem sessão válida E documentos atuais.
    String id = usuarioDaSessao(authorization);
    if (!aceitouDocumentosAtuais(id)) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "Aceite os Termos de Uso, a Política de Privacidade e o tratamento dos dados " +
          "de saúde para continuar."
      );
    }
    return id;
  }

  String usuarioDaSessao(String authorization) {
    // O header segue o padrão: Authorization: Bearer <token>.
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw erroSemAutorizacao();
    }
    var linhas = banco.consultar(
      "SELECT user_id FROM sessions WHERE token=? AND expires>?",
      gerarHash(authorization.substring(7)),
      Instant.now().getEpochSecond()
    );
    if (linhas.isEmpty()) {
      throw erroSemAutorizacao();
    }
    return linhas.getFirst().get("user_id").toString();
  }

  boolean aceitouDocumentosAtuais(String id) {
    return !banco
      .consultar(
        "SELECT user_id FROM legal_acceptances WHERE user_id=? AND terms_version=? " +
          "AND privacy_version=? AND health_version=?",
        id,
        LEGAL_VERSION,
        LEGAL_VERSION,
        LEGAL_VERSION
      )
      .isEmpty();
  }

  private void validarAceiteDocumentos(Map<String, Object> dados) {
    if (
      !LEGAL_VERSION.equals(dados.get("termsVersion")) ||
      !LEGAL_VERSION.equals(dados.get("privacyVersion")) ||
      !Boolean.TRUE.equals(dados.get("healthConsent"))
    ) {
      throw erroDadosInvalidos(
        "Leia e aceite separadamente os Termos de Uso, a Política de Privacidade e o " +
          "tratamento dos dados de saúde."
      );
    }
  }

  private ResponseStatusException erroSemAutorizacao() {
    return new ResponseStatusException(
      HttpStatus.UNAUTHORIZED,
      "Entre na sua conta para continuar."
    );
  }

  void validarAcessoIdoso(String id, String contaAutorizadaId) {
    if (
      !banco
        .consultar("SELECT 1 FROM subject_consents WHERE idoso_id=? AND revoked_at<>''", id)
        .isEmpty()
    ) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "O consentimento desta pessoa foi revogado."
      );
    }
    // Aceita o dono do cadastro ou a conta de idoso ligada especificamente a ele.
    if (
      banco
        .consultar(
          "SELECT id FROM idosos WHERE id=? AND (owner_id=? OR id IN (SELECT idoso_id " +
            "FROM elder_accounts WHERE user_id=?) OR id IN (SELECT idoso_id FROM " +
            "caregiver_links WHERE user_id=?))",
          id,
          contaAutorizadaId,
          contaAutorizadaId,
          contaAutorizadaId
        )
        .isEmpty()
    ) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Idoso não encontrado nesta conta.");
    }
    if (
      !ehDono(id, contaAutorizadaId) &&
      banco
        .consultar(
          "SELECT 1 FROM elder_accounts WHERE idoso_id=? AND user_id=?",
          id,
          contaAutorizadaId
        )
        .isEmpty() &&
      banco
        .consultar(
          "SELECT 1 FROM caregiver_links WHERE idoso_id=? AND user_id=? AND (expires_at='' OR expires_at>?)",
          id,
          contaAutorizadaId,
          LocalDate.now().toString()
        )
        .isEmpty()
    ) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "O vínculo de cuidado expirou. Peça ao responsável para revisar o acesso."
      );
    }
  }

  Map<String, Object> buscarRegistro(String id, String contaAutorizadaId) {
    var linhas = banco.consultar(
      "SELECT id,idoso_id AS " +
        "idosoId,tipo,titulo,data,horario,detalhes,status,categoria,midia,versao,plano_id AS planoId,fuso FROM registros WHERE id=?",
      id
    );
    if (linhas.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro não encontrado.");
    }
    validarAcessoIdoso(linhas.getFirst().get("idosoId").toString(), contaAutorizadaId);
    return linhas.getFirst();
  }

  // -------------------------------------------------------------------------
  // VALIDAÇÃO E NORMALIZAÇÃO DE ENTRADAS
  // -------------------------------------------------------------------------

  // Valida o tipo de registro e garante que o app só envie valores permitidos.
  private void validarTipoRegistro(String tipo) {
    if (!TIPOS.contains(tipo)) {
      throw erroDadosInvalidos("Tipo de registro inválido.");
    }
  }

  // Normaliza e valida campos opcionais como categoria, imagem e links.
  private String validarCategoria(Map<String, Object> dados) {
    String valor = campoOpcional(dados, "categoria", 30);
    if (valor.isEmpty()) {
      return "Histórias";
    }
    if (!Set.of("Fotos", "Vídeos", "Áudios", "Histórias").contains(valor)) {
      throw erroDadosInvalidos("Categoria inválida.");
    }
    return valor;
  }

  private String validarMidia(Map<String, Object> dados, String category) {
    String valor = campoOpcional(dados, "midia", 4000000);
    if (valor.matches("media:[a-f0-9-]{36}")) {
      var midias = banco.consultar(
        "SELECT idoso_id,mime FROM media_files WHERE id=?",
        valor.substring(6)
      );
      String pessoa = dados.getOrDefault("idosoId", "").toString();
      if (midias.isEmpty() || !midias.getFirst().get("idoso_id").equals(pessoa)) {
        throw erroDadosInvalidos("Mídia indisponível para esta pessoa.");
      }
      String mime = midias.getFirst().get("mime").toString();
      if (
        !(
          (category.equals("Fotos") && mime.startsWith("image/")) ||
          (category.equals("Áudios") && mime.startsWith("audio/")) ||
          (category.equals("Vídeos") && mime.startsWith("video/"))
        )
      ) {
        throw erroDadosInvalidos("Categoria diferente do arquivo.");
      }
      return valor;
    }
    if (valor.isEmpty()) {
      return valor;
    }
    // Fotos locais chegam como data URL; apenas três formatos e Base64 válido
    // são aceitos. Vídeos/áudios ficam como links http(s), não uploads.
    if (
      category.equals("Fotos") &&
      valor.matches("^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$")
    ) {
      try {
        Base64.getDecoder().decode(valor.substring(valor.indexOf(',') + 1));
        return valor;
      } catch (IllegalArgumentException e) {
        throw erroDadosInvalidos("Imagem inválida.");
      }
    }
    try {
      var uri = java.net.URI.create(valor);
      if (
        (uri.getScheme().equals("https") || uri.getScheme().equals("http")) &&
        uri.getHost() != null &&
        uri.getUserInfo() == null
      ) {
        return valor;
      }
    } catch (Exception ignored) {}
    throw erroDadosInvalidos("Escolha uma foto válida ou informe um link http/https.");
  }

  void validarData(String valor) {
    try {
      if (!valor.matches("\\d{4}-\\d{2}-\\d{2}")) {
        throw new IllegalArgumentException();
      }
      LocalDate.parse(valor);
    } catch (Exception e) {
      throw erroDadosInvalidos("Use uma data válida no formato AAAA-MM-DD.");
    }
  }

  void validarHorario(String valor) {
    if (valor.isEmpty()) {
      return;
    }
    try {
      if (!valor.matches("\\d{2}:\\d{2}")) {
        throw new IllegalArgumentException();
      }
      LocalTime.parse(valor);
    } catch (Exception e) {
      throw erroDadosInvalidos("Use um horário válido no formato HH:MM.");
    }
  }

  String validarEmail(Map<String, Object> dados) {
    String valor = campoObrigatorio(dados, "email", 254).toLowerCase(Locale.ROOT);
    if (!valor.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
      throw erroDadosInvalidos("Informe um e-mail válido.");
    }
    return valor;
  }

  String validarSenha(Map<String, Object> dados) {
    String valor = campoObrigatorio(dados, "senha", 72);
    if (valor.length() < 8 || valor.getBytes(StandardCharsets.UTF_8).length > 72) {
      throw erroDadosInvalidos("A senha deve ter no mínimo 8 caracteres e no máximo 72 bytes.");
    }
    return valor;
  }

  String campoOpcional(Map<String, Object> dados, String campo, int limite) {
    // Centraliza conversão, trim e limite de tamanho para todos os endpoints.
    Object raw = dados.get(campo);
    if (raw == null) {
      return "";
    }
    if (!(raw instanceof String)) {
      throw erroDadosInvalidos("Campo inválido: " + campo);
    }
    String valor = campo.equals("senha") ? (String) raw : ((String) raw).trim();
    if (valor.length() > limite) {
      throw erroDadosInvalidos("Campo muito longo: " + campo);
    }
    return valor;
  }

  String campoObrigatorio(Map<String, Object> dados, String campo, int limite) {
    String valor = campoOpcional(dados, campo, limite);
    if (valor.isBlank()) {
      throw erroDadosInvalidos("Preencha o campo " + campo + ".");
    }
    return valor;
  }

  ResponseStatusException erroDadosInvalidos(String mensagem) {
    return new ResponseStatusException(HttpStatus.BAD_REQUEST, mensagem);
  }

  void exigirVersao(Map<String, Object> anterior, Map<String, Object> dados) {
    if (!(dados.get("versao") instanceof Number v)) {
      throw new ResponseStatusException(
        HttpStatus.PRECONDITION_REQUIRED,
        "Recarregue o registro antes de salvar."
      );
    }
    if (v.doubleValue() != ((Number) anterior.get("versao")).doubleValue()) {
      throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "Outra pessoa alterou este registro. Recarregue e confira as diferenças antes de salvar."
      );
    }
  }

  Object[] evento(
    String pessoa,
    String autor,
    String tipo,
    String entidade,
    String acao,
    Map<String, Object> antes,
    Map<String, Object> depois
  ) {
    var estadoAnterior = new LinkedHashMap<>(antes);
    var estadoPosterior = new LinkedHashMap<>(depois);
    estadoAnterior.remove("midia");
    estadoPosterior.remove("midia");
    return new Object[] {
      "INSERT INTO audit_events(id,idoso_id,actor_id,actor_name,tipo,entity_id,action,occurred_at,before_json,after_json) VALUES(?,?,?,?,?,?,?,?,?,?)",
      UUID.randomUUID().toString(),
      pessoa,
      autor,
      buscarUsuario(autor).get("nome"),
      tipo,
      entidade,
      acao,
      Instant.now().toString(),
      conversorJson.writeValueAsString(estadoAnterior),
      conversorJson.writeValueAsString(estadoPosterior),
    };
  }

  Map<String, Object> contatoEmergencia(String pessoa) {
    var contatos = banco.consultar(
      "SELECT nome,telefone,nome_alternativo AS " +
        "nomeAlternativo,telefone_alternativo AS telefoneAlternativo FROM " +
        "emergency_contacts WHERE idoso_id=?",
      pessoa
    );
    if (!contatos.isEmpty()) {
      return contatos.getFirst();
    }
    Map<String, Object> perfil = conversorJson.readValue(
      banco
        .consultar("SELECT perfil FROM users WHERE id=?", donoDosDados(pessoa))
        .getFirst()
        .get("perfil")
        .toString(),
      Map.class
    );
    return Map.of(
      "nome",
      perfil.getOrDefault("nomeEmergencia", ""),
      "telefone",
      perfil.getOrDefault("telefoneEmergencia", ""),
      "nomeAlternativo",
      "",
      "telefoneAlternativo",
      ""
    );
  }

  synchronized void limitarTentativas(String chave, int maximo, int segundos) {
    long agora = Instant.now().getEpochSecond();
    banco.executar("DELETE FROM auth_limits WHERE reset_at<=?", agora);
    banco.executar(
      "INSERT INTO auth_limits(key,attempts,reset_at) VALUES(?,1,?) ON " +
        "CONFLICT(key) DO UPDATE SET attempts=attempts+1",
      chave,
      agora + segundos
    );
    if (
      (
        (Number) banco
          .consultar("SELECT attempts FROM auth_limits WHERE key=?", chave)
          .getFirst()
          .get("attempts")
      ).intValue() > maximo
    ) {
      throw new ResponseStatusException(
        HttpStatus.TOO_MANY_REQUESTS,
        "Muitas tentativas. Aguarde alguns minutos."
      );
    }
  }

  void confirmarSenha(String usuarioId, Map<String, Object> dados) {
    if (
      !codificadorSenhas.matches(
        campoObrigatorio(dados, "senha", 72),
        banco
          .consultar("SELECT senha FROM users WHERE id=?", usuarioId)
          .getFirst()
          .get("senha")
          .toString()
      )
    ) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Senha incorreta.");
    }
  }

  String gerarHash(String token) {
    // SHA-256 é adequado para tokens aleatórios de alta entropia. Senhas de
    // usuário usam BCrypt, que é deliberadamente mais lento.
    try {
      return HexFormat.of().formatHex(
        MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))
      );
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
