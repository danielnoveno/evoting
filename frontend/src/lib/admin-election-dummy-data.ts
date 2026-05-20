import { sharedDummyContext } from '@/lib/dummy-shared-context'

export type AdminElectionStatus = 'aktif' | 'selesai'

export type AdminElectionRecord = {
  id: string
  title: string
  meta: string
  status: AdminElectionStatus
  badge: string
  iconTone: 'emerald' | 'orange' | 'blue'
  actionLabel: string
  actionTone: 'indigo' | 'slate' | 'blue'
  secondaryActionLabel?: string
  code: string
  periodLabel: string
  turnoutLabel: string
  commits?: {
    total: string
    target: string
    hash: string
    revealStart: string
    integrity: string
  }
  detail: {
    statusPill: string
    candidates: Array<{
      id: string
      number: string
      name: string
      faculty: string
      summary: string
      imageTone: 'dark' | 'neutral'
      identityNumber: string
      bio: string
      vision: string
      mission: string
    }>
    blockchainAnchor: string
    blockchainNetworkLabel: string
    turnout: {
      total: string
      target: string
      percentage: string
      progressWidthClassName: string
      note: string
    }
    quickActions: Array<{
      label: string
      icon: 'download' | 'share' | 'audit' | 'report'
    }>
    whitelist: {
      total: string
      target: string
      integrityTitle: string
      integrityDescription: string
      evidence: string
      evidenceStatus: string
      records: Array<{
        wallet: string
        name: string
        status: 'verified' | 'pending'
        addedAt: string
      }>
      uploadSupport: string
    }
    parameterVoting: {
      phaseTitle: string
      phaseDescription: string
      phaseOne: {
        label: string
        start: string
        end: string
      }
      phaseTwo: {
        label: string
        start: string
        end: string
      }
      consensus: {
        method: string
        quorum: string
        quorumProgressWidthClassName: string
        protectionTitle: string
        protectionDescription: string
      }
      contract: {
        address: string
        network: string
        version: string
        currentHash: string
      }
      privacy: {
        headline: string
        items: Array<{
          title: string
          description: string
        }>
        ctaLabel: string
      }
    }
    realtime: {
      connectedLabel: string
      totalVotes: string
      totalTarget: string
      participation: string
      remaining: {
        hours: string
        minutes: string
        seconds: string
        label: string
      }
      networkStatus: {
        title: string
        subtitle: string
      }
      results: Array<{
        candidateNumber: string
        candidateName: string
        votes: string
        percentage: string
        barWidthClassName: string
        tone: 'primary' | 'secondary'
      }>
      feed: Array<{
        tx: string
        time: string
        age: string
      }>
      guarantee: {
        title: string
        description: string
      }
    }
    monitoring: {
      title: string
      description: string
      currentPhase: string
      timeRemaining: string
      totalWhitelist: string
      totalCommits: string
      commitProgress: string
      totalReveals: string
      totalLogs: string
      dateRange: string
      categories: string[]
      selectedCategory: string
      actorSearchPlaceholder: string
      logRows: Array<{
        time: string
        timeMeta: string
        rangeKey: 'hari-ini' | '7-hari' | '30-hari'
        category: string
        actorName: string
        actorWallet: string
        action: string
        actionTone: 'blue' | 'amber' | 'slate' | 'purple'
        objectTitle: string
        objectMeta: string
        status: 'selesai' | 'berlangsung' | 'menunggu'
        hash: string
      }>
      functionPayload: string
      metadata: {
        browserAgent: string
        ipAddress: string
        security: string
      }
      guarantee: {
        title: string
        description: string
      }
    }
    candidateForm: {
      breadcrumbParent: string
      breadcrumbCurrent: string
      title: string
      description: string
      uploadLabel: string
      uploadHint: string
      uploadSupport: string
      identityLabel: string
      identityPlaceholder: string
      hashPreviewLabel: string
      fullNameLabel: string
      fullNamePlaceholder: string
      bioLabel: string
      bioPlaceholder: string
      visionLabel: string
      visionPlaceholder: string
      missionLabel: string
      missionPlaceholder: string
      validationTitle: string
      validationDescription: string
      validationStatus: string
    }
  }
}

function createWhitelistDetail(total: string, target: string, evidence: string, records: AdminElectionRecord['detail']['whitelist']['records']): AdminElectionRecord['detail']['whitelist'] {
  return {
    total,
    target,
    integrityTitle: 'Aman (Sync)',
    integrityDescription: 'Database tersinkronisasi sempurna dengan Smart Contract di Ethereum Network.',
    evidence,
    evidenceStatus: 'Merkle Root Anchor: Active',
    records,
    uploadSupport: 'Support: CSV, TXT, XLS',
  }
}

function createParameterVotingDetail(address: string, hash: string, phases: { commitStart: string; commitEnd: string; revealStart: string; revealEnd: string }): AdminElectionRecord['detail']['parameterVoting'] {
  return {
    phaseTitle: 'Konfigurasi Fase Blockchain',
    phaseDescription: 'Pengaturan waktu sinkronisasi state ledger',
    phaseOne: {
      label: 'Commit Phase',
      start: phases.commitStart,
      end: phases.commitEnd,
    },
    phaseTwo: {
      label: 'Reveal Phase',
      start: phases.revealStart,
      end: phases.revealEnd,
    },
    consensus: {
      method: 'Pluralitas / Majority',
      quorum: '51%',
      quorumProgressWidthClassName: 'w-[51%]',
      protectionTitle: 'Double Voting Protection',
      protectionDescription: 'Validated via Merkle Tree Inclusion',
    },
    contract: {
      address,
      network: 'Base Sepolia',
      version: 'v2.4-Amanah',
      currentHash: hash,
    },
    privacy: {
      headline: 'Integritas Data & Privasi',
      items: [
        {
          title: 'Commit-Reveal Cryptographic Proof',
          description: 'Verifikasi suara sah dilakukan melalui pencocokan hash commit-reveal pada blockchain.',
        },
        {
          title: 'Immutable Audit Trail',
          description: 'Setiap perubahan parameter dicatat secara permanen di blockchain untuk transparansi total.',
        },
      ],
      ctaLabel: 'Cek Verifikasi Node',
    },
  }
}

function createRealtimeDetail(totalVotes: string, totalTarget: string, participation: string, width: string, results: AdminElectionRecord['detail']['realtime']['results']): AdminElectionRecord['detail']['realtime'] {
  return {
    connectedLabel: 'Blockchain Connected',
    totalVotes,
    totalTarget,
    participation,
    remaining: {
      hours: '04',
      minutes: '12',
      seconds: '45',
      label: 'Perpanjang Durasi',
    },
    networkStatus: {
      title: 'Base Sepolia Testnet Active',
      subtitle: 'Block Height: #8,492,012',
    },
    results,
    feed: [
      { tx: '0x71C765...d8976f', time: '14:22:15 WIB', age: '1m ago' },
      { tx: '0xa3b211...f2e001', time: '14:20:02 WIB', age: '3m ago' },
      { tx: '0x2d98e1...c9918a', time: '14:18:44 WIB', age: '5m ago' },
    ],
    guarantee: {
      title: 'Immutability Guaranteed',
      description: 'Data suara terenkripsi dan tidak dapat diubah di ledger ini-BC.',
    },
  }
}

function createMonitoringDetail(config: {
  title: string
  description: string
  currentPhase: string
  timeRemaining: string
  totalWhitelist: string
  totalCommits: string
  commitProgress: string
  totalReveals: string
  totalLogs: string
  dateRange: string
  functionPayload: string
  logRows: AdminElectionRecord['detail']['monitoring']['logRows']
}): AdminElectionRecord['detail']['monitoring'] {
  return {
    ...config,
    categories: ['Semua Kategori', 'Update Phase', 'Whitelist', 'Sinkronisasi', 'Kandidat'],
    selectedCategory: 'Semua Kategori',
    actorSearchPlaceholder: 'Cari Alamat Wallet...',
    metadata: {
      browserAgent: 'Chrome 120.0 / macOS',
      ipAddress: '192.168.1.45 (Jakarta, ID)',
      security: 'Multi-Sig Verified',
    },
    guarantee: {
      title: 'Jaminan Keamanan Log',
      description: 'Setiap entri log ini telah ditandatangani secara kriptografis dan dicatat secara permanen di jaringan Base Blockchain. Perubahan pada log ini tidak dimungkinkan tanpa mematahkan integritas hash blockchain.',
    },
  }
}

const sharedCandidateFormFields = {
  uploadLabel: 'Foto Kandidat',
  uploadHint: 'Seret foto ke sini atau klik untuk unggah',
  uploadSupport: 'JPG, PNG (Maks 5MB)',
  identityLabel: 'ID Pemilih / NPM',
  hashPreviewLabel: 'Blockchain Hash Preview',
  fullNameLabel: 'Nama Lengkap',
  fullNamePlaceholder: 'Masukkan nama lengkap kandidat',
  bioLabel: 'Bio Singkat',
  bioPlaceholder: 'Satu kalimat yang mendefinisikan kandidat',
  visionLabel: 'Visi',
  visionPlaceholder: 'Apa tujuan besar yang ingin dicapai?',
  missionLabel: 'Misi',
  missionPlaceholder: 'Langkah-langkah konkret untuk mewujudkan visi (gunakan poin-poin jika perlu)',
  validationTitle: 'Validasi Data',
  validationStatus: 'Berlangsung',
}

const sharedQuickActions: AdminElectionRecord['detail']['quickActions'] = [
  { label: 'Unduh', icon: 'download' },
  { label: 'Bagikan Link', icon: 'share' },
  { label: 'Audit Log', icon: 'audit' },
  { label: 'Laporan Live', icon: 'report' },
]

/* ──────────────────────────────────────────────────────────────────────────────
 *  4 ELECTIONS — Semua milik admin UKM Riset dan Inovasi.
 *
 *  #1  Koordinator UKM Riset 2026  — AKTIF (Commit)   — 324 pemilih
 *  #2  Ketua Divisi Litbang 2026   — AKTIF (Reveal)   — 120 pemilih
 *  #3  Sekretaris UKM Riset 2025   — SELESAI          — 286 pemilih
 *  #4  Ketua Divisi Acara 2025     — SELESAI          —  54 pemilih
 * ────────────────────────────────────────────────────────────────────────────*/

export const adminElectionDummyData: AdminElectionRecord[] = [
  /* ── #1 Koordinator UKM Riset 2026 · COMMIT ────────────────────────────── */
  {
    id: sharedDummyContext.electionId,
    title: sharedDummyContext.proposalTitle,
    meta: `Commit dibuka 12–18 Juni 2026 • ${sharedDummyContext.voterEstimate} pemilih terdaftar`,
    status: 'aktif',
    badge: 'Fase Aktif: Commit',
    iconTone: 'emerald',
    actionLabel: 'Monitor Phase',
    actionTone: 'indigo',
    secondaryActionLabel: 'Kandidat',
    code: sharedDummyContext.electionCode,
    periodLabel: '12 Jun 2026 - 19 Jun 2026',
    turnoutLabel: `${sharedDummyContext.voterEstimate} pemilih terdaftar`,
    commits: {
      total: '218',
      target: String(sharedDummyContext.voterEstimate),
      hash: '0x71c...a3e4',
      revealStart: '19 Juni 2026, 09.00',
      integrity: 'Whitelist Aktif',
    },
    detail: {
      statusPill: 'Berlangsung',
      candidates: sharedDummyContext.candidates.map((candidate, index) => ({
        id: candidate.id,
        number: candidate.number,
        name: candidate.name,
        faculty: candidate.faculty,
        summary: candidate.summary,
        imageTone: index === 0 ? 'dark' : 'neutral',
        identityNumber: `22071${index + 600}`,
        bio: candidate.bio,
        vision: candidate.vision,
        mission: candidate.mission.join('; '),
      })),
      blockchainAnchor: '0x71C4B7E8A2F1D5E9C3A2B1D5E9C3A2B1D5E9C3A2B1D5E9C3A2B1D5E9C3A2B1D',
      blockchainNetworkLabel: 'Tervalidasi pada Base Sepolia',
      turnout: {
        total: '218',
        target: String(sharedDummyContext.voterEstimate),
        percentage: '67.3%',
        progressWidthClassName: 'w-[67.3%]',
        note: 'Memantau pembaruan commit dari smart contract secara berkala.',
      },
      quickActions: sharedQuickActions,
      whitelist: createWhitelistDetail(String(sharedDummyContext.voterEstimate), String(sharedDummyContext.voterEstimate), '0x71C7656EC7ab88b098defB75', [
        { wallet: '0x3fA...8dE2', name: 'Ahmad Zulfikar', status: 'verified', addedAt: '10 Jun 2026' },
        { wallet: '0x921...72C1', name: 'Maria Clarissa', status: 'verified', addedAt: '10 Jun 2026' },
        { wallet: '0xb42...D9a1', name: '—', status: 'pending', addedAt: 'Baru saja' },
        { wallet: '0x77c...E55a', name: 'Bambang Wijaya', status: 'verified', addedAt: '09 Jun 2026' },
      ]),
      parameterVoting: createParameterVotingDetail(
        sharedDummyContext.contractAddress,
        '0x892a3c71c1234567890abcdef1234567890abcdef1234567890abcdef1234567',
        { commitStart: '12 Jun 2026, 08:00', commitEnd: '18 Jun 2026, 18:00', revealStart: '19 Jun 2026, 09:00', revealEnd: '20 Jun 2026, 12:00' },
      ),
      realtime: createRealtimeDetail('218', String(sharedDummyContext.voterEstimate), '67%', 'w-[67%]', [
        { candidateNumber: '01', candidateName: sharedDummyContext.candidates[0].name, votes: '96', percentage: '44.0%', barWidthClassName: 'w-[44%]', tone: 'primary' },
        { candidateNumber: '02', candidateName: sharedDummyContext.candidates[1].name, votes: '72', percentage: '33.0%', barWidthClassName: 'w-[33%]', tone: 'secondary' },
        { candidateNumber: '03', candidateName: sharedDummyContext.candidates[2].name, votes: '50', percentage: '23.0%', barWidthClassName: 'w-[23%]', tone: 'secondary' },
      ]),
      monitoring: createMonitoringDetail({
        title: 'Detail Log Audit',
        description: 'Laporan aktivitas teknis terenkripsi dan perubahan status sistem pada Smart Contract Votein.',
        currentPhase: 'COMMIT',
        timeRemaining: '14:22:05',
        totalWhitelist: String(sharedDummyContext.voterEstimate),
        totalCommits: '218',
        commitProgress: '67%',
        totalReveals: '0',
        totalLogs: '284',
        dateRange: '10 Jun 2026 - 18 Jun 2026',
        functionPayload: `{
  "function": "setVotingPhase",
  "params": {
    "proposalId": 882,
    "newPhase": "OPEN_VOTING",
    "timestamp": 1781308800,
    "adminSignature": "0x...f2a91"
  },
  "gasUsed": "82,410",
  "blockchain": "Base Sepolia Testnet"
}`,
        logRows: [
          { time: '16 Jun 2026', timeMeta: '14:20:05 UTC', rangeKey: 'hari-ini', category: 'Update Phase', actorName: 'UKM Riset dan Inovasi', actorWallet: '0x71c ... 4f3', action: 'Update Smart Contract Phase', actionTone: 'blue', objectTitle: 'Koordinator UKM RI 2026', objectMeta: 'ID: UKM-RI-01', status: 'selesai', hash: '0x9f2 ... e32' },
          { time: '15 Jun 2026', timeMeta: '10:05:12 UTC', rangeKey: 'hari-ini', category: 'Whitelist', actorName: 'UKM Riset dan Inovasi', actorWallet: '0x71c ... 4f3', action: 'Add Whitelist Bulk', actionTone: 'amber', objectTitle: 'UKM Riset dan Inovasi', objectMeta: '64 Addresses Added', status: 'berlangsung', hash: '0x12b ... f88' },
          { time: '14 Jun 2026', timeMeta: '22:15:30 UTC', rangeKey: '7-hari', category: 'Sinkronisasi', actorName: 'Votein System', actorWallet: 'Automated (Cron)', action: 'Sync Blockchain State', actionTone: 'slate', objectTitle: 'Main Relay Node', objectMeta: 'RPC Timeout Error', status: 'menunggu', hash: 'N/A (Pending)' },
          { time: '13 Jun 2026', timeMeta: '09:12:00 UTC', rangeKey: '7-hari', category: 'Kandidat', actorName: 'UKM Riset dan Inovasi', actorWallet: '0x71c ... 4f3', action: 'Edit Profile Candidate', actionTone: 'purple', objectTitle: 'Kandidat #03 — Salsa Widyaningrum', objectMeta: 'Updated IPFS Hash', status: 'selesai', hash: '0x7d1 ... a44' },
        ],
      }),
      candidateForm: {
        breadcrumbParent: 'Manajemen Pemilihan',
        breadcrumbCurrent: 'Tambah Kandidat',
        title: 'Profil Kandidat',
        description: `Silakan lengkapi informasi detail kandidat untuk pemilihan ${sharedDummyContext.proposalTitle}. Pastikan data akurat sebelum sinkronisasi dummy on-chain.`,
        ...sharedCandidateFormFields,
        identityPlaceholder: 'Contoh: 220711663',
        validationDescription: 'Sistem otomatis akan memverifikasi NPM kandidat',
      },
    },
  },

  /* ── #2 Ketua Divisi Litbang UKM Riset 2026 · REVEAL ──────────────────── */
  {
    id: 'ketua-divisi-litbang-ukm-riset-2026',
    title: 'Pemilihan Ketua Divisi Litbang UKM Riset 2026',
    meta: 'Reveal berlangsung • 98 dari 120 pemilih sudah commit',
    status: 'aktif',
    badge: 'Fase Aktif: Reveal',
    iconTone: 'emerald',
    actionLabel: 'Monitor Phase',
    actionTone: 'indigo',
    secondaryActionLabel: 'Kandidat',
    code: 'UKM-2026-RI-02',
    periodLabel: '01 Mei 2026 - 08 Mei 2026',
    turnoutLabel: '120 pemilih terdaftar',
    commits: {
      total: '98',
      target: '120',
      hash: '0x91a...c7f2',
      revealStart: 'Sedang Berjalan',
      integrity: 'On-Chain Aktif',
    },
    detail: {
      statusPill: 'Berlangsung',
      candidates: [
        {
          id: 'cand-lb-01',
          number: '01',
          name: 'Fajar Nugroho',
          faculty: 'Informatika ’22',
          summary: 'Penguatan riset berbasis data dan kolaborasi lintas prodi untuk output penelitian berkualitas.',
          imageTone: 'dark',
          identityNumber: '220712301',
          bio: 'Aktif dalam tim riset mahasiswa dan pengembangan proyek berbasis data kampus.',
          vision: 'Membangun divisi litbang yang produktif, terukur, dan menghasilkan riset mahasiswa berdampak.',
          mission: 'Membuka jalur kolaborasi riset lintas prodi; menyusun roadmap publikasi tahunan; menginisiasi mentoring riset junior.',
        },
        {
          id: 'cand-lb-02',
          number: '02',
          name: 'Dinda Ayu Lestari',
          faculty: 'Teknik Industri ’22',
          summary: 'Fokus pada inkubasi ide inovasi dan pendampingan anggota dalam menulis proposal riset.',
          imageTone: 'neutral',
          identityNumber: '220712302',
          bio: 'Berpengalaman mendampingi anggota dalam menyusun proposal riset dan lomba inovasi.',
          vision: 'Menjadikan litbang sebagai ruang aman bereksperimen dan mengembangkan ide riset mahasiswa.',
          mission: 'Membuka program inkubasi ide riset; menyediakan template proposal standar; menyelenggarakan workshop penulisan ilmiah.',
        },
        {
          id: 'cand-lb-03',
          number: '03',
          name: 'Andi Setiawan',
          faculty: 'Sistem Informasi ’23',
          summary: 'Pengelolaan repositori riset digital dan penguatan arsip pengetahuan organisasi.',
          imageTone: 'neutral',
          identityNumber: '220712303',
          bio: 'Fokus pada digitalisasi arsip dan pengelolaan repositori karya riset anggota UKM.',
          vision: 'Mendorong litbang yang tertata, terdokumentasi, dan mudah diakses untuk regenerasi pengetahuan.',
          mission: 'Membangun repositori riset digital; merapikan arsip hasil kegiatan; dan menyusun database kompetensi anggota.',
        },
      ],
      blockchainAnchor: '0x91A7FA8D5C2B7E4A1F9C3D7B2E4A1F9C3D7B2E4A1F9C3D7B2E4A1F9C3D7B2E4',
      blockchainNetworkLabel: 'Tervalidasi pada Base Sepolia',
      turnout: {
        total: '98',
        target: '120',
        percentage: '81.7%',
        progressWidthClassName: 'w-[81.7%]',
        note: 'Pembaruan reveal mengikuti event kontrak dan penghitungan final berlangsung real-time.',
      },
      quickActions: sharedQuickActions,
      whitelist: createWhitelistDetail('98', '120', '0x91A7FA8D5C2B7E4A1F9C3D7B2E4A1F9C3D7B2E4', [
        { wallet: '0x18A...E123', name: 'Ahmad Zulfikar', status: 'verified', addedAt: '28 Apr 2026' },
        { wallet: '0x29B...91af', name: 'Rina Oktavia', status: 'verified', addedAt: '28 Apr 2026' },
        { wallet: '0x3c1...7a22', name: '—', status: 'pending', addedAt: 'Baru saja' },
        { wallet: '0x42d...c8f0', name: 'Yoga Pradana', status: 'verified', addedAt: '27 Apr 2026' },
      ]),
      parameterVoting: createParameterVotingDetail(
        '0x91A7FA8D5C2B7E4A1F9C3D7B2E4A1F9C3D7B2E4A',
        '0x991b3d55c1234567890abcdef1234567890abcdef1234567890abcdef1234567',
        { commitStart: '01 Mei 2026, 08:00', commitEnd: '05 Mei 2026, 18:00', revealStart: '06 Mei 2026, 09:00', revealEnd: '08 Mei 2026, 12:00' },
      ),
      realtime: createRealtimeDetail('98', '120', '81.7%', 'w-[81.7%]', [
        { candidateNumber: '01', candidateName: 'Fajar Nugroho', votes: '42', percentage: '42.9%', barWidthClassName: 'w-[42.9%]', tone: 'primary' },
        { candidateNumber: '02', candidateName: 'Dinda Ayu Lestari', votes: '34', percentage: '34.7%', barWidthClassName: 'w-[34.7%]', tone: 'secondary' },
        { candidateNumber: '03', candidateName: 'Andi Setiawan', votes: '22', percentage: '22.4%', barWidthClassName: 'w-[22.4%]', tone: 'secondary' },
      ]),
      monitoring: createMonitoringDetail({
        title: 'Detail Log Audit',
        description: 'Laporan aktivitas teknis terenkripsi dan perubahan status sistem pada Smart Contract Votein.',
        currentPhase: 'REVEAL',
        timeRemaining: '05:11:18',
        totalWhitelist: '120',
        totalCommits: '98',
        commitProgress: '82%',
        totalReveals: '46',
        totalLogs: '312',
        dateRange: '01 Mei 2026 - 08 Mei 2026',
        functionPayload: `{
  "function": "revealVote",
  "params": {
    "proposalId": 914,
    "candidateId": 2,
    "timestamp": 1746100210
  },
  "gasUsed": "64,901",
  "blockchain": "Base Sepolia Testnet"
}`,
        logRows: [
          { time: '07 Mei 2026', timeMeta: '16:14:11 UTC', rangeKey: 'hari-ini', category: 'Update Phase', actorName: 'UKM Riset dan Inovasi', actorWallet: '0x71c ... 4f3', action: 'Reveal Vote', actionTone: 'blue', objectTitle: 'Vote #082', objectMeta: 'Candidate #02', status: 'selesai', hash: '0x1ab ... 991' },
          { time: '06 Mei 2026', timeMeta: '14:05:45 UTC', rangeKey: 'hari-ini', category: 'Kandidat', actorName: 'UKM Riset dan Inovasi', actorWallet: '0x71c ... 4f3', action: 'Edit Candidate Profile', actionTone: 'purple', objectTitle: 'Kandidat #01 — Fajar Nugroho', objectMeta: 'Updated manifesto', status: 'selesai', hash: '0x2bc ... 118' },
          { time: '05 Mei 2026', timeMeta: '19:42:01 UTC', rangeKey: '7-hari', category: 'Update Phase', actorName: 'UKM Riset dan Inovasi', actorWallet: '0x71c ... 4f3', action: 'Open Reveal Phase', actionTone: 'blue', objectTitle: 'Litbang UKM RI 2026', objectMeta: 'Reveal Enabled', status: 'berlangsung', hash: '0x4c1 ... a88' },
        ],
      }),
      candidateForm: {
        breadcrumbParent: 'Manajemen Pemilihan',
        breadcrumbCurrent: 'Tambah Kandidat',
        title: 'Profil Kandidat',
        description: 'Lengkapi identitas dan visi kandidat untuk pemilihan Ketua Divisi Litbang. Semua data akan disiapkan untuk sinkronisasi on-chain setelah disimpan.',
        ...sharedCandidateFormFields,
        identityPlaceholder: 'Contoh: 220712301',
        validationDescription: 'Sistem otomatis akan memverifikasi NPM kandidat',
      },
    },
  },

  /* ── #3 Sekretaris UKM Riset 2025 · SELESAI ───────────────────────────── */
  {
    id: 'sekretaris-ukm-riset-2025',
    title: 'Pemilihan Sekretaris UKM Riset 2025',
    meta: 'Selesai 11 Mei 2026 • Partisipasi 91%',
    status: 'selesai',
    badge: 'Finalized',
    iconTone: 'blue',
    actionLabel: 'View Report',
    actionTone: 'blue',
    code: 'UKM-2025-RI-02',
    periodLabel: '01 Mei 2026 - 11 Mei 2026',
    turnoutLabel: '286 pemilih terdaftar',
    detail: {
      statusPill: 'Final',
      candidates: [
        {
          id: 'cand-31',
          number: '01',
          name: 'Alya Kharisma',
          faculty: 'Informatika ’22',
          summary: 'Penguatan tata kelola administrasi UKM dan dokumentasi program riset yang rapi.',
          imageTone: 'dark',
          identityNumber: '220712101',
          bio: 'Aktif di tim administrasi kegiatan dan pengarsipan program inovasi mahasiswa.',
          vision: 'Membangun sekretariat UKM yang rapi, transparan, dan mendukung seluruh program riset anggota.',
          mission: 'Merapikan administrasi; mempercepat dokumentasi; dan menjaga kesinambungan arsip program kerja.',
        },
        {
          id: 'cand-32',
          number: '02',
          name: 'Bagas Anindya',
          faculty: 'Sistem Informasi ’21',
          summary: 'Peningkatan koordinasi internal, notulensi rapat, dan komunikasi organisasi yang responsif.',
          imageTone: 'neutral',
          identityNumber: '220712102',
          bio: 'Sering menangani koordinasi acara, notulensi, dan penyusunan agenda organisasi mahasiswa.',
          vision: 'Mewujudkan sekretariat UKM yang komunikatif, tertib, dan responsif pada kebutuhan anggota.',
          mission: 'Menyusun agenda rutin; mempercepat distribusi informasi; dan menjaga transparansi dokumen internal.',
        },
        {
          id: 'cand-33',
          number: '03',
          name: 'Celine Maharani',
          faculty: 'Teknik Industri ’22',
          summary: 'Digitalisasi layanan administrasi UKM dan integrasi arsip kegiatan berbasis cloud.',
          imageTone: 'neutral',
          identityNumber: '220712103',
          bio: 'Berfokus pada digitalisasi layanan internal dan efisiensi operasional organisasi mahasiswa.',
          vision: 'Mendorong sekretariat UKM yang efisien, digital, dan mudah diaudit oleh anggota.',
          mission: 'Digitalisasi administrasi; integrasi arsip cloud; dan evaluasi data kegiatan secara berkala.',
        },
      ],
      blockchainAnchor: '0x55C8D2A7B1E4F9C3D8A1B7E4F9C3D8A1B7E4F9C3D8A1B7E4F9C3D8A1B7E4F9C3',
      blockchainNetworkLabel: 'Tervalidasi pada Base Sepolia',
      turnout: {
        total: '261',
        target: '286',
        percentage: '91.2%',
        progressWidthClassName: 'w-[91.2%]',
        note: 'Data final berasal dari rekap suara yang telah diverifikasi publik.',
      },
      quickActions: sharedQuickActions,
      whitelist: createWhitelistDetail('261', '286', '0x55C8D2A7B1E4F9C3D8A1B7E4F9C3D8A1B7E4F9C3', [
        { wallet: '0x9e1...B230', name: 'Rina Oktavia', status: 'verified', addedAt: '30 Apr 2026' },
        { wallet: '0xa11...7C91', name: 'Yoga Pradana', status: 'verified', addedAt: '30 Apr 2026' },
        { wallet: '0xb4f...09a2', name: '—', status: 'pending', addedAt: 'Baru saja' },
        { wallet: '0xc22...AA81', name: 'Mita Puspa', status: 'verified', addedAt: '29 Apr 2026' },
      ]),
      parameterVoting: createParameterVotingDetail(
        '0x55C8D2A7B1E4F9C3D8A1B7E4F9C3D8A1B7E4F9C3',
        '0x55c8d2a7c1234567890abcdef1234567890abcdef1234567890abcdef1234567',
        { commitStart: '01 Mei 2026, 08:00', commitEnd: '08 Mei 2026, 18:00', revealStart: '09 Mei 2026, 09:00', revealEnd: '11 Mei 2026, 12:00' },
      ),
      realtime: createRealtimeDetail('261', '286', '91.2%', 'w-[91.2%]', [
         { candidateNumber: '01', candidateName: 'Alya Kharisma', votes: '118', percentage: '45.2%', barWidthClassName: 'w-[45.2%]', tone: 'primary' },
         { candidateNumber: '02', candidateName: 'Bagas Anindya', votes: '86', percentage: '33.0%', barWidthClassName: 'w-[33%]', tone: 'secondary' },
         { candidateNumber: '03', candidateName: 'Celine Maharani', votes: '57', percentage: '21.8%', barWidthClassName: 'w-[21.8%]', tone: 'secondary' },
      ]),
      monitoring: createMonitoringDetail({
        title: 'Detail Log Audit',
        description: 'Laporan teknis pengelolaan aktivitas pemilihan sekretaris UKM Riset.',
        currentPhase: 'ENDED',
        timeRemaining: '00:00:00',
        totalWhitelist: '286',
        totalCommits: '261',
        commitProgress: '91.2%',
        totalReveals: '261',
        totalLogs: '742',
        dateRange: '01 Mei 2026 - 11 Mei 2026',
        functionPayload: `{
  "function": "closeElection",
  "params": {
    "proposalId": 1031,
    "timestamp": 1746951611
  },
  "gasUsed": "48,550",
  "blockchain": "Base Sepolia Testnet"
}`,
        logRows: [
          { time: '11 Mei 2026', timeMeta: '17:14:50 UTC', rangeKey: 'hari-ini', category: 'Update Phase', actorName: 'UKM Riset dan Inovasi', actorWallet: '0x71c ... 4f3', action: 'Close Election', actionTone: 'blue', objectTitle: 'Pemilihan Sekretaris UKM Riset', objectMeta: 'Voting closed', status: 'selesai', hash: '0xaaa ... 120' },
          { time: '11 Mei 2026', timeMeta: '15:02:31 UTC', rangeKey: 'hari-ini', category: 'Sinkronisasi', actorName: 'Votein System', actorWallet: 'Automated (Cron)', action: 'Sync Blockchain State', actionTone: 'slate', objectTitle: 'Node UKM Riset', objectMeta: 'Final record synced', status: 'selesai', hash: '0xbbc ... 331' },
        ],
      }),
      candidateForm: {
        breadcrumbParent: 'Manajemen Pemilihan',
        breadcrumbCurrent: 'Tambah Kandidat',
        title: 'Tambah Kandidat',
        description: 'Silakan lengkapi profil calon Sekretaris UKM Riset. Sistem akan menggunakan data ini untuk publikasi kandidat dan audit internal.',
        ...sharedCandidateFormFields,
        identityPlaceholder: 'Contoh: 220712101',
        validationDescription: 'Sistem otomatis akan memverifikasi identitas kandidat',
      },
    },
  },

  /* ── #4 Ketua Divisi Acara UKM Riset 2025 · SELESAI ───────────────────── */
  {
    id: 'ketua-divisi-acara-ukm-riset-2025',
    title: 'Pemilihan Ketua Divisi Acara UKM Riset 2025',
    meta: 'Selesai 20 Sep 2025 • Partisipasi 96%',
    status: 'selesai',
    badge: 'Finalized',
    iconTone: 'blue',
    actionLabel: 'View Report',
    actionTone: 'blue',
    code: 'UKM-2025-RI-03',
    periodLabel: '12 Sep 2025 - 20 Sep 2025',
    turnoutLabel: '54 pemilih terdaftar',
    detail: {
      statusPill: 'Final',
      candidates: [
        {
          id: 'cand-ac-01',
          number: '01',
          name: 'Gina Maharani',
          faculty: 'Informatika ’23',
          summary: 'Koordinasi acara yang rapi, kreatif, dan tepat waktu untuk seluruh kegiatan UKM.',
          imageTone: 'dark',
          identityNumber: '220713021',
          bio: 'Aktif mengoordinasikan acara UKM dan terbiasa menyusun proposal kegiatan internal.',
          vision: 'Membangun divisi acara yang kreatif, tepat waktu, dan berkesan untuk anggota UKM.',
          mission: 'Menyusun kalender acara tahunan; mengelola logistik secara digital; menjaga evaluasi pasca-acara.',
        },
        {
          id: 'cand-ac-02',
          number: '02',
          name: 'Kevin Adinata',
          faculty: 'Sistem Informasi ’23',
          summary: 'Fokus pada efisiensi perencanaan dan dokumentasi progres setiap kegiatan divisi.',
          imageTone: 'neutral',
          identityNumber: '220713022',
          bio: 'Terbiasa menjadi koordinator kegiatan kampus dengan pendekatan terstruktur.',
          vision: 'Mewujudkan divisi acara yang efisien, terdokumentasi, dan mudah direplikasi.',
          mission: 'Standarisasi alur perencanaan acara; dokumentasi digital; dan pelaporan pasca-acara yang terukur.',
        },
        {
          id: 'cand-ac-03',
          number: '03',
          name: 'Laras Putri',
          faculty: 'Informatika ’23',
          summary: 'Menekankan suasana kegiatan yang inklusif, meriah, dan melibatkan seluruh anggota.',
          imageTone: 'neutral',
          identityNumber: '220713023',
          bio: 'Aktif dalam diskusi dan perencanaan kegiatan yang melibatkan banyak anggota.',
          vision: 'Mendorong divisi acara yang inklusif, meriah, dan konsisten menghadirkan kegiatan bermakna.',
          mission: 'Merencanakan acara tematik tiap semester; membuka masukan anggota; dan memastikan kegiatan berjalan tepat waktu.',
        },
      ],
      blockchainAnchor: '0x44F2B7A9C1D3E5F7A9C1D3E5F7A9C1D3E5F7A9C1D3E5F7A9C1D3E5F7A9C1D3E5',
      blockchainNetworkLabel: 'Tervalidasi pada Base Sepolia',
      turnout: {
        total: '52',
        target: '54',
        percentage: '96.3%',
        progressWidthClassName: 'w-[96.3%]',
        note: 'Pembaruan terakhir berasal dari event smart contract yang telah selesai diverifikasi.',
      },
      quickActions: sharedQuickActions,
      whitelist: createWhitelistDetail('52', '54', '0x44F2B7A9C1D3E5F7A9C1D3E5F7A9C1D3E5F7A9', [
        { wallet: '0x5f2...9A2e', name: 'Nicolas Suryanto', status: 'verified', addedAt: '10 Sep 2025' },
        { wallet: '0x6b1...3F10', name: 'Clara Mutiara', status: 'verified', addedAt: '10 Sep 2025' },
        { wallet: '0x7d9...1a55', name: '—', status: 'pending', addedAt: 'Baru saja' },
        { wallet: '0x84a...F201', name: 'Reza Hidayat', status: 'verified', addedAt: '09 Sep 2025' },
      ]),
      parameterVoting: createParameterVotingDetail(
        '0x44F2B7A9C1D3E5F7A9C1D3E5F7A9C1D3E5F7A9C1',
        '0x44f2a1c1234567890abcdef1234567890abcdef1234567890abcdef1234567',
        { commitStart: '12 Sep 2025, 08:00', commitEnd: '17 Sep 2025, 18:00', revealStart: '18 Sep 2025, 09:00', revealEnd: '20 Sep 2025, 12:00' },
      ),
      realtime: createRealtimeDetail('52', '54', '96.3%', 'w-[96.3%]', [
        { candidateNumber: '01', candidateName: 'Gina Maharani', votes: '22', percentage: '42.3%', barWidthClassName: 'w-[42.3%]', tone: 'primary' },
        { candidateNumber: '02', candidateName: 'Kevin Adinata', votes: '18', percentage: '34.6%', barWidthClassName: 'w-[34.6%]', tone: 'secondary' },
        { candidateNumber: '03', candidateName: 'Laras Putri', votes: '12', percentage: '23.1%', barWidthClassName: 'w-[23.1%]', tone: 'secondary' },
      ]),
      monitoring: createMonitoringDetail({
        title: 'Detail Log Audit',
        description: 'Rekap aktivitas finalisasi dan sinkronisasi hasil untuk audit pemilihan Ketua Divisi Acara.',
        currentPhase: 'ENDED',
        timeRemaining: '00:00:00',
        totalWhitelist: '54',
        totalCommits: '52',
        commitProgress: '96.3%',
        totalReveals: '52',
        totalLogs: '118',
        dateRange: '12 Sep 2025 - 20 Sep 2025',
        functionPayload: `{
  "function": "finalizeElection",
  "params": {
    "proposalId": 1022,
    "timestamp": 1758376812
  },
  "gasUsed": "59,208",
  "blockchain": "Base Sepolia Testnet"
}`,
        logRows: [
          { time: '20 Sep 2025', timeMeta: '18:10:14 UTC', rangeKey: 'hari-ini', category: 'Update Phase', actorName: 'UKM Riset dan Inovasi', actorWallet: '0x71c ... 4f3', action: 'Finalize Election', actionTone: 'blue', objectTitle: 'Ketua Divisi Acara UKM Riset', objectMeta: 'Result Locked', status: 'selesai', hash: '0x811 ... f90' },
          { time: '20 Sep 2025', timeMeta: '18:06:03 UTC', rangeKey: 'hari-ini', category: 'Sinkronisasi', actorName: 'Votein System', actorWallet: 'Automated (Cron)', action: 'Sync Blockchain State', actionTone: 'slate', objectTitle: 'Node UKM Riset', objectMeta: 'Final snapshot written', status: 'selesai', hash: '0x44d ... 221' },
        ],
      }),
      candidateForm: {
        breadcrumbParent: 'Manajemen Pemilihan',
        breadcrumbCurrent: 'Tambah Kandidat',
        title: 'Profil Kandidat',
        description: 'Lengkapi profil kandidat untuk pemilihan Ketua Divisi Acara UKM Riset. Pastikan identitas mahasiswa tercatat lengkap sebelum finalisasi.',
        ...sharedCandidateFormFields,
        identityPlaceholder: 'Contoh: 220713021',
        validationDescription: 'Sistem otomatis akan memverifikasi identitas kandidat',
      },
    },
  },
]

export const adminElectionFilters: Array<{ key: 'semua' | AdminElectionStatus; label: string }> = [
  { key: 'semua', label: 'Semua' },
  { key: 'aktif', label: 'Aktif' },
  { key: 'selesai', label: 'Selesai' },
]

export const adminElectionDetailTabs = [
  { id: 'kandidat', label: 'Kandidat' },
  { id: 'whitelist', label: 'Pemilih Whitelist' },
  { id: 'parameter', label: 'Parameter Voting' },
  { id: 'realtime', label: 'Real-time hasil' },
] as const

export type AdminElectionDetailTabId = (typeof adminElectionDetailTabs)[number]['id']

export function getAdminElectionById(id: string) {
  return adminElectionDummyData.find((election) => election.id === id) ?? null
}

export function getAdminElectionCandidateById(electionId: string, candidateId: string) {
  const election = getAdminElectionById(electionId)
  if (!election) return null
  return election.detail.candidates.find((candidate) => candidate.id === candidateId) ?? null
}
