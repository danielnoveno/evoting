# V1-SUPABASE-VALIDATION-CHECKLIST

Status: ready-for-execution

## Validasi backend yang wajib dijalankan

### Session dan route guard
- Login email/password berhasil untuk voter
- Login email/password berhasil untuk admin
- Login email/password berhasil untuk superadmin
- Route `/admin` menolak user tanpa session
- Route `/superadmin` menolak role non-superadmin
- Route `/pemilih` menolak user tanpa profile backend

### Proposal draft
- Tambah proposal draft berhasil tersimpan di `app.proposal_drafts`
- Edit proposal draft memperbarui row yang sama
- Kandidat proposal tersimpan di `app.proposal_candidates`
- Whitelist draft dari form proposal tersimpan di `app.proposal_whitelist_entries`

### Whitelist import
- CSV valid diunggah ke storage private
- `whitelist_import_jobs` tercatat dengan `row_count` dan `invalid_count`
- Signed URL file impor dapat dibuat dan dibuka
- Bulk insert whitelist berhasil untuk wallet valid
- Baris invalid benar-benar diabaikan

### Security baseline
- Tidak ada salt/plain vote di Supabase
- Role guard admin/superadmin tidak memberi akses berlebih
- Bucket tetap private
- Signed URL kedaluwarsa sesuai TTL

### Thesis evidence
- Screenshot UI import history
- Screenshot proposal form live save
- Bukti row DB / dashboard Supabase
- Bukti file di storage
- Catatan batasan dan residual risk
