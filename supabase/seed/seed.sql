  insert into indexer.indexer_sync_status (
    source_key,
    chain_id,
    latest_indexed_block,
    latest_safe_block,
    head_lag_blocks,
    head_lag_seconds,
    health_status
  )
  values (
    'base-sepolia:votechain',
    84532,
    null,
    null,
    null,
    null,
    'degraded'
  )
  on conflict (source_key) do nothing;
