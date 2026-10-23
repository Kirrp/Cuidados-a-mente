package com.Cuidados_A_Mente.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.file.*;
import java.sql.*;
import java.util.*;

@Component
public class Database {
    private final String url;
    public Database(@Value("${app.database}") String path) throws Exception {
        Path file = Path.of(path).toAbsolutePath();
        Files.createDirectories(file.getParent());
        url = "jdbc:sqlite:" + file;
        query("PRAGMA journal_mode=WAL");
        execute("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE, senha TEXT NOT NULL, tipo TEXT NOT NULL, perfil TEXT NOT NULL)");
        execute("CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL)");
        execute("CREATE TABLE IF NOT EXISTS idosos (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), nome TEXT NOT NULL, nascimento TEXT NOT NULL DEFAULT '', observacoes TEXT NOT NULL DEFAULT '')");
        execute("CREATE TABLE IF NOT EXISTS registros (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), idoso_id TEXT NOT NULL REFERENCES idosos(id), tipo TEXT NOT NULL, titulo TEXT NOT NULL, data TEXT NOT NULL, horario TEXT NOT NULL, detalhes TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pendente')");
        execute("CREATE TABLE IF NOT EXISTS elder_accounts (idoso_id TEXT PRIMARY KEY REFERENCES idosos(id), user_id TEXT NOT NULL UNIQUE REFERENCES users(id))");
        execute("CREATE TABLE IF NOT EXISTS qr_access (token_hash TEXT PRIMARY KEY, idoso_id TEXT NOT NULL UNIQUE REFERENCES idosos(id), expires INTEGER NOT NULL)");
        Set<String> elderColumns = new HashSet<>();
        for (var column : query("PRAGMA table_info(idosos)")) elderColumns.add(column.get("name").toString());
        if (!elderColumns.contains("perfil")) execute("ALTER TABLE idosos ADD COLUMN perfil TEXT NOT NULL DEFAULT '{}'");
        execute("CREATE INDEX IF NOT EXISTS registros_owner ON registros(owner_id, idoso_id, tipo, data)");
        Set<String> columns = new HashSet<>();
        for (var column : query("PRAGMA table_info(registros)")) columns.add(column.get("name").toString());
        if (!columns.contains("categoria")) execute("ALTER TABLE registros ADD COLUMN categoria TEXT NOT NULL DEFAULT 'Histórias'");
        if (!columns.contains("midia")) execute("ALTER TABLE registros ADD COLUMN midia TEXT NOT NULL DEFAULT ''");
    }
    private Connection connection() throws SQLException {
        Connection c = DriverManager.getConnection(url);
        try (Statement s = c.createStatement()) {
            s.execute("PRAGMA foreign_keys=ON");
            s.execute("PRAGMA busy_timeout=5000");
        }
        return c;
    }
    public int execute(String sql, Object... args) {
        try (Connection c = connection(); PreparedStatement s = c.prepareStatement(sql)) {
            bind(s, args); return s.executeUpdate();
        } catch (SQLException e) { throw new DatabaseException(e); }
    }
    // Mantém criação da conta/vínculo e troca do código na mesma transação.
    public void transaction(Object[]... statements) {
        try (Connection c = connection()) {
            c.setAutoCommit(false);
            try {
                for (Object[] command : statements) {
                    try (PreparedStatement s = c.prepareStatement((String) command[0])) {
                        bind(s, Arrays.copyOfRange(command, 1, command.length)); s.executeUpdate();
                    }
                }
                c.commit();
            } catch (SQLException e) { c.rollback(); throw e; }
        } catch (SQLException e) { throw new DatabaseException(e); }
    }
    public List<Map<String,Object>> query(String sql, Object... args) {
        try (Connection c = connection(); PreparedStatement s = c.prepareStatement(sql)) {
            bind(s, args);
            try (ResultSet r = s.executeQuery()) {
                List<Map<String,Object>> rows = new ArrayList<>();
                while (r.next()) {
                    Map<String,Object> row = new LinkedHashMap<>();
                    for (int i=1; i<=r.getMetaData().getColumnCount(); i++)
                        row.put(r.getMetaData().getColumnLabel(i), r.getObject(i));
                    rows.add(row);
                }
                return rows;
            }
        } catch (SQLException e) { throw new DatabaseException(e); }
    }
    private void bind(PreparedStatement s, Object[] args) throws SQLException {
        for (int i=0; i<args.length; i++) s.setObject(i+1,args[i]);
    }
    public static class DatabaseException extends RuntimeException {
        DatabaseException(SQLException cause) { super(cause); }
    }
}
