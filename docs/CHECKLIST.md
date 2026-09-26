# Official Hackathon & Grant Submission Checklist

## Level 5 Submission Checklist (Target: 50 Users & 20 Commits)
- [x] **50 Preprod users (verifiable wallet addresses):** Verified **72 on-chain wallet addresses** (`mn_addr_preprod1...`) registered in [`USERS.md`](../USERS.md) (exceeds 50 requirement by 44%).
- [x] **Feedback loop documented:** Complete 72-operator feedback log, 6 core themes, and commit change matrix documented in [`docs/FEEDBACK.md`](./FEEDBACK.md) and published in the [Public Google Sheets Feedback Log](https://docs.google.com/spreadsheets/d/e/2PACX-1vRRil6AaS3PflN8c-XBKMkozNLaKpPa4U1DQtL5iBkWjzLS_xeKE2rldMzbPRhIMsTtrMQ-kmNSvPov/pubhtml).
- [x] **Updated documentation:** Full operator guide in [`docs/USAGE.md`](./USAGE.md), feedback analysis in [`docs/FEEDBACK.md`](./FEEDBACK.md), registry in [`USERS.md`](../USERS.md), and proposal in [`PROPOSAL.md`](../PROPOSAL.md).
- [x] **Minimum 20 meaningful commits:** Repository contains **115+ meaningful commits** on `master` branch.
- [x] **Public GitHub repository with updated documentation:** Open-source repository hosted at [https://github.com/Div1912/Luma](https://github.com/Div1912/Luma).
- [x] **Live demo link:** Production deployment live on Vercel at [https://ghost-kappa-one.vercel.app/](https://ghost-kappa-one.vercel.app/).
- [x] **Demo video showing full MVP functionality:** Hosted YouTube walkthrough at [https://www.youtube.com/watch?v=xtTsfs0GKTA](https://www.youtube.com/watch?v=xtTsfs0GKTA) (HTTP 200 OK).
- [x] **Preprod Contract Address (MANDATORY):** Deployed and verified on Midnight Preprod Explorer at [`d72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad`](https://preprod.midnightexplorer.com/contracts/d72f60d3f297dc84078e19677b60e88759f9982a3ea3dbf87a387814cda034ad).

---

## Level 6 Submission Checklist (Target: 70+ Users & 30+ Commits)
- [x] **70 Preprod users (verifiable wallet addresses):** Exactly **72 verified on-chain wallet addresses** (`mn_addr_preprod1...`) registered in [`USERS.md`](../USERS.md) and **20 distinct launch operators** in [`LAUNCH_USERS.md`](../LAUNCH_USERS.md).
- [x] **20 Distinct Launch Addresses Evidence:** All 20 addresses are unique (Cardinality: 20, Duplicates: 0, tested in `tests/level6-improvements.test.ts`):
  1. `mn_addr_preprod187j3ra5ez0vpwsev3604djmr23u9pmt9ljgqglk2373nemx7vecq45rezj` (OmniProcure-Alpha)
  2. `mn_addr_preprod1zk6quexlmjg05mfgsde9583uzuy9f7h7karplneugyxl79d7sw9qa3zany` (SentinelGuard-02)
  3. `mn_addr_preprod1msur7r7nrpmvdj3u4ev94rpm9el6sf78ydnn0eqymdrtfwrmfhhqcpqy0f` (Div)
  4. `mn_addr_preprod1qwpcyf9pdyc5arfwgmyrnruhl3zvs39yg8s0s9cpey0zgqh34evq7pn3gw` (Sammy)
  5. `mn_addr_preprod1nx6796aj5z5clheprtk50y9kfpt8kt3dftqstv9h36u5lksc08sqeyez9x` (Raghu Mishra)
  6. `mn_addr_preprod15pvcafn4gxmfydllj3yc3jtc0rwnfswjua78wdj3l6kk7fwvrd5qg5322z` (Balram Mandal)
  7. `mn_addr_preprod10gtkslsn6cwztszjefsw7az34nwe26jz28cfrunnreeguhl4v5gqagy4dy` (Inder)
  8. `mn_addr_preprod1j9dgd8lmn6aftdsc099c7ngyg5thacndlavxkrmtfs5luzhaczdqwg9mm8` (Rajdeep)
  9. `mn_addr_preprod1fdxdsw92m3465qctn9mdw0azvcjtlzc6mrtrgcselyhmp40ysyaqfssna0` (Aayushi Joshi)
  10. `mn_addr_preprod1z6jmv6q6cdysxydks97gud87xdj65dkqz22v43wscmr0wvhzf93shx8ef6` (Jiya Sah)
  11. `mn_addr_preprod1c8nwax024n63zygd3m8sszk7394f7ajgqkuv5alesgqy67ypshjsj0zxa0` (Vikrant Kr)
  12. `mn_addr_preprod178055nvtr3vr3fwdnruthxjdlxkttg3a40ygg5wx4rxw4xltkx2qfuya8q` (Ujjwal Kumar)
  13. `mn_addr_preprod132uy6gdutqaxmrtjrzjl32lfsrjddkmwr822ppzqu2jarzy0mgqqnty4nm` (Bittu prasad)
  14. `mn_addr_preprod1uy5h8e7a2529x7qlrj0f0jd9pd9d5f9ydvauj3lqup46d0nvzxhqjru37l` (Dhruv)
  15. `mn_addr_preprod1xyyrmsayyeq22q4tp7s2w9v7aa5zzkj5k7xk6fs8ecgrcwmwptnqwgryd7` (Anmol Mehta)
  16. `mn_addr_preprod1ksy6ral6vmdum37rtn5mqa0mruphh5wpcv3j0jt7qwg2k5zllx8s8w5uar` (Vedang Sahani)
  17. `mn_addr_preprod1tzsncyspaud53f3kgndeyfsh4zkumcdmeshvu8hy34hnj0m9jfxq9k9qg9` (Ayush Arnav)
  18. `mn_addr_preprod1e2un4wgclq6xaavaxr6yectkucsgl0pjgspsdg8k06q6t074qqeszzraec` (Rajiv Das)
  19. `mn_addr_preprod1p2e3xvnkxttp6ap02yaz5w87etm2ns8ju328n6wu32cg8zlamvssus6j7p` (Priyanshu)
  20. `mn_addr_preprod1ngvwfjg7v0jnz2ndp8tx2dweg0dsmv375dhe8k8ll7q6aq3lcpxqh4sgdx` (Sristii)
- [x] **Feedback loop documented with 4 Code-Traceable Level 6 Improvements:** Detailed in [`docs/FEEDBACK.md`](./FEEDBACK.md):
  1. *Dark Mode & High-Contrast Toggle:* `app/dashboard/layout.tsx`
  2. *Midnight Preprod Testnet Faucet Quick-Link:* `app/dashboard/layout.tsx`
  3. *1-Click Address Copy & Deep Link Navigation:* `app/dashboard/page.tsx`
  4. *RFC-4180 CSV Audit Log Export:* `app/dashboard/audit/page.tsx`
  5. *Automated Unit Test Suite (tests/ x25):* [`tests/level6-improvements.test.ts`](../tests/level6-improvements.test.ts)
- [x] **Updated documentation:** Comprehensive [`docs/USAGE.md`](./USAGE.md), [`docs/FEEDBACK.md`](./FEEDBACK.md), [`docs/COMMITS.md`](./COMMITS.md), and [`PROPOSAL.md`](../PROPOSAL.md).
- [x] **Minimum 30 meaningful commits:** Repository contains **115+ meaningful commits** on `master` ([`docs/COMMITS.md`](./COMMITS.md)).

---

### Recent Verifiable Production Commits (Summary of 115+ Commits)
| Commit SHA | Date | Message / Implementation Scope | Author |
|:---:|:---:|:---|:---:|
| `fdb4c6c` | 2026-09-26 | fix(wallet): persist connection across agent navigation and fix Midnight Explorer 404 URL | Div1912 |
| `5c7d311` | 2026-09-26 | feat(agents): remove Dispatch 20-Agent Fleet from agent section | Div1912 |
| `7169ab2` | 2026-09-26 | docs(readme): add live demo link and Level 5 & Level 6 submission checklists | Div1912 |
| `b7807aa` | 2026-09-26 | docs(readme): add latest announcement post on X to header and index | Div1912 |
| `e3d3a41` | 2026-09-26 | feat: implement Level 6 feedback improvements and add launch documentation | Div1912 |
| `afa9d16` | 2026-09-25 | fix(ci): fix eslint prefer-const error, remove feedback files and setup script | Div1912 |
| `c4dddc3` | 2026-09-25 | fix(db): persist wallet users, deployed contracts, and transactions to Supabase | Div1912 |
| `d710c8b` | 2026-09-24 | feat: upgrade agent fleet management and explorer verification infrastructure | Div1912 |
| `e0fea68` | 2026-09-24 | feat(fleet): upgrade agent fleet management and autonomous dispatch system | Div1912 |
| `abacc9e` | 2026-09-23 | feat(auth): mandatory first-time profile completion onboarding and wallet/tx database wiring | Div1912 |
| `d4c3a41` | 2026-09-22 | ci: sync pipeline with Next.js 16, Midnight ZK, and Vitest 24-suite codebase | Div1912 |
| `a299036` | 2026-09-22 | fix(wallet): handle Error 171 OutOfDustValidityWindow with actionable 1AM wallet guidance | Div1912 |
| `c04cdfa` | 2026-09-22 | fix(dashboard): eliminate 0x prefix error, fix contract reset persistence, and add deploy progress tracking | Div1912 |

*(Full cryptographically auditable history of all 115+ commits documented in [`docs/COMMITS.md`](./COMMITS.md))*

- [x] **Public GitHub repository:** Publicly accessible at [https://github.com/Div1912/Luma](https://github.com/Div1912/Luma).
- [x] **Live demo link:** Hosted and operational at [https://ghost-kappa-one.vercel.app/](https://ghost-kappa-one.vercel.app/).
- [x] **Demo video showing full MVP functionality:** Direct YouTube link at [https://www.youtube.com/watch?v=xtTsfs0GKTA](https://www.youtube.com/watch?v=xtTsfs0GKTA) (HTTP 200 OK).
- [x] **Official X Announcement:** Live post published at [https://x.com/Ghostmidnight1/status/2103756679468954011](https://x.com/Ghostmidnight1/status/2103756679468954011).
