# Keamanan Company Brain (P4)

## Yang sudah diterapkan
1. Auth JWT + bcrypt, role `admin/user`, `/audit/logs` khusus admin
2. CORS ketat via `ALLOWED_ORIGINS` (default hanya localhost:3000, bukan `*`)
3. Validasi upload: allowlist ekstensi + batas MB + doc_type ketat
4. Rate-limit in-memory: login/chat/search/upload (anti brute-force & spam LLM)
5. Secret check: `/health.security_warnings` + `scripts/check_secrets.py --strict`
6. Audit log semua aksi sensitif (login, upload, index, search, chat, feedback)
7. Metrics tanpa data sensitif di `/metrics`

## Yang wajib dilakukan company sebelum go-live
- [ ] Ganti semua secret default, jalankan check_secrets --strict sampai LOLOS
- [ ] Ganti `SEED_ADMIN_PASSWORD`, buat user per karyawan, nonaktifkan sharing akun
- [ ] Batasi akses network: hanya VPN/intranet, jangan expose 5432/9000/6333 ke publik
- [ ] Aktifkan HTTPS (reverse proxy) untuk web/api di prod
- [ ] Tentukan retensi `audit_logs` + `chat_logs` (misal 90 hari) sesuai kebijakan data
- [ ] Review dokumen yang boleh di-index (jangan masukkan data sangat rahasia tanpa izin)
- [ ] Jadwal backup mingguan + uji restore 1x

## Batasan
- Rate-limit in-memory reset saat restart (untuk multi-replica gunakan Redis — TODO P5)
- Belum ada SSO/OIDC, masih username/password internal
- Belum ada PII redaction otomatis — jangan upload KTP/KK/password ke sistem ini
