package com.cuidadosamente.backend.configuracao;

import com.cuidadosamente.backend.infraestrutura.BancoDados;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.*;

/** Retenção técnica; não escreve conteúdo de saúde nos logs. */
@Configuration
@EnableScheduling
public class ManutencaoDados {

  private final BancoDados banco;
  private final Path pasta;
  private final int dias;

  public ManutencaoDados(
    BancoDados banco,
    @Value("${app.media-path:./data/media}") String pasta,
    @Value("${app.audit-days:365}") int dias
  ) {
    this.banco = banco;
    this.pasta = Path.of(pasta).toAbsolutePath().normalize();
    this.dias = Math.max(30, Math.min(3650, dias));
  }

  @Scheduled(fixedDelay = 3600000, initialDelay = 60000)
  public void limpar() throws Exception {
    long agora = Instant.now().getEpochSecond();
    var comandos = new ArrayList<Object[]>();
    for (String tabela : List.of(
      "sessions",
      "email_tokens",
      "qr_access",
      "caregiver_invitations",
      "ownership_transfers"
    )) {
      comandos.add(new Object[] { "DELETE FROM " + tabela + " WHERE expires<=?", agora });
    }
    comandos.add(new Object[] { "DELETE FROM auth_limits WHERE reset_at<=?", agora });
    comandos.add(new Object[] {
      "DELETE FROM location_points WHERE recorded_at<?",
      Instant.now().minusSeconds(86400).toString(),
    });
    comandos.add(new Object[] {
      "DELETE FROM audit_events WHERE occurred_at<?",
      Instant.now()
        .minusSeconds(dias * 86400L)
        .toString(),
    });
    banco.executarTransacao(comandos.toArray(new Object[0][]));
    if (!Files.isDirectory(pasta)) {
      return;
    }
    for (var item : banco.consultar(
      "SELECT id FROM media_files WHERE created_at<? AND id NOT IN (SELECT " +
        "substr(midia,7) FROM registros WHERE midia LIKE 'media:%')",
      Instant.now().minusSeconds(86400).toString()
    )) {
      banco.executar("DELETE FROM media_files WHERE id=?", item.get("id"));
    }
    var existentes = new HashSet<String>();
    for (var item : banco.consultar("SELECT id FROM media_files")) {
      existentes.add(item.get("id").toString());
    }
    try (var arquivos = Files.list(pasta)) {
      for (Path arquivo : arquivos.toList())
        if (
          Files.isRegularFile(arquivo, LinkOption.NOFOLLOW_LINKS) &&
          arquivo.getFileName().toString().matches("[a-f0-9-]{36}") &&
          !existentes.contains(arquivo.getFileName().toString()) &&
          Files.getLastModifiedTime(arquivo).toInstant().isBefore(Instant.now().minusSeconds(86400))
        ) {
          Files.deleteIfExists(arquivo);
        }
    }
  }
}
