FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn -B package
FROM eclipse-temurin:21-jre-jammy
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid app --no-create-home app
WORKDIR /app
COPY --from=build /src/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar
USER 10001:10001
ENV SERVER_ADDRESS=0.0.0.0 DATABASE_PATH=/data/cuidados.db MEDIA_PATH=/data/media
EXPOSE 8080
ENTRYPOINT ["java","-XX:MaxRAMPercentage=65","-jar","/app/app.jar"]
