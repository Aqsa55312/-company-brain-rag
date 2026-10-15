"""Cek secret default sebelum serah-terima ke company.
Jalan: python scripts/check_secrets.py [--env .env] [--strict]
Exit 1 jika ada default berbahaya (untuk CI / gate P4).
"""
import os
import sys

DEFAULTS = {
    "JWT_SECRET": ["ganti-ini", "dev-secret", ""],
    "SEED_ADMIN_PASSWORD": ["admin123", ""],
    "POSTGRES_PASSWORD": ["brain123", ""],
    "MINIO_ROOT_PASSWORD": ["minioadmin", ""],
}

def load_env(path: str) -> dict:
    vals: dict[str, str] = {}
    if not os.path.exists(path):
        return vals
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            vals[k.strip()] = v.strip()
    return vals

def main() -> int:
    env_path = ".env"
    strict = False
    for a in sys.argv[1:]:
        if a.startswith("--env="):
            env_path = a.split("=", 1)[1]
        elif a == "--strict":
            strict = True
        elif not a.startswith("-"):
            env_path = a
    file_vals = load_env(env_path)
    issues: list[str] = []
    for key, bads in DEFAULTS.items():
        val = os.getenv(key, file_vals.get(key, ""))
        if any(b in val or val == b for b in bads if b) or (key == "JWT_SECRET" and len(val) < 32):
            issues.append(f"{key} masih default/lemah di {env_path}")
    if issues:
        print("SECRET CHECK GAGAL:")
        for i in issues:
            print(f" - {i}")
        print("Perbaiki di .env prod sebelum serah-terima.")
        return 1
    print("SECRET CHECK LOLOS (tidak ada default berbahaya)")
    if not strict:
        print("Note: gunakan --strict di CI prod")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
