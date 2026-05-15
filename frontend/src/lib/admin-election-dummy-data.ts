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

function createParameterVotingDetail(address: string, hash: string): AdminElectionRecord['detail']['parameterVoting'] {
  return {
    phaseTitle: 'Konfigurasi Fase Blockchain',
    phaseDescription: 'Pengaturan waktu sinkronisasi state ledger',
    phaseOne: {
      label: 'Commit Phase',
      start: '24 Nov 2024, 08:00',
      end: '25 Nov 2024, 18:00',
    },
    phaseTwo: {
      label: 'Reveal Phase',
      start: '25 Nov 2024, 18:01',
      end: '26 Nov 2024, 12:00',
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
          title: 'Zero-Knowledge Proofs (ZK-Proof)',
          description: 'Verifikasi suara sah dilakukan tanpa membuka identitas pemilih di dalam ledger publik.',
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
      title: 'Mainnet Active',
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
  functionPayload: string
  logRows: AdminElectionRecord['detail']['monitoring']['logRows']
}): AdminElectionRecord['detail']['monitoring'] {
  return {
    ...config,
    dateRange: '01 Jan 2024 - 15 Jan 2024',
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

export const adminElectionDummyData: AdminElectionRecord[] = [
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
      quickActions: [
        { label: 'Unduh', icon: 'download' },
        { label: 'Bagikan Link', icon: 'share' },
        { label: 'Audit Log', icon: 'audit' },
        { label: 'Laporan Live', icon: 'report' },
      ],
      whitelist: createWhitelistDetail(String(sharedDummyContext.voterEstimate), String(sharedDummyContext.voterEstimate), '0x71C7656EC7ab88b098defB75', [
        { wallet: '0x3fA...8dE2', name: 'Ahmad Zulfikar', status: 'verified', addedAt: '12 Mei 2024' },
        { wallet: '0x921...72C1', name: 'Maria Clarissa', status: 'verified', addedAt: '12 Mei 2024' },
        { wallet: '0xb42...D9a1', name: '—', status: 'pending', addedAt: 'Baru saja' },
        { wallet: '0x77c...E55a', name: 'Bambang Wijaya', status: 'verified', addedAt: '11 Mei 2024' },
      ]),
      parameterVoting: createParameterVotingDetail(sharedDummyContext.contractAddress, '0x892a3c71c1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
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
        functionPayload: `{
  "function": "setVotingPhase",
  "params": {
    "proposalId": 882,
    "newPhase": "OPEN_VOTING",
    "timestamp": 1705069205,
    "adminSignature": "0x...f2a91"
  },
  "gasUsed": "82,410",
  "blockchain": "Base Mainnet"
}`,
        logRows: [
          { time: '12 Jan 2024', timeMeta: '14:20:05 UTC', rangeKey: 'hari-ini', category: 'Update Phase', actorName: 'Nadia Prasetyo', actorWallet: '0x71c ... 4f3', action: 'Update Smart Contract Phase', actionTone: 'blue', objectTitle: 'Proposal UKM RI', objectMeta: 'ID: UKM-RI-01', status: 'selesai', hash: '0x9f2 ... e32' },
          { time: '12 Jan 2024', timeMeta: '10:05:12 UTC', rangeKey: 'hari-ini', category: 'Whitelist', actorName: 'Raka Mahendra', actorWallet: '0x3A2 ... 9d1', action: 'Add Whitelist Bulk', actionTone: 'amber', objectTitle: 'UKM Riset dan Inovasi', objectMeta: '64 Addresses Added', status: 'berlangsung', hash: '0x12b ... f88' },
          { time: '11 Jan 2024', timeMeta: '22:15:30 UTC', rangeKey: '7-hari', category: 'Sinkronisasi', actorName: 'Votein System', actorWallet: 'Automated (Cron)', action: 'Sync Blockchain State', actionTone: 'slate', objectTitle: 'Main Relay Node', objectMeta: 'RPC Timeout Error', status: 'menunggu', hash: 'N/A (Pending)' },
          { time: '11 Jan 2024', timeMeta: '09:12:00 UTC', rangeKey: '7-hari', category: 'Kandidat', actorName: 'Salsa Widyaningrum', actorWallet: '0x3A2 ... 9d1', action: 'Edit Profile Candidate', actionTone: 'purple', objectTitle: 'Kandidat #03', objectMeta: 'Updated IPFS Hash', status: 'selesai', hash: '0x7d1 ... a44' },
        ],
      }),
      candidateForm: {
        breadcrumbParent: 'Manajemen Pemilihan',
        breadcrumbCurrent: 'Tambah Kandidat',
        title: 'Profil Kandidat',
        description: 'Silakan lengkapi informasi detail kandidat untuk pemilihan Koordinator UKM Riset dan Inovasi. Pastikan data akurat sebelum sinkronisasi dummy on-chain.',
        uploadLabel: 'Foto Kandidat',
        uploadHint: 'Seret foto ke sini atau klik untuk unggah',
        uploadSupport: 'JPG, PNG (Maks 5MB)',
        identityLabel: 'ID Pemilih / NPM',
        identityPlaceholder: 'Contoh: 220711663',
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
        validationDescription: 'Sistem otomatis akan memverifikasi NPM kandidat',
        validationStatus: 'Berlangsung',
      },
    },
  },
  {
    id: 'ketua-bem-fti-2026',
    title: 'Pemilihan Ketua BEM FTI 2026',
    meta: 'Reveal berlangsung • 418 dari 520 pemilih sudah commit',
    status: 'aktif',
    badge: 'Fase Aktif: Reveal',
    iconTone: 'emerald',
    actionLabel: 'Monitor Phase',
    actionTone: 'indigo',
    secondaryActionLabel: 'Kandidat',
    code: 'SPC-2026-014',
    periodLabel: '24 Okt 2026 - 30 Okt 2026',
    turnoutLabel: '520 pemilih terdaftar',
    commits: {
      total: '418',
      target: '520',
      hash: '0x91a...c7f2',
      revealStart: 'Sedang Berjalan',
      integrity: 'On-Chain Aktif',
    },
    detail: {
      statusPill: 'Berlangsung',
      candidates: [
        {
          id: 'cand-11',
          number: '01',
          name: 'Nanda Putri',
          faculty: 'Teknik Industri ’22',
          summary: 'Program kerja berbasis data untuk memperkuat layanan akademik dan kegiatan mahasiswa FTI.',
          imageTone: 'neutral',
          identityNumber: '220712001',
          bio: 'Fokus pada optimalisasi layanan akademik dan kegiatan mahasiswa dengan pendekatan terukur.',
          vision: 'Membangun BEM FTI yang efisien, terukur, dan berdampak langsung pada kebutuhan mahasiswa.',
          mission: 'Mengintegrasikan evaluasi kegiatan berbasis data; memetakan prioritas mahasiswa; dan memperkuat koordinasi unit kerja.',
        },
        {
          id: 'cand-12',
          number: '02',
          name: 'Rizky Samudra',
          faculty: 'Informatika ’21',
          summary: 'Arah organisasi yang fokus pada inovasi digital, keberlanjutan kegiatan, dan kolaborasi komunitas.',
          imageTone: 'dark',
          identityNumber: '220712002',
          bio: 'Pengembang inisiatif digital kampus dengan minat pada keberlanjutan organisasi.',
          vision: 'Menjadikan BEM FTI sebagai ekosistem inovasi digital yang berkelanjutan dan kolaboratif.',
          mission: 'Membangun platform informasi terpusat; menjaga kesinambungan program; dan memperkuat sinergi komunitas teknologi.',
        },
        {
          id: 'cand-13',
          number: '03',
          name: 'Aulia Fadhilah',
          faculty: 'Arsitektur ’21',
          summary: 'Mendorong kepengurusan yang lebih terbuka, cepat, dan dekat dengan kebutuhan mahasiswa sehari-hari.',
          imageTone: 'neutral',
          identityNumber: '220712003',
          bio: 'Aktif dalam pengorganisasian kegiatan kampus dengan fokus pada layanan yang responsif.',
          vision: 'Mewujudkan kepengurusan yang cepat, terbuka, dan benar-benar dekat dengan kehidupan mahasiswa.',
          mission: 'Menyederhanakan birokrasi internal; membuka kanal umpan balik real-time; dan mempercepat tindak lanjut isu mahasiswa.',
        },
        {
          id: 'cand-14',
          number: '04',
          name: 'Satria Dharma',
          faculty: 'Teknik Sipil ’20',
          summary: 'Kepemimpinan yang responsif melalui penguatan komunikasi, transparansi anggaran, dan evaluasi program.',
          imageTone: 'dark',
          identityNumber: '220712004',
          bio: 'Menekankan kepemimpinan yang tanggap dan akuntabel di seluruh unit organisasi.',
          vision: 'Membangun organisasi mahasiswa yang dipercaya melalui komunikasi yang jelas dan akuntabilitas anggaran.',
          mission: 'Mempublikasikan laporan berkala; memperkuat evaluasi program; dan menyusun strategi komunikasi yang konsisten.',
        },
      ],
      blockchainAnchor: '0x91A7FA8D5C2B7E4A1F9C3D7B2E4A1F9C3D7B2E4A1F9C3D7B2E4A1F9C3D7B2E4',
      blockchainNetworkLabel: 'Tervalidasi pada Base Sepolia',
      turnout: {
        total: '418',
        target: '520',
        percentage: '80.3%',
        progressWidthClassName: 'w-[80.3%]',
        note: 'Pembaruan reveal mengikuti event kontrak dan penghitungan final berlangsung real-time.',
      },
      quickActions: [
        { label: 'Unduh', icon: 'download' },
        { label: 'Bagikan Link', icon: 'share' },
        { label: 'Audit Log', icon: 'audit' },
        { label: 'Laporan Live', icon: 'report' },
      ],
      whitelist: createWhitelistDetail('418', '520', '0x91A7FA8D5C2B7E4A1F9C3D7B2E4A1F9C3D7B2E4', [
        { wallet: '0x18A...E123', name: 'Nadia Prasetyo', status: 'verified', addedAt: '20 Okt 2026' },
        { wallet: '0x29B...91af', name: 'Rama Mahesa', status: 'verified', addedAt: '20 Okt 2026' },
        { wallet: '0x3c1...7a22', name: 'Sinta Laras', status: 'pending', addedAt: 'Baru saja' },
        { wallet: '0x42d...c8f0', name: 'Fajar Nugroho', status: 'verified', addedAt: '19 Okt 2026' },
      ]),
      parameterVoting: createParameterVotingDetail('0x91A7FA8D5C2B7E4A1F9C3D7B2E4A1F9C3D7B2E4A', '0x991b3d55c1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
      realtime: createRealtimeDetail('418', '520', '80.3%', 'w-[80.3%]', [
        { candidateNumber: '01', candidateName: 'Nanda Putri', votes: '182', percentage: '43.5%', barWidthClassName: 'w-[43.5%]', tone: 'primary' },
        { candidateNumber: '02', candidateName: 'Rizky Samudra', votes: '146', percentage: '34.9%', barWidthClassName: 'w-[34.9%]', tone: 'secondary' },
        { candidateNumber: '03', candidateName: 'Aulia Fadhilah', votes: '90', percentage: '21.5%', barWidthClassName: 'w-[21.5%]', tone: 'secondary' },
      ]),
      monitoring: createMonitoringDetail({
        title: 'Detail Log Audit',
        description: 'Laporan aktivitas teknis terenkripsi dan perubahan status sistem pada Smart Contract Votein.',
        currentPhase: 'REVEAL',
        timeRemaining: '05:11:18',
        totalWhitelist: '520',
        totalCommits: '418',
        commitProgress: '80%',
        totalReveals: '186',
        totalLogs: '964',
        functionPayload: `{
  "function": "revealVote",
  "params": {
    "proposalId": 914,
    "candidateId": 2,
    "timestamp": 1730056210
  },
  "gasUsed": "64,901",
  "blockchain": "Base Mainnet"
}`,
        logRows: [
          { time: '24 Okt 2026', timeMeta: '16:14:11 UTC', rangeKey: 'hari-ini', category: 'Update Phase', actorName: 'Rama Aditya', actorWallet: '0x9bc ... 11f', action: 'Reveal Vote', actionTone: 'blue', objectTitle: 'Vote #204', objectMeta: 'Candidate #02', status: 'selesai', hash: '0x1ab ... 991' },
          { time: '24 Okt 2026', timeMeta: '14:05:45 UTC', rangeKey: 'hari-ini', category: 'Kandidat', actorName: 'Nanda Putri', actorWallet: '0x18A ... E123', action: 'Edit Candidate Profile', actionTone: 'purple', objectTitle: 'Candidate #01', objectMeta: 'Updated manifesto', status: 'selesai', hash: '0x2bc ... 118' },
          { time: '23 Okt 2026', timeMeta: '19:42:01 UTC', rangeKey: '7-hari', category: 'Update Phase', actorName: 'Admin FTI', actorWallet: '0x22d ... ac2', action: 'Open Reveal Phase', actionTone: 'blue', objectTitle: 'Election #914', objectMeta: 'Reveal Enabled', status: 'berlangsung', hash: '0x4c1 ... a88' },
        ],
      }),
      candidateForm: {
        breadcrumbParent: 'Manajemen Pemilihan',
        breadcrumbCurrent: 'Tambah Kandidat',
        title: 'Profil Kandidat',
        description: 'Lengkapi identitas dan visi kandidat untuk pemilihan BEM FTI. Semua data akan disiapkan untuk sinkronisasi on-chain setelah disimpan.',
        uploadLabel: 'Foto Kandidat',
        uploadHint: 'Seret foto ke sini atau klik untuk unggah',
        uploadSupport: 'JPG, PNG (Maks 5MB)',
        identityLabel: 'ID Pemilih / NPM',
        identityPlaceholder: 'Contoh: 220711234',
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
        validationDescription: 'Sistem otomatis akan memverifikasi NPM kandidat',
        validationStatus: 'Berlangsung',
      },
    },
  },
  {
    id: 'dean-selection-autumn',
    title: 'Pemilihan Kepala Divisi Program UKM Riset 2025',
    meta: 'Selesai 20 Sep 2024 • Partisipasi 98%',
    status: 'selesai',
    badge: 'Finalized',
    iconTone: 'blue',
    actionLabel: 'View Report',
    actionTone: 'blue',
    code: 'SPC-2024-022',
    periodLabel: '12 Sep 2024 - 20 Sep 2024',
    turnoutLabel: '4,500 pemilih terdaftar',
    detail: {
      statusPill: 'Final',
      candidates: [
        {
          id: 'cand-21',
          number: '01',
          name: 'Prof. Rina Kusuma',
          faculty: 'Manajemen Pendidikan',
          summary: 'Visi kepemimpinan berbasis kualitas akademik, kolaborasi lintas fakultas, dan tata kelola kampus yang terbuka.',
          imageTone: 'dark',
          identityNumber: '198805102014041001',
          bio: 'Akademisi dengan fokus pada tata kelola pendidikan tinggi dan kolaborasi lintas disiplin.',
          vision: 'Mendorong kampus yang unggul melalui tata kelola akademik yang terbuka dan kolaboratif.',
          mission: 'Memperkuat mutu pembelajaran; memperluas kolaborasi riset; dan membangun budaya kerja institusional yang akuntabel.',
        },
        {
          id: 'cand-22',
          number: '02',
          name: 'Dr. Arif Santoso',
          faculty: 'Kebijakan Publik',
          summary: 'Fokus pada penguatan tata kelola institusi, akuntabilitas, dan inovasi layanan pendidikan tinggi.',
          imageTone: 'neutral',
          identityNumber: '197909182009121003',
          bio: 'Berpengalaman dalam kebijakan publik dan inovasi layanan institusional.',
          vision: 'Menciptakan kepemimpinan kampus yang akuntabel, modern, dan berorientasi layanan.',
          mission: 'Menyederhanakan proses institusional; memperkuat sistem evaluasi; dan memperluas inovasi layanan akademik.',
        },
      ],
      blockchainAnchor: '0x44F2B7A9C1D3E5F7A9C1D3E5F7A9C1D3E5F7A9C1D3E5F7A9C1D3E5F7A9C1D3E5',
      blockchainNetworkLabel: 'Tervalidasi pada Base Sepolia',
      turnout: {
        total: '1,248',
        target: '4,500',
        percentage: '27.7%',
        progressWidthClassName: 'w-[27.7%]',
        note: 'Pembaruan terakhir berasal dari event smart contract yang telah selesai diverifikasi.',
      },
      quickActions: [
        { label: 'Unduh', icon: 'download' },
        { label: 'Bagikan Link', icon: 'share' },
        { label: 'Audit Log', icon: 'audit' },
        { label: 'Laporan Live', icon: 'report' },
      ],
      whitelist: createWhitelistDetail('1,248', '4,500', '0x44F2B7A9C1D3E5F7A9C1D3E5F7A9C1D3E5F7A9', [
        { wallet: '0x5f2...9A2e', name: 'Prof. Darmawan', status: 'verified', addedAt: '18 Sep 2024' },
        { wallet: '0x6b1...3F10', name: 'Clara Mutiara', status: 'verified', addedAt: '18 Sep 2024' },
        { wallet: '0x7d9...1a55', name: '—', status: 'pending', addedAt: 'Baru saja' },
        { wallet: '0x84a...F201', name: 'Reza Hidayat', status: 'verified', addedAt: '17 Sep 2024' },
      ]),
      parameterVoting: createParameterVotingDetail('0x44F2B7A9C1D3E5F7A9C1D3E5F7A9C1D3E5F7A9C1', '0x44f2a1c1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
      realtime: createRealtimeDetail('1.248', '4.500', '27.7%', 'w-[27.7%]', [
        { candidateNumber: '01', candidateName: 'Prof. Rina Kusuma', votes: '712', percentage: '57.1%', barWidthClassName: 'w-[57.1%]', tone: 'primary' },
        { candidateNumber: '02', candidateName: 'Dr. Arif Santoso', votes: '536', percentage: '42.9%', barWidthClassName: 'w-[42.9%]', tone: 'secondary' },
      ]),
      monitoring: createMonitoringDetail({
        title: 'Detail Log Audit',
        description: 'Rekap aktivitas finalisasi dan sinkronisasi hasil untuk audit pasca-pemilihan.',
        currentPhase: 'ENDED',
        timeRemaining: '00:00:00',
        totalWhitelist: '4,500',
        totalCommits: '1,248',
        commitProgress: '27.7%',
        totalReveals: '1,248',
        totalLogs: '2,418',
        functionPayload: `{
  "function": "finalizeElection",
  "params": {
    "proposalId": 1022,
    "timestamp": 1726840812
  },
  "gasUsed": "59,208",
  "blockchain": "Base Mainnet"
}`,
        logRows: [
          { time: '20 Sep 2024', timeMeta: '18:10:14 UTC', rangeKey: 'hari-ini', category: 'Update Phase', actorName: 'Panel Admin', actorWallet: '0x7fd ... 883', action: 'Finalize Election', actionTone: 'blue', objectTitle: 'Pemilihan Kepala Divisi Riset Internal', objectMeta: 'Result Locked', status: 'selesai', hash: '0x811 ... f90' },
          { time: '20 Sep 2024', timeMeta: '18:06:03 UTC', rangeKey: 'hari-ini', category: 'Sinkronisasi', actorName: 'Votein System', actorWallet: 'Automated (Cron)', action: 'Sync Blockchain State', actionTone: 'slate', objectTitle: 'Base Relay Node', objectMeta: 'Final snapshot written', status: 'selesai', hash: '0x44d ... 221' },
        ],
      }),
      candidateForm: {
        breadcrumbParent: 'Manajemen Pemilihan',
        breadcrumbCurrent: 'Tambah Kandidat',
        title: 'Profil Kandidat',
        description: 'Lengkapi profil kandidat untuk pemilihan Kepala Divisi Program UKM Riset. Pastikan identitas kandidat tercatat lengkap sebelum finalisasi.',
        uploadLabel: 'Foto Kandidat',
        uploadHint: 'Seret foto ke sini atau klik untuk unggah',
        uploadSupport: 'JPG, PNG (Maks 5MB)',
        identityLabel: 'ID Pemilih / NIP',
        identityPlaceholder: 'Contoh: 198805102014041001',
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
        validationDescription: 'Sistem otomatis akan memverifikasi identitas kandidat',
        validationStatus: 'Berlangsung',
      },
    },
  },
  {
    id: 'pemilihan-kaprodi-informatika',
    title: 'Pemilihan Sekretaris UKM Riset 2025',
    meta: 'Selesai 11 Mei 2026 • Partisipasi 91%',
    status: 'selesai',
    badge: 'Finalized',
    iconTone: 'blue',
    actionLabel: 'View Report',
    actionTone: 'blue',
    code: 'SPC-2026-031',
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
          identityNumber: '198702112010121002',
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
          identityNumber: '198609102011122001',
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
          identityNumber: '198412212008121004',
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
      quickActions: [
        { label: 'Unduh', icon: 'download' },
        { label: 'Bagikan Link', icon: 'share' },
        { label: 'Audit Log', icon: 'audit' },
        { label: 'Laporan Live', icon: 'report' },
      ],
      whitelist: createWhitelistDetail('261', '286', '0x55C8D2A7B1E4F9C3D8A1B7E4F9C3D8A1B7E4F9C3', [
        { wallet: '0x9e1...B230', name: 'Rina Oktavia', status: 'verified', addedAt: '10 Mei 2026' },
        { wallet: '0xa11...7C91', name: 'Yoga Pradana', status: 'verified', addedAt: '10 Mei 2026' },
        { wallet: '0xb4f...09a2', name: '—', status: 'pending', addedAt: 'Baru saja' },
        { wallet: '0xc22...AA81', name: 'Mita Puspa', status: 'verified', addedAt: '09 Mei 2026' },
      ]),
      parameterVoting: createParameterVotingDetail('0x55C8D2A7B1E4F9C3D8A1B7E4F9C3D8A1B7E4F9C3', '0x55c8d2a7c1234567890abcdef1234567890abcdef1234567890abcdef1234567'),
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
        functionPayload: `{
  "function": "closeElection",
  "params": {
    "proposalId": 1031,
    "timestamp": 1746951611
  },
  "gasUsed": "48,550",
  "blockchain": "Base Mainnet"
}`,
        logRows: [
          { time: '11 Mei 2026', timeMeta: '17:14:50 UTC', rangeKey: 'hari-ini', category: 'Update Phase', actorName: 'Panitia UKM', actorWallet: '0x18f ... 772', action: 'Close Election', actionTone: 'blue', objectTitle: 'Pemilihan Sekretaris UKM', objectMeta: 'Voting closed', status: 'selesai', hash: '0xaaa ... 120' },
          { time: '11 Mei 2026', timeMeta: '15:02:31 UTC', rangeKey: 'hari-ini', category: 'Sinkronisasi', actorName: 'Votein System', actorWallet: 'Automated (Cron)', action: 'Sync Blockchain State', actionTone: 'slate', objectTitle: 'Department Node', objectMeta: 'Final record synced', status: 'selesai', hash: '0xbbc ... 331' },
        ],
      }),
      candidateForm: {
        breadcrumbParent: 'Manajemen Pemilihan',
        breadcrumbCurrent: 'Tambah Kandidat',
        title: 'Tambah Kandidat',
        description: 'Silakan lengkapi profil calon Sekretaris UKM Riset. Sistem akan menggunakan data ini untuk publikasi kandidat dan audit internal.',
        uploadLabel: 'Foto Kandidat',
        uploadHint: 'Seret foto ke sini atau klik untuk unggah',
        uploadSupport: 'JPG, PNG (Maks 5MB)',
        identityLabel: 'ID Pemilih / NIP',
        identityPlaceholder: 'Contoh: 198702112010121002',
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
        validationDescription: 'Sistem otomatis akan memverifikasi identitas kandidat',
        validationStatus: 'Berlangsung',
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
