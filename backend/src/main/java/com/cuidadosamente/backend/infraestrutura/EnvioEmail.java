package com.cuidadosamente.backend.infraestrutura;

import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

/** Adaptador Resend. Não envia dados de saúde nem credenciais ao cliente. */
@Service
public class EnvioEmail {

  private final String key;
  private final String from;

  public EnvioEmail(
    @Value("${app.email-key:}") String key,
    @Value("${app.email-from:}") String from
  ) {
    this.key = key;
    this.from = from;
  }

  public boolean configurado() {
    return !key.isBlank() && !from.isBlank();
  }

  public void enviar(String destinatario, String assunto, String texto) {
    if (!configurado()) {
      throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "Serviço de e-mail indisponível."
      );
    }
    try {
      var body = JsonMapper.builder()
        .build()
        .writeValueAsString(
          Map.of("from", from, "to", List.of(destinatario), "subject", assunto, "text", texto)
        );
      var request = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
        .timeout(Duration.ofSeconds(10))
        .header("Authorization", "Bearer " + key)
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();
      var result = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build()
        .send(request, HttpResponse.BodyHandlers.discarding());
      if (result.statusCode() < 200 || result.statusCode() >= 300) {
        throw new IllegalStateException();
      }
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "Não foi possível enviar o e-mail."
      );
    } catch (Exception e) {
      throw new ResponseStatusException(
        HttpStatus.SERVICE_UNAVAILABLE,
        "Não foi possível enviar o e-mail. Tente novamente mais tarde."
      );
    }
  }
}
