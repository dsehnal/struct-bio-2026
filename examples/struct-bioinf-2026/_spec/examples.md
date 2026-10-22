# The examples: checked facts

The snippets are written from these facts, which were checked against PDBe, UniProt and AFDB on 2026-10-18. Chain ids
are **auth** ids unless they say label. MVS selectors need `auth_asym_id` / `auth_seq_id` for these, and must not mix
them with `label_asym_id`.

## A. p53: from sequence to variant

- **AF-P04637-F1** (v6): `https://alphafold.ebi.ac.uk/files/AF-P04637-F1-model_v6.bcif`; the PAE is
  `…-predicted_aligned_error_v6.json`. The global pLDDT is 75.
- **UniProt P04637** regions for the tracks:
  - TADI 17–25 and TADII 48–56, inside transcription activation 1–44.
  - Disordered 50–96.
  - DNA-binding domain 102–292.
  - Nuclear localisation signal 305–321.
  - Oligomerisation 325–356.
  - Basic C-terminal region 368–387, inside disordered 351–393.
- **1TSR** (p53 core domain + DNA, X-ray):
  - Protein chains A, B and C (label C, D, E), residues about 94–289. DNA chains E and F (label A, B). One Zn per
    protein chain.
  - **Chain B** is the copy bound to the consensus site. Residues of B within 4 Å of DNA (nucleotide atoms, centre to
    centre): A119, K120, N239, S241, M243, R248, R273, C275, A276, C277, R280, R283. Mol\*'s
    `byres ((chain B and polymer.protein) within 4 of polymer.nucleic)` selects exactly these (checked 2026-10-18, after
    the `within` fix).
  - Chains A and C make fewer, non-specific contacts.
- **Hotspots**, all present in chain B:
  - **Contact mutants**: R248 and R273 touch DNA in chain B.
  - **Structural mutants**: R175, G245, R249 and R282 do not touch DNA in chain B. They hold the fold: R175 and G245
    near the Zn site and L2/L3 loops, R249 in L3, R282 in the H2 helix.
- PDB numbering in 1TSR is UniProt numbering, so the same annotation file works on AF-P04637 and 1TSR.

## B. Imatinib in ABL kinase

- **1IEP** (c-Abl kinase domain + STI-571, X-ray):
  - Protein chains A and B. Imatinib is `STI`, auth chain A residue 201 (label asym G). Use chain A.
- **Residues of chain A within 4 Å of imatinib**: L248, Y253, V256, A269, K271, E286, V289, M290, V299, I313, T315,
  F317, M318, G321, I360, H361, R362, L370, A380, D381, F382.
- **Gatekeeper**: T315 is THR in 1IEP (ABL1a numbering). DFG is D381, F382, G383 (DFG-out with imatinib). Y253 is in the
  P-loop.
- **Density**: the PDBe volume server serves 1IEP's X-ray maps (`https://www.ebi.ac.uk/pdbe/densities/x-ray/1iep`),
  checked 2026-10-17.

## C. SARS-CoV-2 spike (story)

- **6VSB** (prefusion spike, one RBD up, cryo-EM):
  - Protein chains A, B and C. NAG glycans are both carbohydrate chains (D–T) and bound NAGs on A, B and C.
- **Chain A has the RBD up**: the centre of its RBD (319–541) is 59 Å from the trimer centre, against 47 and 46 Å for B
  and C. It is also less complete (174 RBD residues modelled, against 198 and 194).
- **EMD-21375**: the map of 6VSB. The author's contour level is **0.19**. It is served by the PDBe volume server
  (`https://www.ebi.ac.uk/pdbe/densities/em/emd-21375`).
- **6M0J** (RBD + ACE2, X-ray): ACE2 is chain A, the RBD is chain E. Interface residues within 4 Å:
  - RBD: K417, G446, Y449, Y453, L455, F456, A475, F486, N487, Y489, Q493, G496, Q498, T500, N501, G502, Y505.
  - ACE2: Q24, T27, F28, D30, K31, H34, E35, E37, D38, Y41, Q42, L79, M82, Y83, N330, K353, G354, D355, R357, R393.
- **Optional story text**: N501, K417 and Q493 are positions changed in variants of concern (N501Y, K417N, Q493R in
  Omicron).

## D. Two ABL states (superposition)

- **2GQG** (ABL kinase domain + dasatinib, X-ray, active, DFG-in): chains A and B; dasatinib is `1N1`, auth chain A
  residue 501. Same numbering as 1IEP (Y253, T315, D381–F382–G383).
- **TM-align**, 2GQG chain A onto 1IEP chain A (Cα; checked 2026-10-22): TM-score 0.918, 273–274 aligned residues, RMSD
  about 5 Å over all of them (the activation loop and P-loop move). On the C-lobe core (residues 320–380 and 403–498,
  157 Cα) the two then agree to 0.55 Å.
- After the transform: F382's ring moves 8.8 Å (DFG flip), T315 stays (0.5 Å), the two drugs' centroids are 8.8 Å apart,
  Y253 (P-loop) moves 5.3 Å. T315I resists both imatinib and dasatinib.
