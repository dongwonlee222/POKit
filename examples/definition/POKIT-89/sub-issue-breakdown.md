# 하위 이슈 분해: PO Daily News Signal

## Linear sub-issue dry-run

```text
Linear sub-issue dry-run  (parent: POKIT-89)
┌──────────────────────────────────────────────────────────────┐
│ ▸ Sub-1  설정 UX와 local config schema                        │
│   role: prd_agent  size: focused  estimate: M  parallel: yes │
│   artifact: examples/definition/POKIT-89/prd.md               │
│   external: -  idem: POKIT-89-S1-v1                           │
│                                                              │
│ ▸ Sub-2  뉴스 provider adapter와 fixture provider             │
│   role: data_contract_agent  size: focused  estimate: M       │
│   artifact: examples/definition/POKIT-89/data-contract.md     │
│   external: API key may be required  idem: POKIT-89-S2-v1     │
│                                                              │
│ ▸ Sub-3  뉴스 item normalize와 dedupe key                     │
│   role: tdd_agent  size: focused  estimate: M                 │
│   artifact: examples/definition/POKIT-89/criteria.md          │
│   external: -  idem: POKIT-89-S3-v1                           │
└──────────────────────────────────────────────────────────────┘
gates remaining: [user_approval]
write_target: Linear
```

## 공개 증거 경로

- `examples/definition/POKIT-89/prd.md`
- `examples/definition/POKIT-89/data-contract.md`
- `examples/definition/POKIT-89/criteria.md`
- `examples/definition/POKIT-89/sub-issue-breakdown.md`

## 외부 의존성과 rollback

- 실제 provider는 API key, quota, 비용 확인 전까지 blocked로 둔다.
- 실패 시 fixture provider만 유지하고 `daily_news_signal.enabled: false`로 비활성화한다.
