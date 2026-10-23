package com.cuidadosamente.backend.controlador;

import com.cuidadosamente.backend.infraestrutura.BancoDados;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/** Arquivos privados em pasta separada do SQLite; download revalida o vínculo. */
@RestController
@RequestMapping("/api")
public class MidiaController {

  private final BancoDados banco;
  private final CuidadosController cuidados;
  private final Path pasta;

  public MidiaController(
    BancoDados banco,
    CuidadosController cuidados,
    @Value("${app.media-path:./data/media}") String pasta
  ) throws Exception {
    this.banco = banco;
    this.cuidados = cuidados;
    this.pasta = Path.of(pasta).toAbsolutePath().normalize();
    Files.createDirectories(this.pasta);
  }

  @PostMapping("/idosos/{id}/midias")
  public synchronized Map<String, Object> upload(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id,
    @RequestParam("arquivo") MultipartFile arquivo
  ) throws Exception {
    String usuarioId = cuidados.usuarioAutorizado(autorizacao);
    cuidados.exigirPermissao(id, usuarioId, "criar_memorias");
    if (arquivo.isEmpty() || arquivo.getSize() > 10 * 1024 * 1024) {
      throw cuidados.erroDadosInvalidos("Escolha um arquivo de até 10 MB.");
    }
    long total = (
      (Number) banco
        .consultar("SELECT COALESCE(SUM(size),0) AS total FROM media_files WHERE idoso_id=?", id)
        .getFirst()
        .get("total")
    ).longValue();
    if (total + arquivo.getSize() > 200 * 1024 * 1024) {
      throw cuidados.erroDadosInvalidos("O limite de mídias desta pessoa é 200 MB.");
    }
    byte[] bytes = arquivo.getBytes();
    String mime = detectar(bytes);
    String mid = UUID.randomUUID().toString();
    Path destino = caminho(mid);
    Files.write(destino, bytes, StandardOpenOption.CREATE_NEW);
    try {
      banco.executarTransacao(
        new Object[] {
          "INSERT INTO media_files(id,idoso_id,mime,size,created_at) VALUES(?,?,?,?,?)",
          mid,
          id,
          mime,
          bytes.length,
          Instant.now().toString(),
        },
        cuidados.evento(
          id,
          usuarioId,
          "memorias",
          mid,
          "arquivo_enviado",
          Map.of(),
          Map.of("mime", mime, "tamanho", bytes.length)
        )
      );
    } catch (Exception e) {
      Files.deleteIfExists(destino);
      throw e;
    }
    return Map.of("id", mid, "midia", "media:" + mid, "mime", mime, "tamanho", bytes.length);
  }

  @GetMapping("/midias/{id}")
  public ResponseEntity<FileSystemResource> download(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) {
    var item = buscar(autorizacao, id, "ver_memorias");
    Path arquivo = caminho(id);
    if (!Files.isRegularFile(arquivo)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo indisponível.");
    }
    return ResponseEntity.ok()
      .contentType(MediaType.parseMediaType(item.get("mime").toString()))
      .header("Cache-Control", "no-store")
      .header("X-Content-Type-Options", "nosniff")
      .header("Content-Disposition", "attachment; filename=" + id)
      .body(new FileSystemResource(arquivo));
  }

  @DeleteMapping("/midias/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public synchronized void excluir(
    @RequestHeader(value = "Authorization", required = false) String autorizacao,
    @PathVariable String id
  ) throws Exception {
    var item = buscar(autorizacao, id, "excluir_memorias");
    banco.executarTransacao(
      new Object[] { "UPDATE registros SET midia='',versao=versao+1 WHERE midia=?", "media:" + id },
      new Object[] { "DELETE FROM media_files WHERE id=?", id },
      cuidados.evento(
        item.get("idoso_id").toString(),
        cuidados.usuarioAutorizado(autorizacao),
        "memorias",
        id,
        "arquivo_excluido",
        Map.of(),
        Map.of()
      )
    );
    Files.deleteIfExists(caminho(id));
  }

  private Map<String, Object> buscar(String autorizacao, String id, String permissao) {
    var linhas = banco.consultar("SELECT * FROM media_files WHERE id=?", id);
    if (linhas.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Mídia não encontrada.");
    }
    cuidados.exigirPermissao(
      linhas.getFirst().get("idoso_id").toString(),
      cuidados.usuarioAutorizado(autorizacao),
      permissao
    );
    return linhas.getFirst();
  }

  private Path caminho(String id) {
    if (!id.matches("[a-f0-9-]{36}")) {
      throw cuidados.erroDadosInvalidos("Identificador inválido.");
    }
    Path destino = pasta.resolve(id).normalize();
    if (!destino.startsWith(pasta)) {
      throw cuidados.erroDadosInvalidos("Arquivo inválido.");
    }
    return destino;
  }

  private String detectar(byte[] b) {
    if (b.length < 12) {
      throw cuidados.erroDadosInvalidos("Arquivo inválido.");
    }
    if (b[0] == (byte) 0xff && b[1] == (byte) 0xd8 && b[2] == (byte) 0xff) {
      return "image/jpeg";
    }
    if (Arrays.equals(Arrays.copyOf(b, 8), new byte[] { (byte) 137, 80, 78, 71, 13, 10, 26, 10 })) {
      return "image/png";
    }
    String cab = new String(b, 0, 12, java.nio.charset.StandardCharsets.ISO_8859_1);
    if (cab.startsWith("RIFF") && cab.endsWith("WEBP")) {
      return "image/webp";
    }
    if (cab.startsWith("RIFF") && cab.endsWith("WAVE")) {
      return "audio/wav";
    }
    if (cab.startsWith("ID3") || (b[0] == (byte) 0xff && (b[1] & 0xe0) == 0xe0)) {
      return "audio/mpeg";
    }
    if (cab.substring(4, 8).equals("ftyp")) {
      return "video/mp4";
    }
    throw cuidados.erroDadosInvalidos("Formatos aceitos: JPEG, PNG, WebP, MP3, WAV e MP4.");
  }
}
