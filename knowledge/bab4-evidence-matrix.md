# BAB IV Evidence Matrix

Snapshot: 2026-04-08 (berdasarkan isi repo saat ini).

Gunakan matriks ini untuk mengikat narasi BAB IV dengan bukti yang benar-benar ada.

Status legend:
- `ready`: bukti sudah cukup untuk ditulis sebagai `safe claim`
- `partial`: bukti awal ada, tapi masih butuh artefak teknis tambahan
- `missing`: belum ada bukti implementasi yang bisa dipertanggungjawabkan

| Section BAB IV | Klaim yang dibuktikan | Artifact id | Bukti saat ini (repo path) | Status | Gap bukti | Bukti wajib final |
|---|---|---|---|---|---|---|
| 4.2.1 Kebutuhan Fungsional | Kebutuhan fitur e-voting sudah didefinisikan jelas | `DOC-FUNC-01` | `.docs/agent-references/PRD.md`; `.docs/agent-references/04-screen-specs.md`; `.docs/AGENTS.md`; `bab 4DRAF LAPORAN TUGAS AKHIR.docx` (bagian 4.2.1) | partial | Belum ada trace requirement -> file implementasi | Tabel mapping kebutuhan -> file kode -> test case id |
| 4.2.2 Kebutuhan Non-Fungsional | Keamanan, usability, dan auditability telah ditetapkan | `DOC-NFR-01` | `.docs/AGENTS.md`; `.docs/agent-references/03-ux-patterns.md`; `.opencode/skills/security-baseline.skill.md`; `bab 4DRAF LAPORAN TUGAS AKHIR.docx` (bagian 4.2.2) | partial | Belum ada metrik hasil aktual (mis. SUS final, latency, pass-rate test) | Rekap metrik evaluasi aktual + sumber data mentah |
| 4.2.3 Analisis Risiko Keamanan | Risiko utama dan mitigasi sudah terstruktur | `SEC-RISK-01` | `bab 4DRAF LAPORAN TUGAS AKHIR.docx` (Tabel 4.1); `.opencode/knowledge/security-threat-model-template.md` | partial | Belum ada link risiko -> kontrol implementasi -> test id | Threat model terisi + control-to-test matrix |
| 4.3.1 Arsitektur Sistem | Arsitektur 3 lapis (contract/indexer/frontend) konsisten | `ARCH-01` | `.opencode/knowledge/project-context.md`; `.docs/agent-references/05-implementation.md` (struktur folder); `bab 4DRAF LAPORAN TUGAS AKHIR.docx` (4.3.1) | partial | Belum ada diagram/folder implementasi nyata di repo utama | Diagram arsitektur final + bukti direktori proyek berjalan |
| 4.3.2 Arsitektur Smart Contract | Fungsi dan guard smart contract sudah terdefinisi | `ARCH-SC-01` | `.docs/agent-references/05-implementation.md` (pola `commitVote/revealVote`); `.docs/AGENTS.md` (security baseline); `bab 4DRAF LAPORAN TUGAS AKHIR.docx` (4.3.2) | partial | Tidak ditemukan file `.sol` di repo ini saat snapshot | File contract final + tabel fungsi->modifier->invariant |
| 4.3.3 Alur Commit-Reveal | Urutan commit-reveal benar dan dapat dijelaskan | `FLOW-CR-01` | `.docs/agent-references/05-implementation.md` (commitment helpers/hooks); `.opencode/skills/commit-reveal-flow.skill.md`; `.docs/agent-references/04-screen-specs.md` (vote/reveal pages); `bab 4DRAF LAPORAN TUGAS AKHIR.docx` (4.3.3) | partial | Belum ada bukti eksekusi end-to-end (tx nyata + screenshot flow) | Bukti E2E commit->reveal + tx hash + screenshot state |
| 4.4.1 Implementasi Smart Contract | Kontrak Solidity sudah diimplementasikan sesuai desain | `IMP-SC-01` | Referensi desain ada di `.docs/agent-references/05-implementation.md`; narasi ada di `bab 4DRAF LAPORAN TUGAS AKHIR.docx` (4.4.1) | missing | Tidak ada source contract/foundry project di repo ini saat snapshot | Source `src/*.sol` + `foundry.toml` + compile log |
| 4.4.2 Pengujian Unit dengan Forge | Unit test mencakup positive + negative paths | `TEST-FORGE-01` | Checklist ada di `.opencode/agents/votechain-foundry.md`; narasi ada di `bab 4DRAF LAPORAN TUGAS AKHIR.docx` (4.4.2) | missing | Tidak ada file test Forge atau output test di repo ini saat snapshot | File `test/*.t.sol` + output `forge test` + test id NEG-* |
| 4.4.x Deployment dan Verifikasi | Deployment ke Base Sepolia dan verifikasi publik berhasil | `DEPLOY-01` | Aturan proof di `.opencode/skills/basescan-proof.skill.md`; helper link di `.docs/agent-references/05-implementation.md` | missing | Belum ada daftar contract address, tx hash, dan link verifikasi | Deployment record: address, chain id 84532, tx hash, link Basescan |
| 4.5 Evaluasi Sistem | Evaluasi keamanan + usability didukung data nyata | `EVAL-01` | Checklist di `.opencode/knowledge/thesis-evidence-checklist.md`; guardrail klaim di `.opencode/skills/thesis-claim-discipline.skill.md`; narasi di `bab 4DRAF LAPORAN TUGAS AKHIR.docx` (4.5) | partial | Belum ada data hasil evaluasi yang dapat diaudit ulang | Paket evaluasi: security findings, SUS raw score, interpretasi, limitasi |

## Aturan klaim untuk BAB IV/V
- `safe claim`: hanya jika status `ready` dan bukti bisa direproduksi.
- `bounded claim`: boleh untuk status `partial`, wajib tulis batasannya.
- `unsupported claim`: jika status `missing`, tidak boleh masuk kesimpulan.

## Prioritas penutupan gap (urutan kerja)
1. Tutup `IMP-SC-01` dan `TEST-FORGE-01` (inti validitas teknis BAB IV).
2. Tutup `DEPLOY-01` (auditabilitas publik via Basescan).
3. Lengkapi `EVAL-01` (hasil keamanan + SUS untuk BAB V).
4. Kunci konsistensi istilah dan network melalui `thesis-consistency-register`.
