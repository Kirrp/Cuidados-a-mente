package com.cuidadosamente.backend.configuracao;

import com.cuidadosamente.backend.infraestrutura.BancoDados;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.concurrent.atomic.LongAdder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Métricas agregadas: nunca registra URL com parâmetros, corpo, token ou saúde. */
@Component
public class FiltroOperacional extends OncePerRequestFilter {

  public final LongAdder requisicoes = new LongAdder();
  public final LongAdder falhas = new LongAdder();
  public final LongAdder tempoNanos = new LongAdder();
  private final BancoDados banco;

  public FiltroOperacional(BancoDados banco) {
    this.banco = banco;
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest requisicao,
    HttpServletResponse resposta,
    FilterChain cadeiaFiltros
  ) throws ServletException, IOException {
    long inicio = System.nanoTime();
    requisicoes.increment();
    resposta.setHeader("Cache-Control", "no-store");
    resposta.setHeader("X-Content-Type-Options", "nosniff");
    try {
      if (
        requisicao.getRequestURI().startsWith("/api/auth/") &&
        !requisicao.getRequestURI().equals("/api/auth/logout") &&
        requisicao.getMethod().equals("POST")
      ) {
        String chave;
        try {
          chave =
            "ip:" +
            HexFormat.of().formatHex(
              MessageDigest.getInstance("SHA-256").digest(
                requisicao.getRemoteAddr().getBytes(StandardCharsets.UTF_8)
              )
            );
        } catch (Exception e) {
          throw new ServletException("Falha na proteção de acesso.");
        }
        long agora = Instant.now().getEpochSecond();
        synchronized (banco) {
          banco.executar("DELETE FROM auth_limits WHERE reset_at<=?", agora);
          banco.executar(
            "INSERT INTO auth_limits(key,attempts,reset_at) VALUES(?,1,?) ON " +
              "CONFLICT(key) DO UPDATE SET attempts=attempts+1",
            chave,
            agora + 900
          );
          if (
            (
              (Number) banco
                .consultar("SELECT attempts FROM auth_limits WHERE key=?", chave)
                .getFirst()
                .get("attempts")
            ).intValue() > 40
          ) {
            resposta.setStatus(429);
            resposta.setHeader("Retry-After", "900");
            resposta.setContentType("application/json;charset=UTF-8");
            resposta
              .getWriter()
              .write("{\"message\":\"Muitas tentativas. Aguarde alguns minutos.\"}");
            return;
          }
        }
      }
      cadeiaFiltros.doFilter(requisicao, resposta);
    } finally {
      tempoNanos.add(System.nanoTime() - inicio);
      if (resposta.getStatus() >= 500) {
        falhas.increment();
      }
    }
  }
}
