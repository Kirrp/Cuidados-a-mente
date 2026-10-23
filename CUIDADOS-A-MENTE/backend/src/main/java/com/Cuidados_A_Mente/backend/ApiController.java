package com.Cuidados_A_Mente.backend;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.json.JsonMapper;

// Controlador principal da API REST.
// Aqui ficam os endpoints que cuidam de autenticação, QR, idosos e registros.
// Em termos simples: ele recebe as requisições do app e conversa com o banco SQLite.
@RestController
@RequestMapping("/api")
public class ApiController {
    private static final Set<String> TIPOS = Set.of("consultas","medicamentos","rotinas","memorias");
    private final Database db;
    private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(12);
    private final JsonMapper json = JsonMapper.builder().build();
    public ApiController(Database db) { this.db=db; }

    // Verifica se a API e o banco estão funcionando.
    @GetMapping("/health")
    public Map<String,Object> health() {
        db.query("SELECT 1"); return Map.of("status","ok","database","sqlite");
    }
    // Cria uma nova conta de responsável/cuidador e salva os dados no banco.
    @PostMapping("/auth/cadastro")
    @ResponseStatus(HttpStatus.CREATED)
    public synchronized Map<String,Object> cadastro(@RequestBody Map<String,Object> body) {
        String nome=required(body,"nome",150), email=email(body), senha=password(body), tipo=required(body,"tipo",20);
        if (!Set.of("responsavel","cuidador").contains(tipo)) throw bad("A conta do idoso deve ser criada por um cuidador ou responsável.");
        if (!db.query("SELECT id FROM users WHERE email=?",email).isEmpty())
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Este e-mail já está cadastrado.");
        Map<String,Object> perfil = new LinkedHashMap<>();
        for (String key : List.of("cpf","rg","dataNascimento","celular","telefone","cep","rua","bairro","cidade",
                "estado","numero","complemento","temFilhos","quantosFilhos","idadeFilhos","trabalha","empresa","periodo",
                "nomeResponsavel","celularResponsavel","telefoneResponsavel","nomeEmergencia","telefoneEmergencia"))
            perfil.put(key,optional(body,key,300));
        String id=UUID.randomUUID().toString();
        db.execute("INSERT INTO users(id,nome,email,senha,tipo,perfil) VALUES(?,?,?,?,?,?)",
                id,nome,email,passwords.encode(senha),tipo,json.writeValueAsString(perfil));
        return session(id);
    }
    // Faz login usando e-mail e senha.
    // Se o usuário for idoso, bloqueia o acesso normal e força a autenticação via QR.
    @PostMapping("/auth/login")
    public Map<String,Object> login(@RequestBody Map<String,Object> body) {
        String email=email(body), senha=required(body,"senha",72);
        var rows=db.query("SELECT * FROM users WHERE email=?",email);
        if (rows.isEmpty() || !passwords.matches(senha,rows.getFirst().get("senha").toString()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"E-mail ou senha incorretos.");
        if (rows.getFirst().get("tipo").equals("idoso")) throw bad("Use o QR Code fornecido pelo cuidador ou responsável.");
        return session(rows.getFirst().get("id").toString());
    }
    // Gera um código QR temporário para o idoso acessar o app sem senha convencional.
    @PostMapping("/idosos/{id}/qr")
    public synchronized Map<String,Object> generateQr(@RequestHeader(value="Authorization",required=false) String auth,@PathVariable String id) {
        String manager=manager(auth); checkIdoso(id,manager);
        var person=db.query("SELECT * FROM idosos WHERE id=?",id).getFirst();
        Map<String,Object> elderProfile=json.readValue(person.get("perfil").toString(),Map.class);
        requireCompleteElder(person,elderProfile);
        elderProfile.put("dataNascimento",person.get("nascimento"));
        Map<String,Object> managerProfile=json.readValue(user(manager).get("perfil").toString(),Map.class);
        for (String key:List.of("nomeEmergencia","telefoneEmergencia")) elderProfile.put(key,managerProfile.getOrDefault(key,""));
        if (db.query("SELECT user_id FROM elder_accounts WHERE idoso_id=?",id).isEmpty()) {
            String uid=UUID.randomUUID().toString();
            db.transaction(new Object[]{"INSERT INTO users(id,nome,email,senha,tipo,perfil) VALUES(?,?,?,?,?,?)",uid,person.get("nome"),"qr-"+uid+"@access.invalid",passwords.encode(UUID.randomUUID().toString()),"idoso",json.writeValueAsString(elderProfile)},
                new Object[]{"INSERT INTO elder_accounts(idoso_id,user_id) VALUES(?,?)",id,uid});
        } else db.execute("UPDATE users SET nome=?,perfil=? WHERE id IN (SELECT user_id FROM elder_accounts WHERE idoso_id=?)",person.get("nome"),json.writeValueAsString(elderProfile),id);
        byte[] bytes=new byte[32]; new SecureRandom().nextBytes(bytes);
        String code=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        long expires=Instant.now().plusSeconds(600).getEpochSecond();
        db.execute("INSERT INTO qr_access(token_hash,idoso_id,expires) VALUES(?,?,?) ON CONFLICT(idoso_id) DO UPDATE SET token_hash=excluded.token_hash,expires=excluded.expires",hash(code),id,expires);
        return Map.of("codigo",code,"expires",expires,"nome",person.get("nome"));
    }

    @PostMapping("/auth/qr")
    public synchronized Map<String,Object> redeemQr(@RequestBody Map<String,Object> body) {
        String code=required(body,"codigo",100);
        // DELETE RETURNING garante uso único inclusive com requisições simultâneas.
        var rows=db.query("DELETE FROM qr_access WHERE token_hash=? AND expires>? RETURNING idoso_id",hash(code),Instant.now().getEpochSecond());
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"QR Code inválido, expirado ou já utilizado. Peça um novo código.");
        String id=rows.getFirst().get("idoso_id").toString();
        return session(db.query("SELECT user_id FROM elder_accounts WHERE idoso_id=?",id).getFirst().get("user_id").toString());
    }
    @DeleteMapping("/idosos/{id}/qr")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public synchronized void revokeQr(@RequestHeader(value="Authorization",required=false) String auth,@PathVariable String id) {
        checkIdoso(id,manager(auth));
        db.transaction(new Object[]{"DELETE FROM qr_access WHERE idoso_id=?",id},
            new Object[]{"DELETE FROM sessions WHERE user_id IN (SELECT user_id FROM elder_accounts WHERE idoso_id=?)",id});
    }
    // Retorna os dados do usuário logado a partir do token recebido no header Authorization.
    @GetMapping("/auth/me")
    public Map<String,Object> me(@RequestHeader(value="Authorization",required=false) String auth) { return user(owner(auth)); }
    // Atualiza dados do perfil do usuário autenticado.
    @PutMapping("/auth/me")
    public Map<String,Object> updateMe(@RequestHeader(value="Authorization",required=false) String auth,@RequestBody Map<String,Object> body) {
        String id=owner(auth),nome=required(body,"nome",150);
        Map<String,Object> profile = json.readValue(user(id).get("perfil").toString(),Map.class);
        for (String key : List.of("celular","telefone","cep","rua","bairro","cidade","estado","numero","complemento","nomeEmergencia","telefoneEmergencia"))
            if (body.containsKey(key)) profile.put(key,optional(body,key,300));
        db.execute("UPDATE users SET nome=?,perfil=? WHERE id=?",nome,json.writeValueAsString(profile),id);
        return user(id);
    }
    @PostMapping("/auth/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value="Authorization",required=false) String auth) {
        owner(auth); db.execute("DELETE FROM sessions WHERE token=?",hash(auth.substring(7)));
    }
    // Lista os idosos vinculados ao responsável/cuidador ou ao próprio idoso.
    @GetMapping("/idosos")
    public List<Map<String,Object>> idosos(@RequestHeader(value="Authorization",required=false) String auth) {
        String uid=owner(auth);
        return db.query("SELECT id,nome,nascimento,observacoes,perfil FROM idosos WHERE owner_id=? OR id IN (SELECT idoso_id FROM elder_accounts WHERE user_id=?) ORDER BY nome",uid,uid);
    }
    @PostMapping("/idosos")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> addIdoso(@RequestHeader(value="Authorization",required=false) String auth,@RequestBody Map<String,Object> body) {
        String owner=manager(auth),id=UUID.randomUUID().toString(),nascimento=optional(body,"nascimento",10);
        if (!nascimento.isEmpty()) {
            date(nascimento);
            if (LocalDate.parse(nascimento).isAfter(LocalDate.now())) throw bad("Nascimento não pode estar no futuro.");
        }
        db.execute("INSERT INTO idosos(id,owner_id,nome,nascimento,observacoes,perfil) VALUES(?,?,?,?,?,?)",
                id,owner,required(body,"nome",150),nascimento,optional(body,"observacoes",2000),json.writeValueAsString(elderProfile(body,Map.of())));
        return db.query("SELECT id,nome,nascimento,observacoes,perfil FROM idosos WHERE id=?",id).getFirst();
    }
    @PutMapping("/idosos/{id}")
    public Map<String,Object> updateIdoso(@RequestHeader(value="Authorization",required=false) String auth,@PathVariable String id,@RequestBody Map<String,Object> body) {
        checkIdoso(id,manager(auth));
        String birth=optional(body,"nascimento",10);
        if (!birth.isEmpty()) { date(birth); if (LocalDate.parse(birth).isAfter(LocalDate.now())) throw bad("Nascimento não pode estar no futuro."); }
        var previous=db.query("SELECT perfil FROM idosos WHERE id=?",id).getFirst();
        Map<String,Object> oldProfile=json.readValue(previous.get("perfil").toString(),Map.class);
        db.execute("UPDATE idosos SET nome=?,nascimento=?,observacoes=?,perfil=? WHERE id=?",required(body,"nome",150),birth,optional(body,"observacoes",2000),json.writeValueAsString(elderProfile(body,oldProfile)),id);
        db.execute("UPDATE users SET nome=? WHERE id IN (SELECT user_id FROM elder_accounts WHERE idoso_id=?)",required(body,"nome",150),id);
        return db.query("SELECT id,nome,nascimento,observacoes,perfil FROM idosos WHERE id=?",id).getFirst();
    }
    private Map<String,Object> elderProfile(Map<String,Object> body,Map<String,Object> old) {
        Map<String,Object> profile=new LinkedHashMap<>(old);
        for (String key:List.of("email","cpf","rg","telefone","celular","cep","rua","bairro","cidade","estado","numero","complemento"))
            if (body.containsKey(key)) profile.put(key,optional(body,key,key.equals("email")?254:300));
        String email=profile.getOrDefault("email","").toString();
        if (!email.isEmpty() && !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) throw bad("Informe um e-mail válido para o idoso.");
        return profile;
    }
    private void requireCompleteElder(Map<String,Object> person,Map<String,Object> profile) {
        if (person.get("nascimento")==null || person.get("nascimento").toString().isBlank()) throw bad("Complete a data de nascimento do idoso antes de gerar o QR Code.");
        for (String key:List.of("rg","rua","bairro","cidade","numero"))
            if (profile.getOrDefault(key,"").toString().isBlank()) throw bad("Complete o cadastro do idoso antes de gerar o QR Code: "+key+".");
        if (profile.getOrDefault("cpf","").toString().replaceAll("\\D","").length()!=11) throw bad("Informe o CPF do idoso com 11 dígitos.");
        if (profile.getOrDefault("celular","").toString().replaceAll("\\D","").length()<10) throw bad("Informe o celular do idoso com DDD.");
        if (profile.getOrDefault("cep","").toString().replaceAll("\\D","").length()!=8) throw bad("Informe o CEP do idoso com 8 dígitos.");
        if (!profile.getOrDefault("estado","").toString().matches("[A-Za-z]{2}")) throw bad("Informe o estado do idoso com duas letras.");
    }
    // Busca os registros de um tipo específico (consultas, medicamentos, rotinas ou memórias).
    @GetMapping("/registros")
    public List<Map<String,Object>> list(@RequestHeader(value="Authorization",required=false) String auth,@RequestParam String tipo,@RequestParam String idosoId) {
        String owner=owner(auth); checkType(tipo); checkIdoso(idosoId,owner);
        return db.query("SELECT id,idoso_id AS idosoId,tipo,titulo,data,horario,detalhes,status,categoria,midia FROM registros WHERE owner_id=? AND idoso_id=? AND tipo=? ORDER BY data,horario",dataOwner(owner),idosoId,tipo);
    }

    // Cria um novo item de registro, como consulta, medicamento, rotina ou memória.
    @PostMapping("/registros")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> create(@RequestHeader(value="Authorization",required=false) String auth,@RequestBody Map<String,Object> body) {
        String owner=owner(auth),id=UUID.randomUUID().toString(),idoso=required(body,"idosoId",80),tipo=required(body,"tipo",30);
        checkType(tipo); checkIdoso(idoso,owner);
        String titulo=required(body,"titulo",200),data=required(body,"data",10),horario=optional(body,"horario",5);
        date(data); time(horario);
        String category=category(body),media=media(body,category);
        db.execute("INSERT INTO registros(id,owner_id,idoso_id,tipo,titulo,data,horario,detalhes,status,categoria,midia) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                id,dataOwner(owner),idoso,tipo,titulo,data,horario,optional(body,"detalhes",4000),"pendente",category,media);
        return record(id,owner);
    }
    @PutMapping("/registros/{id}")
    public Map<String,Object> update(@RequestHeader(value="Authorization",required=false) String auth,@PathVariable String id,@RequestBody Map<String,Object> body) {
        String owner=owner(auth); var previous=record(id,owner);
        String titulo=required(body,"titulo",200),data=required(body,"data",10),horario=optional(body,"horario",5),status=required(body,"status",20);
        if (!Set.of("pendente","concluido").contains(status)) throw bad("Status inválido.");
        date(data); time(horario);
        Map<String,Object> merged=new HashMap<>(previous); merged.putAll(body);
        String category=category(merged),media=media(merged,category);
        db.execute("UPDATE registros SET titulo=?,data=?,horario=?,detalhes=?,status=?,categoria=?,midia=? WHERE id=? AND owner_id=?",
                titulo,data,horario,optional(body,"detalhes",4000),status,category,media,id,dataOwner(owner));
        return record(id,owner);
    }
    @DeleteMapping("/registros/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader(value="Authorization",required=false) String auth,@PathVariable String id) {
        String owner=owner(auth);
        record(id,owner);
        if (db.execute("DELETE FROM registros WHERE id=? AND owner_id=?",id,dataOwner(owner))==0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Registro não encontrado.");
    }
    // Garante que a pessoa autenticada tem permissão de gerenciar o idoso.
    private String manager(String auth) {
        String id=owner(auth);
        if (!Set.of("responsavel","cuidador").contains(user(id).get("tipo")))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Esta ação é do cuidador ou responsável.");
        return id;
    }
    private String dataOwner(String userId) {
        var rows=db.query("SELECT i.owner_id FROM idosos i JOIN elder_accounts a ON a.idoso_id=i.id WHERE a.user_id=?",userId);
        return rows.isEmpty()?userId:rows.getFirst().get("owner_id").toString();
    }
    private Map<String,Object> session(String id) {
        byte[] bytes=new byte[32]; new SecureRandom().nextBytes(bytes);
        String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        db.execute("DELETE FROM sessions WHERE expires<=?",Instant.now().getEpochSecond());
        db.execute("INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)",hash(token),id,Instant.now().plusSeconds(43200).getEpochSecond());
        return Map.of("token",token,"usuario",user(id));
    }
    private Map<String,Object> user(String id) {
        return db.query("SELECT id,nome,email,tipo,perfil FROM users WHERE id=?",id).getFirst();
    }
    private String owner(String authorization) {
        if (authorization==null || !authorization.startsWith("Bearer ")) throw unauthorized();
        var rows=db.query("SELECT user_id FROM sessions WHERE token=? AND expires>?",hash(authorization.substring(7)),Instant.now().getEpochSecond());
        if (rows.isEmpty()) throw unauthorized();
        return rows.getFirst().get("user_id").toString();
    }
    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Entre na sua conta para continuar.");
    }
    private void checkIdoso(String id,String owner) {
        if (db.query("SELECT id FROM idosos WHERE id=? AND (owner_id=? OR id IN (SELECT idoso_id FROM elder_accounts WHERE user_id=?))",id,owner,owner).isEmpty())
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Idoso não encontrado nesta conta.");
    }
    private Map<String,Object> record(String id,String owner) {
        var rows=db.query("SELECT id,idoso_id AS idosoId,tipo,titulo,data,horario,detalhes,status,categoria,midia FROM registros WHERE id=? AND owner_id=?",id,dataOwner(owner));
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Registro não encontrado.");
        checkIdoso(rows.getFirst().get("idosoId").toString(),owner);
        return rows.getFirst();
    }
    // Valida o tipo de registro e garante que o app só envie valores permitidos.
    private void checkType(String tipo) { if (!TIPOS.contains(tipo)) throw bad("Tipo de registro inválido."); }

    // Normaliza e valida campos opcionais como categoria, imagem e links.
    private String category(Map<String,Object> body) {
        String value=optional(body,"categoria",30);
        if (value.isEmpty()) return "Histórias";
        if (!Set.of("Fotos","Vídeos","Áudios","Histórias").contains(value)) throw bad("Categoria inválida.");
        return value;
    }
    private String media(Map<String,Object> body,String category) {
        String value=optional(body,"midia",4000000);
        if (value.isEmpty()) return value;
        if (category.equals("Fotos") && value.matches("^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$")) {
            try { Base64.getDecoder().decode(value.substring(value.indexOf(',')+1)); return value; }
            catch(IllegalArgumentException e) { throw bad("Imagem inválida."); }
        }
        try {
            var uri=java.net.URI.create(value);
            if ((uri.getScheme().equals("https") || uri.getScheme().equals("http")) && uri.getHost()!=null && uri.getUserInfo()==null) return value;
        } catch(Exception ignored) { }
        throw bad("Escolha uma foto válida ou informe um link http/https.");
    }
    private void date(String value) {
        try {
            if (!value.matches("\\d{4}-\\d{2}-\\d{2}")) throw new IllegalArgumentException();
            LocalDate.parse(value);
        } catch(Exception e) { throw bad("Use uma data válida no formato AAAA-MM-DD."); }
    }
    private void time(String value) {
        if (value.isEmpty()) return;
        try {
            if (!value.matches("\\d{2}:\\d{2}")) throw new IllegalArgumentException();
            LocalTime.parse(value);
        } catch(Exception e) { throw bad("Use um horário válido no formato HH:MM."); }
    }
    private String email(Map<String,Object> body) {
        String value=required(body,"email",254).toLowerCase(Locale.ROOT);
        if (!value.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) throw bad("Informe um e-mail válido.");
        return value;
    }
    private String password(Map<String,Object> body) {
        String value=required(body,"senha",72);
        if (value.length()<8 || value.getBytes(StandardCharsets.UTF_8).length>72)
            throw bad("A senha deve ter no mínimo 8 caracteres e no máximo 72 bytes.");
        return value;
    }
    private String optional(Map<String,Object> body,String key,int max) {
        Object raw=body.get(key);
        if (raw==null) return "";
        if (!(raw instanceof String)) throw bad("Campo inválido: "+key);
        String value=key.equals("senha")?(String)raw:((String)raw).trim();
        if (value.length()>max) throw bad("Campo muito longo: "+key);
        return value;
    }
    private String required(Map<String,Object> body,String key,int max) {
        String value=optional(body,key,max);
        if (value.isBlank()) throw bad("Preencha o campo "+key+".");
        return value;
    }
    private ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
    private String hash(String token) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
        catch(NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
