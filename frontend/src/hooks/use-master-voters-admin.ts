'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'

export type MasterVoter = {
  id: string
  nim: string
  fullName: string
  email: string
  prodi: string
  fakultas: string
  angkatan: string | null
  walletAddress: string | null
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  updatedAt: string
}

type MasterVoterRow = {
  id: string
  nim: string
  full_name: string
  email: string
  prodi: string
  fakultas: string
  angkatan: string | null
  wallet_address: string | null
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
}

export type MasterVoterUpdateInput = {
  id: string
  nim: string
  fullName: string
  prodi: string
  fakultas: string
  angkatan: string | null
  status: MasterVoter['status']
}

function mapRow(row: MasterVoterRow): MasterVoter {
  return {
    id: row.id,
    nim: row.nim,
    fullName: row.full_name,
    email: row.email,
    prodi: row.prodi,
    fakultas: row.fakultas,
    angkatan: row.angkatan,
    walletAddress: row.wallet_address,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getAccessToken() {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client.auth.getSession()
  if (error || !data.session?.access_token) throw new RepositoryError('Sesi superadmin tidak ditemukan. Silakan masuk ulang.')
  return data.session.access_token
}

async function readApiError(response: Response, fallback: string) {
  const payload: unknown = await response.json().catch(() => null)
  if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
    return payload.error
  }
  return fallback
}

export function useMasterVotersList() {
  return useQuery({
    queryKey: ['master-voters', 'all'],
    queryFn: async (): Promise<MasterVoter[]> => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

      const { data, error } = await client
        .schema('app')
        .from('master_voters')
        .select('*')
        .order('prodi', { ascending: true })
        .order('full_name', { ascending: true })

      if (error) throw new RepositoryError('Gagal memuat data master voter.')
      const rows = (data ?? []) as MasterVoterRow[]

      // Enrich: fill missing wallet_address from app_profiles
      const missingWalletEmails = rows
        .filter((r) => !r.wallet_address)
        .map((r) => r.email.trim().toLowerCase())

      if (missingWalletEmails.length > 0) {
        const { data: profiles } = await client
          .schema('app')
          .from('app_profiles')
          .select('email,wallet_address')
          .in('email', missingWalletEmails)
          .not('wallet_address', 'is', null)

        if (profiles && profiles.length > 0) {
          const walletMap = new Map<string, string>()
          for (const p of profiles) {
            if (p.email && p.wallet_address) {
              walletMap.set(p.email.trim().toLowerCase(), p.wallet_address)
            }
          }
          for (const row of rows) {
            if (!row.wallet_address) {
              const found = walletMap.get(row.email.trim().toLowerCase())
              if (found) row.wallet_address = found
            }
          }
        }
      }

      return rows.map(mapRow)
    },
    retry: false,
  })
}

export function useMasterVoterDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: ['master-voters', 'detail', id ?? 'unknown'],
    queryFn: async (): Promise<MasterVoter> => {
      if (!id) throw new RepositoryError('ID voter tidak ditemukan.')
      const token = await getAccessToken()
      const response = await fetch(`/api/superadmin/master-voters/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new RepositoryError(await readApiError(response, 'Gagal memuat detail voter.'))

      const payload: unknown = await response.json()
      if (!payload || typeof payload !== 'object' || !('voter' in payload)) throw new RepositoryError('Respons detail voter tidak valid.')
      return (payload as { voter: MasterVoter }).voter
    },
    enabled: Boolean(id),
    retry: false,
  })
}

export function useAddMasterVoter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      nim: string
      fullName: string
      email: string
      prodi: string
      fakultas?: string
      angkatan?: string
      walletAddress?: string
    }) => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

      const { data, error } = await client
        .schema('app')
        .from('master_voters')
        .insert({
          nim: input.nim,
          full_name: input.fullName,
          email: input.email,
          prodi: input.prodi,
          fakultas: input.fakultas ?? 'FTI',
          angkatan: input.angkatan ?? null,
          wallet_address: input.walletAddress ?? null,
          status: 'active',
        })
        .select('*')
        .single()

      if (error) {
        if (error.code === '23505') throw new RepositoryError('NIM sudah terdaftar di sistem.')
        throw new RepositoryError('Gagal menambahkan mahasiswa. Periksa data yang diisi.')
      }
      return mapRow(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['master-voters', 'all'] })
    },
  })
}

export function useDeleteMasterVoter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

      const { error } = await client
        .schema('app')
        .from('master_voters')
        .delete()
        .eq('id', id)

      if (error) throw new RepositoryError('Gagal menghapus data voter.')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['master-voters', 'all'] })
    },
  })
}

export function useUpdateMasterVoter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: MasterVoterUpdateInput): Promise<MasterVoter> => {
      const token = await getAccessToken()
      const response = await fetch(`/api/superadmin/master-voters/${encodeURIComponent(input.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nim: input.nim,
          fullName: input.fullName,
          prodi: input.prodi,
          fakultas: input.fakultas,
          angkatan: input.angkatan,
          status: input.status,
        }),
      })

      if (!response.ok) throw new RepositoryError(await readApiError(response, 'Gagal memperbarui data voter.'))

      const payload: unknown = await response.json()
      if (!payload || typeof payload !== 'object' || !('voter' in payload)) throw new RepositoryError('Respons update voter tidak valid.')
      return (payload as { voter: MasterVoter }).voter
    },
    onSuccess: (voter) => {
      void queryClient.invalidateQueries({ queryKey: ['master-voters', 'all'] })
      void queryClient.invalidateQueries({ queryKey: ['master-voters', 'detail', voter.id] })
    },
  })
}

export function useBulkDeleteMasterVoters() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

      const { error } = await client
        .schema('app')
        .from('master_voters')
        .delete()
        .in('id', ids)

      if (error) throw new RepositoryError('Gagal menghapus data voter terpilih.')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['master-voters', 'all'] })
    },
  })
}

export function useBulkInsertMasterVoters() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rows: Array<{
      nim: string
      full_name: string
      email: string
      prodi: string
      fakultas?: string
    }>) => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

      const { data, error } = await client
        .schema('app')
        .from('master_voters')
        .insert(rows.map((r) => ({
          nim: r.nim,
          full_name: r.full_name,
          email: r.email,
          prodi: r.prodi,
          fakultas: r.fakultas ?? 'FTI',
          status: 'active' as const,
        })))
        .select('id')

      if (error) throw new RepositoryError('Gagal mengimpor data voter. Periksa format data.')
      return data?.length ?? 0
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['master-voters', 'all'] })
    },
  })
}
