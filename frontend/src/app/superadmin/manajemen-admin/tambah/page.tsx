import { redirect } from 'next/navigation'

export default function SuperadminTambahAdminRedirectPage() {
  redirect('/superadmin/manajemen-admin?tab=tambah')
}
