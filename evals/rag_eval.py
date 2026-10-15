"""Eval P3 offline: uji chunk + embed + prompt + stub tanpa butuh DB/Qdrant/Ollama.
Cara jalan: python evals/rag_eval.py
Mengukur (sederhana, tanpa LLM berbayar):
- retrieval_hit: apakah keyword expected muncul di konteks yang ter-retrieve (simulasi keyword)
- citation_format: apakah jawaban stub memuat sitasi [1]
- faithfulness_proxy: berapa % expected_keywords muncul di jawaban
Target P3: >=60% agar lolos pintu P4.
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "services", "api"))
from app.chunk import chunk_text
from app.llm import build_prompt, stub_answer

# Korpus simulasi campuran (ganti dengan dokumen asli saat eval nyata)
CORPUS = [
    {"filename": "sop_cuti.pdf", "doc_type": "sop", "chunk_index": 0,
     "text": "SOP cuti tahunan karyawan maksimal 12 hari per tahun. Prosedur pengajuan via HRD dengan formulir cuti H-7."},
    {"filename": "sop_cuti.pdf", "doc_type": "sop", "chunk_index": 1,
     "text": "Pengajuan cuti wajib persetujuan atasan langsung lalu HRD. Formulir dapat diunduh di portal internal."},
    {"filename": "faq_cs.pdf", "doc_type": "cs", "chunk_index": 0,
     "text": "Jam operasional customer service Senin-Jumat 08.00-17.00. SLA respon tiket prioritas tinggi 1 jam."},
    {"filename": "keuangan.pdf", "doc_type": "keuangan", "chunk_index": 0,
     "text": "Batas submit laporan keuangan bulanan tanggal 5 bulan berikutnya ke finance@company.id."},
]

def fake_retrieve(q, doc_type=None, limit=3):
    ql = q.lower()
    scored = []
    for c in CORPUS:
        if doc_type and c["doc_type"] != doc_type:
            continue
        overlap = len(set(ql.split()) & set(c["text"].lower().split()))
        scored.append((overlap, c))
    scored.sort(key=lambda x: -x[0])
    return [c for _, c in scored[:limit]]

def main():
    with open(os.path.join(os.path.dirname(__file__), "dataset.json")) as f:
        dataset = json.load(f)
    tot = len(dataset)
    hit = 0
    faith = 0
    cite = 0
    for item in dataset:
        hits = fake_retrieve(item["q"], item.get("doc_type"))
        ctx_text = " ".join(h["text"] for h in hits).lower()
        if any(k.lower() in ctx_text for k in item["expected_keywords"]):
            hit += 1
        prompt = build_prompt(item["q"], hits)
        assert "KONTEKS" in prompt and "PERTANYAAN" in prompt
        ans = stub_answer(item["q"], hits)
        if "[1]" in ans:
            cite += 1
        matched = sum(1 for k in item["expected_keywords"] if k.lower() in ans.lower())
        faith += matched / max(1, len(item["expected_keywords"]))
    print(f"retrieval_hit: {hit}/{tot} = {hit/tot:.0%}")
    print(f"citation_format: {cite}/{tot} = {cite/tot:.0%}")
    print(f"faithfulness_proxy: {faith/tot:.0%}")
    ok = (hit / tot) >= 0.6 and (cite / tot) >= 0.6
    print("EVAL:", "LOLOS" if ok else "BELUM LOLOS (>=60% untuk lanjut P4)")
    # uji chunk juga
    assert len(chunk_text("halo " * 500, "sop")) >= 2
    print("chunk: OK")

if __name__ == "__main__":
    main()
