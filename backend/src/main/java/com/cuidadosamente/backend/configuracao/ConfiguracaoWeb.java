package com.cuidadosamente.backend.configuracao;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuração HTTP compartilhada por todos os endpoints.
 *
 * CORS decide quais origens de navegador podem chamar a API. Essa proteção é
 * necessária no web; aplicativos nativos não são limitados pela política CORS
 * do navegador.
 */
@Configuration
public class ConfiguracaoWeb implements WebMvcConfigurer {

  private final String[] origins;

  /** Lê a lista separada por vírgulas definida em application.properties. */
  public ConfiguracaoWeb(@Value("${app.origins}") String origins) {
    this.origins = origins.split(",");
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
      .addMapping("/api/**")
      .allowedOrigins(origins)
      .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
      .allowedHeaders("Content-Type", "Authorization")
      // O navegador pode reutilizar a autorização do preflight por 1 hora.
      .maxAge(3600);
  }
}
