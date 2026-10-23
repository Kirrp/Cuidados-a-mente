"""Restauração, autenticidade e proteção contra sobrescrita em dados sintéticos."""

from contextlib import closing
import importlib.util, json, os, sqlite3, tempfile, unittest, uuid, zipfile
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("cam_backup", ROOT / "scripts/backup.py")
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class BackupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        (ROOT / "work").mkdir(exist_ok=True)

    def test_roundtrip_integridade_e_sobrescrita(self):
        with tempfile.TemporaryDirectory(dir=ROOT / "work", prefix="backup-test-") as temp:
            p = Path(temp)
            (p / "media").mkdir()
            ident = str(uuid.uuid4())
            (p / "media" / ident).write_bytes(b"midia sintetica")
            db = p / "data.db"
            with closing(sqlite3.connect(db)) as con:
                con.execute("CREATE TABLE media_files(id TEXT)")
                con.execute("INSERT INTO media_files VALUES(?)", (ident,))
                con.execute("CREATE TABLE registros(titulo TEXT)")
                con.execute("INSERT INTO registros VALUES('Teste')")
                con.commit()
            key = p / "chave"
            key.write_text("aa" * 32)
            args = SimpleNamespace(
                api_stopped=True, database=db, media=p / "media", output=p / "backups", key_file=key
            )
            backup.criar(args)
            archive = next((p / "backups").glob("*.cam"))
            dest = p / "restaurado"
            restore = SimpleNamespace(destination=dest, archive=archive, key_file=key)
            backup.restaurar(restore)
            with closing(sqlite3.connect(dest / "cuidados.db")) as con:
                self.assertEqual(con.execute("SELECT titulo FROM registros").fetchone()[0], "Teste")
            self.assertEqual((dest / "media" / ident).read_bytes(), b"midia sintetica")
            if os.name != "nt":
                self.assertEqual(dest.stat().st_mode & 0o777, 0o700)
                self.assertEqual((dest / "media").stat().st_mode & 0o777, 0o700)
                self.assertEqual((dest / "cuidados.db").stat().st_mode & 0o777, 0o600)
                self.assertEqual((dest / "media" / ident).stat().st_mode & 0o777, 0o600)
            with self.assertRaises(ValueError):
                backup.restaurar(restore)
            self.assertNotIn(b"midia sintetica", archive.read_bytes())
            damaged = p / "alterado.cam"
            content = bytearray(archive.read_bytes())
            content[30] ^= 1
            damaged.write_bytes(content)
            restore.archive = damaged
            restore.destination = p / "invalido"
            with self.assertRaises(Exception):
                backup.restaurar(restore)
            self.assertFalse(restore.destination.exists())
            key.write_text("bb" * 32)
            restore.archive = archive
            with self.assertRaises(Exception):
                backup.restaurar(restore)
            self.assertFalse(restore.destination.exists())

    def test_restauracao_rejeita_midias_divergentes_do_banco(self):
        with tempfile.TemporaryDirectory(dir=ROOT / "work", prefix="backup-test-") as temp:
            p = Path(temp)
            (p / "media").mkdir()
            ident = str(uuid.uuid4())
            (p / "media" / ident).write_bytes(b"midia sintetica")
            db = p / "data.db"
            with closing(sqlite3.connect(db)) as con:
                con.execute("CREATE TABLE media_files(id TEXT)")
                con.execute("INSERT INTO media_files VALUES(?)", (ident,))
                con.commit()
            key = p / "chave"
            key.write_text("aa" * 32)
            backup.criar(
                SimpleNamespace(
                    api_stopped=True,
                    database=db,
                    media=p / "media",
                    output=p / "backups",
                    key_file=key,
                )
            )
            archive = next((p / "backups").glob("*.cam"))
            original = p / "original.zip"
            backup.decifrar(archive, original, backup.chave(key))
            with zipfile.ZipFile(original) as z:
                arquivos = {nome: z.read(nome) for nome in z.namelist()}
            for caso in ["ausente", "extra"]:
                with self.subTest(caso=caso):
                    conteudo = dict(arquivos)
                    manifest = json.loads(conteudo["manifest.json"])
                    if caso == "ausente":
                        del conteudo["media/" + ident]
                        del manifest["arquivos"]["media/" + ident]
                    else:
                        extra = "media/" + str(uuid.uuid4())
                        conteudo[extra] = b"midia extra"
                        import hashlib

                        manifest["arquivos"][extra] = hashlib.sha256(conteudo[extra]).hexdigest()
                    conteudo["manifest.json"] = json.dumps(manifest).encode()
                    pacote = p / (caso + ".zip")
                    with zipfile.ZipFile(pacote, "x") as z:
                        for nome, valor in conteudo.items():
                            z.writestr(nome, valor)
                    alterado = p / (caso + ".cam")
                    backup.cifrar(pacote, alterado, backup.chave(key))
                    destino = p / ("restore-" + caso)
                    with self.assertRaisesRegex(ValueError, "Mídias do backup divergem"):
                        backup.restaurar(
                            SimpleNamespace(destination=destino, archive=alterado, key_file=key)
                        )
                    self.assertFalse(destino.exists())


if __name__ == "__main__":
    unittest.main()
