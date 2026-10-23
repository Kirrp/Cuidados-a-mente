package com.cuidadosamente.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Inicializador do backend.
 *
 * {@code @SpringBootApplication} ativa a configuração automática e procura,
 * neste pacote e nos subpacotes, componentes como controladores, configurações
 * e classes de infraestrutura.
 */
@SpringBootApplication
public class CuidadosAMenteApplication {

  /** Inicia o servidor HTTP incorporado e monta o contexto do Spring. */
  public static void main(String[] args) {
    SpringApplication.run(CuidadosAMenteApplication.class, args);
  }
}
