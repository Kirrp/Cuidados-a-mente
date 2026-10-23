package com.cuidadosamente.backend.infraestrutura;

import java.nio.file.*;
import java.sql.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class BancoDados {

  private final String enderecoBanco;

  /**
   * Prepara o arquivo SQLite e aplica o esquema/migrações simples ao iniciar.
   * CREATE TABLE IF NOT EXISTS preserva instalações existentes; os PRAGMAs
   * table_info permitem adicionar colunas criadas em versões posteriores.
   */
  public BancoDados(@Value("${app.database}") String caminhoBanco) throws Exception {
    Path arquivoBanco = Path.of(caminhoBanco).toAbsolutePath();
    Files.createDirectories(arquivoBanco.getParent());
    enderecoBanco = "jdbc:sqlite:" + arquivoBanco;

    // WAL melhora a convivência entre leituras e gravações concorrentes.
    consultar("PRAGMA journal_mode=WAL");

    criarTabelasIniciais();
    migrarPessoasERegistros();
    migrarSessoesEVinculos();
    prepararContinuidadeEPrivacidade();
  }

  private void criarTabelasIniciais() {
    // Tabelas centrais: contas/sessões, consentimentos, pessoas acompanhadas,
    // registros de cuidado e vínculo/acesso temporário da conta do idoso.
    executar(
      "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, nome TEXT NOT NULL, " +
        "email TEXT NOT NULL UNIQUE, senha TEXT NOT NULL, tipo TEXT NOT NULL, perfil " +
        "TEXT NOT NULL)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT " +
        "NOT NULL REFERENCES users(id), expires INTEGER NOT NULL)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS legal_acceptances (user_id TEXT PRIMARY KEY " +
        "REFERENCES users(id), terms_version TEXT NOT NULL, privacy_version TEXT NOT " +
        "NULL, health_version TEXT NOT NULL, accepted_at TEXT NOT NULL)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS idosos (id TEXT PRIMARY KEY, owner_id TEXT NOT " +
        "NULL REFERENCES users(id), nome TEXT NOT NULL, nascimento TEXT NOT NULL " +
        "DEFAULT '', observacoes TEXT NOT NULL DEFAULT '')"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS registros (id TEXT PRIMARY KEY, owner_id TEXT " +
        "NOT NULL REFERENCES users(id), idoso_id TEXT NOT NULL REFERENCES " +
        "idosos(id), tipo TEXT NOT NULL, titulo TEXT NOT NULL, data TEXT NOT NULL, " +
        "horario TEXT NOT NULL, detalhes TEXT NOT NULL, status TEXT NOT NULL DEFAULT " +
        "'pendente')"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS elder_accounts (idoso_id TEXT PRIMARY KEY " +
        "REFERENCES idosos(id), user_id TEXT NOT NULL UNIQUE REFERENCES users(id))"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS qr_access (token_hash TEXT PRIMARY KEY, idoso_id " +
        "TEXT NOT NULL UNIQUE REFERENCES idosos(id), expires INTEGER NOT NULL)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS caregiver_links (idoso_id TEXT NOT NULL " +
        "REFERENCES idosos(id), user_id TEXT NOT NULL REFERENCES users(id), PRIMARY " +
        "KEY(idoso_id,user_id))"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS access_grants (idoso_id TEXT NOT NULL REFERENCES " +
        "idosos(id), user_id TEXT NOT NULL REFERENCES users(id), permission TEXT NOT " +
        "NULL, PRIMARY KEY(idoso_id,user_id,permission))"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS access_policies (idoso_id TEXT NOT NULL " +
        "REFERENCES idosos(id), user_id TEXT NOT NULL REFERENCES users(id), PRIMARY " +
        "KEY(idoso_id,user_id))"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS elder_grants (idoso_id TEXT NOT NULL REFERENCES " +
        "idosos(id), permission TEXT NOT NULL, PRIMARY KEY(idoso_id,permission))"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS elder_policies (idoso_id TEXT PRIMARY KEY REFERENCES idosos(id))"
    );

    executar(
      "CREATE TABLE IF NOT EXISTS user_preferences (user_id TEXT PRIMARY KEY " +
        "REFERENCES users(id) ON DELETE CASCADE, theme TEXT NOT NULL DEFAULT 'claro' " +
        "CHECK(theme IN ('claro','escuro')))"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS location_sharing (idoso_id TEXT PRIMARY KEY " +
        "REFERENCES idosos(id) ON DELETE CASCADE, enabled INTEGER NOT NULL DEFAULT " +
        "0, updated_at TEXT NOT NULL)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS location_access (idoso_id TEXT NOT NULL " +
        "REFERENCES idosos(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES " +
        "users(id) ON DELETE CASCADE, granted_by TEXT NOT NULL REFERENCES users(id) " +
        "ON DELETE CASCADE, updated_at TEXT NOT NULL, PRIMARY KEY(idoso_id,user_id))"
    );
  }

  private void migrarPessoasERegistros() {
    // Migrações incrementais para bancos criados antes desses campos.
    Set<String> colunasIdoso = new HashSet<>();
    for (var coluna : consultar("PRAGMA table_info(idosos)")) {
      colunasIdoso.add(coluna.get("name").toString());
    }
    if (!colunasIdoso.contains("perfil")) {
      executar("ALTER TABLE idosos ADD COLUMN perfil TEXT NOT NULL DEFAULT '{}'");
    }
    executar(
      "CREATE INDEX IF NOT EXISTS registros_owner ON registros(owner_id, idoso_id, tipo, data)"
    );
    Set<String> colunas = new HashSet<>();
    for (var coluna : consultar("PRAGMA table_info(registros)")) {
      colunas.add(coluna.get("name").toString());
    }
    if (!colunas.contains("categoria")) {
      executar("ALTER TABLE registros ADD COLUMN categoria TEXT NOT NULL DEFAULT 'Histórias'");
    }
    if (!colunas.contains("midia")) {
      executar("ALTER TABLE registros ADD COLUMN midia TEXT NOT NULL DEFAULT ''");
    }
    adicionarColuna("registros", "versao", "INTEGER NOT NULL DEFAULT 1");
    adicionarColuna("registros", "plano_id", "TEXT NOT NULL DEFAULT ''");
    adicionarColuna("registros", "fuso", "TEXT NOT NULL DEFAULT ''");
  }

  private void migrarSessoesEVinculos() {
    adicionarColuna("sessions", "id", "TEXT NOT NULL DEFAULT ''");
    adicionarColuna("sessions", "created_at", "TEXT NOT NULL DEFAULT ''");
    for (var sessao : consultar("SELECT token FROM sessions WHERE id=''")) {
      executar(
        "UPDATE sessions SET id=?,created_at=? WHERE token=?",
        java.util.UUID.randomUUID().toString(),
        java.time.Instant.now().toString(),
        sessao.get("token")
      );
    }
    adicionarColuna("users", "email_verified", "INTEGER NOT NULL DEFAULT 0");
    adicionarColuna("users", "password_login_enabled", "INTEGER NOT NULL DEFAULT 0");
    adicionarColuna("caregiver_links", "expires_at", "TEXT NOT NULL DEFAULT ''");
    adicionarColuna("caregiver_links", "reviewed_at", "TEXT NOT NULL DEFAULT ''");
    executar(
      "UPDATE caregiver_links SET expires_at=?,reviewed_at=? WHERE expires_at=''",
      java.time.LocalDate.now().plusDays(90).toString(),
      java.time.Instant.now().toString()
    );
  }

  private void prepararContinuidadeEPrivacidade() {
    adicionarColuna("user_preferences", "font_scale", "REAL NOT NULL DEFAULT 1");
    adicionarColuna("user_preferences", "notifications", "INTEGER NOT NULL DEFAULT 0");
    adicionarColuna("user_preferences", "notification_details", "INTEGER NOT NULL DEFAULT 0");
    adicionarColuna("user_preferences", "consultation_minutes", "INTEGER NOT NULL DEFAULT 60");
    executar(
      "CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, idoso_id TEXT " +
        "NOT NULL REFERENCES idosos(id) ON DELETE CASCADE, actor_id TEXT NOT NULL, " +
        "actor_name TEXT NOT NULL, tipo TEXT NOT NULL, entity_id TEXT NOT NULL, " +
        "action TEXT NOT NULL, occurred_at TEXT NOT NULL, before_json TEXT NOT NULL, " +
        "after_json TEXT NOT NULL)"
    );
    executar("CREATE INDEX IF NOT EXISTS audit_person_time ON audit_events(idoso_id,occurred_at)");
    executar(
      "CREATE TABLE IF NOT EXISTS caregiver_invitations (id TEXT PRIMARY KEY, " +
        "idoso_id TEXT NOT NULL REFERENCES idosos(id) ON DELETE CASCADE, user_id " +
        "TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, invited_by TEXT NOT " +
        "NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL, " +
        "UNIQUE(idoso_id,user_id))"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS ownership_transfers (id TEXT PRIMARY KEY, " +
        "idoso_id TEXT NOT NULL REFERENCES idosos(id) ON DELETE CASCADE, source_id " +
        "TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, target_id TEXT NOT " +
        "NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL, " +
        "UNIQUE(idoso_id))"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS emergency_contacts (idoso_id TEXT PRIMARY KEY " +
        "REFERENCES idosos(id) ON DELETE CASCADE, nome TEXT NOT NULL, telefone TEXT " +
        "NOT NULL, nome_alternativo TEXT NOT NULL DEFAULT '', telefone_alternativo " +
        "TEXT NOT NULL DEFAULT '')"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS care_notes (id TEXT PRIMARY KEY, idoso_id TEXT " +
        "NOT NULL REFERENCES idosos(id) ON DELETE CASCADE, actor_id TEXT NOT NULL, " +
        "actor_name TEXT NOT NULL, kind TEXT NOT NULL, texto TEXT NOT NULL, " +
        "occurred_at TEXT NOT NULL)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS dose_plans (id TEXT PRIMARY KEY, idoso_id TEXT " +
        "NOT NULL REFERENCES idosos(id) ON DELETE CASCADE, actor_id TEXT NOT NULL, " +
        "titulo TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, " +
        "times TEXT NOT NULL, interval_days INTEGER NOT NULL, timezone TEXT NOT " +
        "NULL, active INTEGER NOT NULL DEFAULT 1)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS auth_limits (key TEXT PRIMARY KEY, attempts " +
        "INTEGER NOT NULL, reset_at INTEGER NOT NULL)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS email_tokens (token_hash TEXT PRIMARY KEY, " +
        "user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT " +
        "NULL, expires INTEGER NOT NULL)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS privacy_requests (id TEXT PRIMARY KEY, user_id " +
        "TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, subject_id TEXT NOT " +
        "NULL DEFAULT '', kind TEXT NOT NULL, texto TEXT NOT NULL, status TEXT NOT " +
        "NULL DEFAULT 'recebido', created_at TEXT NOT NULL)"
    );
    adicionarColuna("privacy_requests", "response", "TEXT NOT NULL DEFAULT ''");
    adicionarColuna("privacy_requests", "updated_at", "TEXT NOT NULL DEFAULT ''");
    executar(
      "CREATE TABLE IF NOT EXISTS privacy_request_history (id TEXT PRIMARY KEY, " +
        "request_id TEXT NOT NULL REFERENCES privacy_requests(id) ON DELETE CASCADE, " +
        "status TEXT NOT NULL, response TEXT NOT NULL, occurred_at TEXT NOT NULL)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS subject_consents (idoso_id TEXT PRIMARY KEY " +
        "REFERENCES idosos(id) ON DELETE CASCADE, actor_id TEXT NOT NULL, " +
        "representation TEXT NOT NULL, accepted_at TEXT NOT NULL, revoked_at TEXT " +
        "NOT NULL DEFAULT '')"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS location_points (idoso_id TEXT PRIMARY KEY " +
        "REFERENCES idosos(id) ON DELETE CASCADE, latitude REAL NOT NULL, longitude " +
        "REAL NOT NULL, accuracy REAL NOT NULL, recorded_at TEXT NOT NULL)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS media_files (id TEXT PRIMARY KEY, idoso_id TEXT " +
        "NOT NULL REFERENCES idosos(id) ON DELETE CASCADE, mime TEXT NOT NULL, size " +
        "INTEGER NOT NULL, created_at TEXT NOT NULL)"
    );
    executar(
      "CREATE TABLE IF NOT EXISTS mutation_receipts (id TEXT PRIMARY KEY, user_id " +
        "TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, record_id TEXT NOT " +
        "NULL)"
    );
  }

  private void adicionarColuna(String tabela, String coluna, String definicao) {
    if (
      consultar("PRAGMA table_info(" + tabela + ")")
        .stream()
        .noneMatch(c -> coluna.equals(c.get("name")))
    ) {
      executar("ALTER TABLE " + tabela + " ADD COLUMN " + coluna + " " + definicao);
    }
  }

  /** Abre uma conexão curta e configura integridade e espera por bloqueio. */
  private Connection abrirConexao() throws SQLException {
    Connection conexao = DriverManager.getConnection(enderecoBanco);
    try (Statement comandoSql = conexao.createStatement()) {
      comandoSql.execute("PRAGMA foreign_keys=ON");
      comandoSql.execute("PRAGMA busy_timeout=5000");
    }
    return conexao;
  }

  /** Executa INSERT, UPDATE, DELETE ou comandos de esquema com parâmetros. */
  public int executar(String sql, Object... parametros) {
    try (
      Connection conexao = abrirConexao();
      PreparedStatement comandoSql = conexao.prepareStatement(sql)
    ) {
      preencherParametros(comandoSql, parametros);
      return comandoSql.executeUpdate();
    } catch (SQLException e) {
      throw new ErroBancoDados(e);
    }
  }

  /**
   * Executa vários comandos como uma unidade: ou todos confirmam, ou rollback
   * desfaz tudo. Isso evita, por exemplo, criar a conta do idoso sem o vínculo.
   * Cada array recebe o SQL na posição zero e os parâmetros nas demais.
   */
  public void executarTransacao(Object[]... comandos) {
    try (Connection conexao = abrirConexao()) {
      conexao.setAutoCommit(false);
      try {
        for (Object[] comando : comandos) {
          try (PreparedStatement comandoSql = conexao.prepareStatement((String) comando[0])) {
            preencherParametros(comandoSql, Arrays.copyOfRange(comando, 1, comando.length));
            comandoSql.executeUpdate();
          }
        }
        conexao.commit();
      } catch (SQLException e) {
        conexao.rollback();
        throw e;
      }
    } catch (SQLException e) {
      throw new ErroBancoDados(e);
    }
  }

  /**
   * Executa SELECT (ou comando com RETURNING) e converte cada linha em Map.
   * LinkedHashMap preserva a ordem das colunas, útil durante depuração e JSON.
   */
  public List<Map<String, Object>> consultar(String sql, Object... parametros) {
    try (
      Connection conexao = abrirConexao();
      PreparedStatement comandoSql = conexao.prepareStatement(sql)
    ) {
      preencherParametros(comandoSql, parametros);
      try (ResultSet resultado = comandoSql.executeQuery()) {
        List<Map<String, Object>> linhas = new ArrayList<>();
        while (resultado.next()) {
          Map<String, Object> linha = new LinkedHashMap<>();
          for (int indice = 1; indice <= resultado.getMetaData().getColumnCount(); indice++) {
            linha.put(resultado.getMetaData().getColumnLabel(indice), resultado.getObject(indice));
          }
          linhas.add(linha);
        }
        return linhas;
      }
    } catch (SQLException e) {
      throw new ErroBancoDados(e);
    }
  }

  // PreparedStatement trata os valores separadamente do SQL e evita injeção.
  private void preencherParametros(PreparedStatement comandoSql, Object[] parametros)
    throws SQLException {
    for (int indice = 0; indice < parametros.length; indice++) {
      comandoSql.setObject(indice + 1, parametros[indice]);
    }
  }

  /** Exceção própria para o advice ocultar detalhes sensíveis do SQLException. */
  public static class ErroBancoDados extends RuntimeException {

    ErroBancoDados(SQLException cause) {
      super(cause);
    }
  }
}
