package com.Cuidados_A_Mente.backend;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
// Centraliza o tratamento de erros da API.
// Em vez de quebrar a aplicação, a API responde com JSON amigável para o frontend.
@RestControllerAdvice
public class ApiErrors {
    // Converte erros de negócio (401, 404, 409, etc.) em respostas HTTP padronizadas.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> expected(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("message",e.getReason()==null?"Requisição inválida.":e.getReason()));
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> invalidBody() {
        return ResponseEntity.badRequest().body(Map.of("message","Envie os campos no formato correto."));
    }
    @ExceptionHandler(Database.DatabaseException.class)
    public ResponseEntity<?> database() {
        return ResponseEntity.status(500).body(Map.of("message","Não foi possível salvar ou consultar os dados. Tente novamente."));
    }
}
