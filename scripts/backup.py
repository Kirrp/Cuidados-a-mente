"""Backup SQLite + mídias em arquivo AES-256-GCM; restaura somente em pasta nova."""

from __future__ import annotations
from contextlib import closing
import argparse, hashlib, json, os, re, sqlite3, tempfile, zipfile
from datetime import datetime, timezone
from pathlib import Path
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

MAGIC = b"CAMBACK1"


def referencias_midia(con) -> list[str]:
    ids = [r[0] for r in con.execute("SELECT id FROM media_files")]
    if any(
        not isinstance(ident, str) or not re.fullmatch(r"[a-f0-9-]{36}", ident) for ident in ids
    ):
        raise ValueError("Identificador de mídia inválido.")
    return ids


def chave(arquivo: Path) -> bytes:
    valor = bytes.fromhex(arquivo.read_text().strip())
    if len(valor) != 32:
        raise ValueError("A chave deve ter 32 bytes em hexadecimal.")
    return valor


def digest(arquivo: Path) -> str:
    h = hashlib.sha256()
    with arquivo.open("rb") as f:
        for b in iter(lambda: f.read(65536), b""):
            h.update(b)
    return h.hexdigest()


def cifrar(origem: Path, destino: Path, segredo: bytes):
    nonce = os.urandom(12)
    ctx = Cipher(algorithms.AES(segredo), modes.GCM(nonce)).encryptor()
    ctx.authenticate_additional_data(MAGIC)
    with origem.open("rb") as entrada, destino.open("xb") as saida:
        saida.write(MAGIC + nonce)
        for b in iter(lambda: entrada.read(65536), b""):
            saida.write(ctx.update(b))
        saida.write(ctx.finalize() + ctx.tag)
    os.chmod(destino, 0o600)


def decifrar(origem: Path, destino: Path, segredo: bytes):
    with origem.open("rb") as entrada:
        if entrada.read(8) != MAGIC:
            raise ValueError("Formato de backup inválido.")
        nonce = entrada.read(12)
        tamanho = origem.stat().st_size - 36
        if tamanho < 0:
            raise ValueError("Backup incompleto.")
        entrada.seek(-16, 2)
        tag = entrada.read(16)
        entrada.seek(20)
        ctx = Cipher(algorithms.AES(segredo), modes.GCM(nonce, tag)).decryptor()
        ctx.authenticate_additional_data(MAGIC)
        with destino.open("xb") as saida:
            while tamanho:
                b = entrada.read(min(65536, tamanho))
                if not b:
                    raise ValueError("Backup incompleto.")
                tamanho -= len(b)
                saida.write(ctx.update(b))
            saida.write(ctx.finalize())


def criar(args):
    if not args.api_stopped:
        raise ValueError("Pause a API e use --api-stopped para manter banco e mídias consistentes.")
    banco = args.database.resolve()
    midia = args.media.resolve()
    saida = args.output.resolve()
    saida.mkdir(parents=True, exist_ok=True)
    if not banco.is_file() or not midia.is_dir():
        raise ValueError("Informe o banco e a pasta de mídia existentes.")
    with tempfile.TemporaryDirectory(prefix="cam-staging-", dir=saida) as temp:
        staging = Path(temp)
        db = staging / "cuidados.db"
        with closing(sqlite3.connect(banco.as_uri() + "?mode=ro", uri=True)) as origem, closing(
            sqlite3.connect(db)
        ) as destino:
            origem.backup(destino)
        with closing(sqlite3.connect(db)) as con:
            if con.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise ValueError("Banco inconsistente.")
            ids = referencias_midia(con)
        arquivos = {"cuidados.db": db}
        for ident in ids:
            arquivo = midia / ident
            if arquivo.is_symlink() or not arquivo.is_file():
                raise ValueError("Uma mídia referenciada está indisponível.")
            arquivos["media/" + ident] = arquivo
        manifest = {
            "formato": 1,
            "criadoEm": datetime.now(timezone.utc).isoformat(),
            "arquivos": {nome: digest(f) for nome, f in arquivos.items()},
        }
        pacote = staging / "backup.zip"
        with zipfile.ZipFile(pacote, "x", zipfile.ZIP_DEFLATED) as z:
            z.writestr("manifest.json", json.dumps(manifest))
            for nome, f in arquivos.items():
                z.write(f, nome)
        final = saida / (
            "cuidados-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + ".cam"
        )
        cifrar(pacote, final, chave(args.key_file))
    print(str(final))


def restaurar(args):
    destino = args.destination.resolve()
    if destino.exists():
        raise ValueError("A restauração exige uma pasta nova; não sobrescreve dados.")
    destino.parent.mkdir(parents=True, exist_ok=True)
    # Autenticidade, caminhos e checksums são validados antes de publicar a restauração.
    with tempfile.TemporaryDirectory(prefix="cam-restore-", dir=destino.parent) as temp:
        staging = Path(temp)
        pacote = staging / "backup.zip"
        decifrar(args.archive.resolve(), pacote, chave(args.key_file))
        prepared = staging / "restaurado"
        prepared.mkdir(mode=0o700)
        with zipfile.ZipFile(pacote) as z:
            manifest = json.loads(z.read("manifest.json"))
            if manifest.get("formato") != 1:
                raise ValueError("Versão de backup inválida.")
            esperado = manifest["arquivos"]
            if "cuidados.db" not in esperado:
                raise ValueError("Banco ausente no backup.")
            if (
                set(z.namelist()) != set(esperado) | {"manifest.json"}
                or len(z.namelist()) != len(esperado) + 1
            ):
                raise ValueError("Conteúdo inesperado.")
            for nome, checksum in esperado.items():
                if nome != "cuidados.db" and not re.fullmatch(r"media/[a-f0-9-]{36}", nome):
                    raise ValueError("Caminho de arquivo inválido.")
                alvo = prepared / nome
                alvo.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
                with z.open(nome) as entrada, alvo.open("xb") as saida:
                    for b in iter(lambda: entrada.read(65536), b""):
                        saida.write(b)
                if digest(alvo) != checksum:
                    raise ValueError("Falha na integridade dos arquivos.")
                os.chmod(alvo, 0o600)
            (prepared / "media").mkdir(mode=0o700, exist_ok=True)
        with closing(
            sqlite3.connect((prepared / "cuidados.db").as_uri() + "?mode=ro", uri=True)
        ) as con:
            if con.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise ValueError("Banco restaurado inconsistente.")
            arquivos_referenciados = {"cuidados.db"} | {
                "media/" + ident for ident in referencias_midia(con)
            }
            if set(esperado) != arquivos_referenciados:
                raise ValueError("Mídias do backup divergem do banco restaurado.")
        prepared.rename(destino)
    print("Restauração validada em " + str(destino))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="acao", required=True)
    c = sub.add_parser("create")
    for nome in ["database", "media", "output", "key-file"]:
        c.add_argument("--" + nome, type=Path, required=True)
    c.add_argument("--api-stopped", action="store_true")
    r = sub.add_parser("restore")
    for nome in ["archive", "destination", "key-file"]:
        r.add_argument("--" + nome, type=Path, required=True)
    args = p.parse_args()
    try:
        (criar if args.acao == "create" else restaurar)(args)
    except Exception:
        p.exit(
            1,
            "Operação não concluída: confira caminhos, chave, integridade e estado da API. Dados ativos não foram substituídos.\n",
        )


if __name__ == "__main__":
    main()
