package com.Cuidados_A_Mente.backend;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
@SpringBootTest(properties = "app.database=./target/tests/context.db")
class BackendApplicationTests {
    @Test void contextLoads() {}
}
