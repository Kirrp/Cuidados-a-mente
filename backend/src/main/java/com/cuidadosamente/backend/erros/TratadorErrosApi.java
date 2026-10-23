package com.cuidadosamente.backend.erros;

import com.cuidadosamente.backend.infraestrutura.BancoDados;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

/**
 * Traduz exceções internas para o contrato de erro consumido pelo frontend:
 * {@code { "message": "explicação" }}.
 *
 * Sem este advice, o Spring poderia responder formatos diferentes conforme a
 * origem da falha, obrigando o aplicativo a conhecer detalhes do servidor.
 */
@RestControllerAdvice
public class TratadorErrosApi {

  // Converte erros de negócio (401, 404, 409, etc.) em respostas HTTP padronizadas.
  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<?> expected(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode()).body(
      Map.of("message", e.getReason() == null ? "Requisição inválida." : e.getReason())
    );
  }

  // O JSON não pôde ser convertido para os tipos esperados pelo endpoint.
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<?> invalidBody() {
    return ResponseEntity.badRequest().body(
      Map.of("message", "Envie os campos no formato correto.")
    );
  }

  @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
  public ResponseEntity<?> tamanho() {
    return ResponseEntity.status(413).body(Map.of("message", "Escolha um arquivo de até 10 MB."));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<?> inesperado(Exception e) {
    // Erros HTTP produzidos pelo próprio Spring (parâmetro ausente,
    // método inválido ou rota inexistente) continuam sendo falhas 4xx.
    if (
      e instanceof org.springframework.web.ErrorResponse erro &&
      erro.getStatusCode().is4xxClientError()
    ) {
      return ResponseEntity.status(erro.getStatusCode())
        .headers(erro.getHeaders())
        .body(
          Map.of(
            "message",
            "Requisição inválida. Confira o endereço, o método e os campos enviados."
          )
        );
    }
    return ResponseEntity.status(500).body(
      Map.of("message", "Não foi possível concluir a operação. Tente novamente.")
    );
  }

  // Não expõe SQL, caminhos ou detalhes técnicos do SQLite ao cliente.
  @ExceptionHandler(BancoDados.ErroBancoDados.class)
  public ResponseEntity<?> database() {
    return ResponseEntity.status(500).body(
      Map.of("message", "Não foi possível salvar ou consultar os dados. Tente novamente.")
    );
  }
}
