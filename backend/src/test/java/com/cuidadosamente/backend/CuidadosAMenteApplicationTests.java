package com.cuidadosamente.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
  properties = { "app.database=./target/tests/context.db", "app.media-path=./target/tests/media" }
)
class CuidadosAMenteApplicationTests {

  @Test
  void contextLoads() {}
}
