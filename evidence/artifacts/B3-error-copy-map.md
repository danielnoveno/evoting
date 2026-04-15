# B3-error-copy-map

## Mapping custom error kontrak -> pesan Indonesia (frontend)

| Contract Error | Copy Indonesia (user-facing) |
|---|---|
| NotPlatformAdmin / NotAdmin | Hanya admin yang dapat melakukan aksi ini. |
| NotSuperAdmin | Hanya Super Admin yang dapat melakukan aksi ini. |
| NotRegistered | Wallet kamu belum terdaftar sebagai pemilih di ruang ini. |
| WrongPhase | Aksi ini tidak tersedia pada fase voting saat ini. |
| AlreadyCommitted | Kamu sudah mengirim commit. |
| AlreadyRevealed | Kamu sudah melakukan konfirmasi suara. |
| CommitmentMismatch | Salt tidak cocok dengan komitmen. Periksa data commit kamu. |
| ElectionSuspended | Pemilihan sedang ditangguhkan oleh Super Admin. |
| ElectionTerminated | Pemilihan telah dihentikan oleh Super Admin. |

## Catatan
- Semua copy tetap Bahasa Indonesia.
- Detail teknis (hash/revert raw) tetap tersedia untuk audit melalui link Basescan, bukan sebagai pesan utama.
