package com.cuidadosamente.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.cuidadosamente.backend.controlador.CuidadosController;
import com.cuidadosamente.backend.erros.TratadorErrosApi;
import com.cuidadosamente.backend.infraestrutura.BancoDados;
import com.cuidadosamente.backend.localizacao.LocalizacaoNaoConectada;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class TratadorErrosApiTests {

  @TempDir
  Path pasta;

  MockMvc mvc;

  @BeforeEach
  void iniciar() throws Exception {
    var banco = new BancoDados(pasta.resolve("erros.db").toString());
    mvc = MockMvcBuilders.standaloneSetup(
      new CuidadosController(banco, new LocalizacaoNaoConectada())
    )
      .setControllerAdvice(new TratadorErrosApi())
      .build();
  }

  @Test
  void parametroAusenteEErroDoCliente() throws Exception {
    mvc
      .perform(get("/api/registros"))
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.message").exists());
  }

  @Test
  void metodoInvalidoPreservaStatusEHeaderAllow() throws Exception {
    mvc
      .perform(patch("/api/registros"))
      .andExpect(status().isMethodNotAllowed())
      .andExpect(header().string("Allow", org.hamcrest.Matchers.containsString("GET")));
  }

  @Test
  void jsonInvalidoEAutenticacaoMantemContrato() throws Exception {
    mvc
      .perform(post("/api/auth/login").contentType("application/json").content("{invalido"))
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.message").exists());
    mvc
      .perform(get("/api/idosos"))
      .andExpect(status().isUnauthorized())
      .andExpect(jsonPath("$.message").exists());
  }
}
