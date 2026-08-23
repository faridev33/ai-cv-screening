import os
import re
import json
import requests
import fitz # PyMuPDF
import pymupdf4llm
from dotenv import load_dotenv

load_dotenv()

# IMPORT SAFE JSON_REPAIR
try:
    import json_repair
    HAS_JSON_REPAIR = True
except ImportError:
    HAS_JSON_REPAIR = False
    print("⚠️ Warning: Library 'json_repair' belum terinstall. Jalankan: pip install json-repair")


def safe_parse_json(text: str) -> dict:
    cleaned = clean_json_response(text)
    if HAS_JSON_REPAIR:
        return json_repair.loads(cleaned)
    else:
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as err:
            cleaned_fixed = re.sub(r',\s*([}\]])', r'\1', cleaned)
            return json.loads(cleaned_fixed)


# PROMPT 1: EKSTRAKSI KONTAK & IDENTITAS (SINGLE CV)
SYSTEM_PROMPT_SINGLE = """Anda adalah HR Assistant AI yang ahli dalam mengekstrak data faktual dari CV pelamar.

ATURAN KETAT:
1. HANYA kembalikan objek JSON MENTAH.
2. JANGAN gunakan markdown, JANGAN gunakan ```json, JANGAN beri teks pembuka/penutup.
3. Jika data tidak ada, gunakan null untuk string atau [] untuk array. JANGAN mengarang data.
4. Gunakan bahasa Indonesia yang ringkas dan profesional.

STRUKTUR JSON WAJIB:
{
  "nama": "string",
  "email": "string",
  "telepon": "string",
  "domisili": "string",
  "pendidikan": [{"jenjang": "string", "institusi": "string", "jurusan": "string", "tahun": "string"}],
  "pengalaman_profesi": [{"posisi": "string", "perusahaan": "string", "durasi_bulan": 0, "deskripsi_singkat": "string"}],
  "keahlian": {"hard_skills": [], "soft_skills": []}
}"""


# PROMPT 2: EVALUASI 3 TABEL KOMPARATIF (MULTI CV)
SYSTEM_PROMPT_MULTI_TABLE = """Anda adalah HR Director & Senior AI Recruiter Expert yang KRITIS, TAJAM, SANGAT OBJEKTIF, dan TELITI. 
Tugas Anda adalah membandingkan seluruh CV Pelamar secara simultan terhadap Lowongan Kerja & Kriteria, lalu menghasilkan 3 TABEL EVALUASI MATRIKS.

ATURAN EVALUASI SANGAT KETAT:
1. HANYA kembalikan objek JSON MENTAH tanpa markdown / tanpa ```json.
2. JANGAN PERNAH MENGOSONGKAN BARIS EVALUASI APAPUN! Setiap poin kualifikasi & tanggung jawab WAJIB dievaluasi untuk SETIAP pelamar.
3. Aturan Penggunaan Simbol Evaluasi:
   - "✔️" : Pelamar MEMENUHI SYARAT SECARA EKSPLISIT dan JELAS tertera di CV.
   - "⚠️" : Pelamar HANYA MEMENUHI SEBAGIAN (misal: S1 masih berjalan, pengalaman kurang dari syarat minimal, atau software tertentu TIDAK ditulis di CV).
   - "❌" : Pelamar TIDAK MEMENUHI syarat sama sekali.
4. KONSISTENSI SKOR: Jumlah simbol ⚠️ dan ❌ pada Tabel 1 & 2 HARUS BERBANDING LURUS dengan pengurangan skor fit_score di Tabel 3.
5. Status rekomendasi pada Tabel 3 harus salah satu dari: "LOLOS (Rekomendasi Utama)", "LOLOS (Rekomendasi Kedua)", "LOLOS (Kandidat Cadangan)", atau "TIDAK LOLOS".

STRUKTUR JSON WAJIB:
{
  "tabel_kualifikasi": [
    {
      "no": 1,
      "persyaratan": "Degree in architecture, interior design, or a related field",
      "evaluasi": [
        {"nama": "Bayu", "simbol": "✔️", "catatan": "S1 Arsitektur Lulus"},
        {"nama": "Mohamad", "simbol": "⚠️", "catatan": "S1 Arsitektur (Sedang berjalan)"}
      ]
    }
  ],
  "tabel_tanggung_jawab": [
    {
      "no": 1,
      "tanggung_jawab": "Membuat & Mengembangkan Konsep Desain",
      "evaluasi": [
        {"nama": "Bayu", "simbol": "✔️", "catatan": "Sangat Berpengalaman"},
        {"nama": "Mohamad", "simbol": "⚠️", "catatan": "Pengalaman Terbatas"}
      ]
    }
  ],
  "tabel_kesimpulan": [
    {
      "rank": 1,
      "nama": "BAYU",
      "fit_score": 95,
      "catatan_utama": "Lulusan S1, pengalaman >5 tahun, menguasai seluruh software termasuk Revit.",
      "status_seleksi": "LOLOS (Rekomendasi Utama)"
    }
  ]
}"""


# PROMPT 3: EKSTRAKSI OTOMATIS KRITERIA DARI PDF LOWONGAN
SYSTEM_PROMPT_EXTRACT_CRITERIA = """Anda adalah HR Specialist AI yang ahli dalam menganalisis dokumen Lowongan Kerja / Job Description.
Tugas Anda adalah membaca dokumen Lowongan Kerja dan mengekstrak SELURUH Kualifikasi (Requirements) dan Tanggung Jawab (Responsibilities) menjadi daftar terstruktur lengkap dengan Skala Prioritas Kepentingan (1 - 10).

ATURAN KETAT:
1. HANYA kembalikan objek JSON MENTAH tanpa markdown / tanpa ```json.
2. Ekstrak SEMUA kualifikasi dan tanggung jawab yang ada di dokumen. JANGAN ADA YANG TERLEWAT.
3. Berikan skala prioritas (weight) angka 1-10 untuk setiap kriteria berdasarkan tingkat kepentingannya.

STRUKTUR JSON WAJIB:
{
  "criteria": [
    {
      "id": 1,
      "type": "kualifikasi",
      "title": "Degree in architecture, interior design, or a related field",
      "weight": 9
    }
  ]
}"""


# PROMPT 4: AI CANDIDATE CHATBOT
SYSTEM_PROMPT_CHAT = """Anda adalah AI Recruiter Expert & Candidate Q&A Assistant yang cerdas.
Tugas Anda adalah menjawab pertanyaan HR mengenai kandidat pelamar berdasarkan data evaluasi hasil screening (3 Tabel Matriks & Data Profil Pelamar).

ATURAN KETAT:
1. Jawab secara ringkas, profesional, objektif, dan faktual berdasarkan data kandidat yang diberikan.
2. JANGAN mengarang informasi yang tidak tertera di data kandidat.
3. Gunakan Bahasa Indonesia yang sopan, jelas, dan terstruktur.
"""


def clean_json_response(text: str) -> str:
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        parts = text.split("```")
        if len(parts) >= 3:
            text = parts[1]

    start_idx = text.find('{')
    end_idx = text.rfind('}')

    if start_idx != -1 and end_idx != -1:
        text = text[start_idx:end_idx + 1]

    return text.strip()


def convert_pdf_to_md(pdf_path: str, output_md_path: str) -> str:
    try:
        md_text = pymupdf4llm.to_markdown(pdf_path)
        if not md_text or len(md_text.strip()) < 50:
            doc = fitz.open(pdf_path)
            extracted_pages = []
            for page_num, page in enumerate(doc, 1):
                page_text = page.get_text().strip()
                if page_text:
                    extracted_pages.append(f"--- Halaman {page_num} ---\n{page_text}")
                else:
                    extracted_pages.append(f"--- Halaman {page_num} (Portofolio Visual) ---\n[Halaman ini berisi gambar/scan]")
            md_text = "\n\n".join(extracted_pages) or f"# Dokumen Gambar: {os.path.basename(pdf_path)}"

        os.makedirs(os.path.dirname(output_md_path), exist_ok=True)
        with open(output_md_path, "w", encoding="utf-8") as f:
            f.write(md_text)
        return md_text
    except Exception as e:
        print(f"Error PyMuPDF4LLM: {e}")
        return f"# Dokumen: {os.path.basename(pdf_path)}"


def analyze_cv_md_with_ai(cv_md_text: str, api_key: str = None, model_name: str = None) -> dict:
    final_api_key = api_key or os.getenv("MY_API_KEY")
    final_model = model_name or os.getenv("MODEL_NAME", "qwen/qwen3.8-max")

    if not final_api_key:
        return {"result": {"nama": "Kandidat (API Key Kosong)", "email": None, "telepon": None}, "usage": {}}

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {final_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AI CV Extractor"
    }

    payload = {
        "model": final_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT_SINGLE},
            {"role": "user", "content": f"CV PELAMAR:\n---\n{cv_md_text}\n---"}
        ],
        "temperature": 0.1,
        "max_tokens": 2000
    }

    try:
        res = requests.post(url, json=payload, headers=headers, timeout=120)
        if res.status_code == 200:
            res_data = res.json()
            raw_content = res_data["choices"][0]["message"]["content"]
            usage_data = res_data.get("usage", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0})
            
            parsed_json = safe_parse_json(raw_content)
            return {"result": parsed_json, "usage": usage_data}
        else:
            print(f"OpenRouter API Error {res.status_code}: {res.text}")
    except Exception as e:
        print(f"Error OpenRouter Single CV: {e}")

    return {"result": {"nama": "Kandidat (Gagal AI)", "email": None, "telepon": None}, "usage": {}}


def analyze_multi_table_with_ai(all_cv_md_data: list, job_desc_text: str, criteria_list: list, api_key: str = None, model_name: str = None) -> dict:
    final_api_key = api_key or os.getenv("MY_API_KEY")
    final_model = model_name or os.getenv("MODEL_NAME", "qwen/qwen3.8-max")

    if not final_api_key or not all_cv_md_data:
        return None

    combined_cvs_text = ""
    for idx, cv in enumerate(all_cv_md_data, 1):
        combined_cvs_text += f"\n\n=== CV PELAMAR #{idx}: {cv['nama']} ===\n{cv['md_text']}\n"

    criteria_text = json.dumps(criteria_list, ensure_ascii=False, indent=2)

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {final_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AI Multi-Table CV Evaluator"
    }

    user_message = f"""JOB DESCRIPTION & PERSYARATAN:
---
{job_desc_text}
---

DAFTAR KRITERIA PENILAIAN & PRIORITAS:
---
{criteria_text}
---

DAFTAR SELURUH CV PELAMAR:
---
{combined_cvs_text}
---

PETUNJUK EVALUASI KRITIS:
1. Evaluasi SETIAP baris persyaratan dan tanggung jawab untuk SETIAP kandidat. JANGAN PERNAH MENGOSONGKAN BARIS MANAPUN!
2. Berikan simbol ✔️, ⚠️, atau ❌ secara kritis.
3. Hasilkan 3 Tabel Komparatif dalam format JSON sesuai struktur wajib."""

    payload = {
        "model": final_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT_MULTI_TABLE},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.0,
        "max_tokens": 16000
    }

    try:
        print(f"🤖 [OPENROUTER API] Multi-Table Model: {final_model} (Max Tokens: 16000)...")
        res = requests.post(url, json=payload, headers=headers, timeout=240)
        if res.status_code == 200:
            res_data = res.json()
            raw_content = res_data["choices"][0]["message"]["content"]
            usage_data = res_data.get("usage", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0})
            
            parsed_json = safe_parse_json(raw_content)
            return {"tables": parsed_json, "usage": usage_data}
        else:
            print(f"OpenRouter Multi-Table Error {res.status_code}: {res.text}")
    except Exception as e:
        print(f"Error Koneksi Multi-Table AI: {e}")

    return None


def extract_criteria_from_job_desc_ai(job_desc_md_text: str, api_key: str = None, model_name: str = None) -> dict:
    final_api_key = api_key or os.getenv("MY_API_KEY")
    final_model = model_name or os.getenv("MODEL_NAME", "qwen/qwen3.8-max")

    if not final_api_key or not job_desc_md_text:
        return None

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {final_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AI Criteria Extractor"
    }

    payload = {
        "model": final_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT_EXTRACT_CRITERIA},
            {"role": "user", "content": f"DOKUMEN LOWONGAN KERJA:\n---\n{job_desc_md_text}\n---"}
        ],
        "temperature": 0.1,
        "max_tokens": 4000
    }

    try:
        print(f"🤖 [EKSTRAKSI KRITERIA] Membaca PDF Lowongan dengan {final_model}...")
        res = requests.post(url, json=payload, headers=headers, timeout=120)
        if res.status_code == 200:
            raw_content = res.json()["choices"][0]["message"]["content"]
            return safe_parse_json(raw_content)
        else:
            print(f"OpenRouter Criteria Error {res.status_code}: {res.text}")
    except Exception as e:
        print(f"Error Ekstraksi Kriteria AI: {e}")

    return None


# FUNGSI BARU: CHATBOT AI CANDIDATE Q&A
def ask_candidate_chat_ai(session_dir: str, query: str, api_key: str = None, model_name: str = None) -> dict:
    final_api_key = api_key or os.getenv("MY_API_KEY")
    final_model = model_name or os.getenv("MODEL_NAME", "qwen/qwen3.8-max")

    if not final_api_key or not query:
        return {"reply": "API Key atau pertanyaan tidak boleh kosong.", "usage": {}}

    result_json_path = os.path.join(session_dir, 'result.json')
    candidates_data = []
    tables_data = None

    if os.path.exists(result_json_path):
        try:
            with open(result_json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                candidates_data = data.get("candidates", [])
                tables_data = data.get("tables", None)
        except Exception as e:
            print(f"Error reading result.json: {e}")

    context_data = {
        "candidates_summary": candidates_data,
        "evaluation_tables": tables_data
    }
    context_text = json.dumps(context_data, ensure_ascii=False, indent=2)

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {final_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AI Candidate Chat Assistant"
    }

    user_prompt = f"""DATA EVALUASI KANDIDAT SESI INI:
---
{context_text}
---

PERTANYAAN HR:
{query}

Jawab pertanyaan HR di atas secara presisi berdasarkan data kandidat sesi ini."""

    payload = {
        "model": final_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT_CHAT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 2000
    }

    try:
        print(f"🤖 [CHATBOT AI] Menjawab pertanyaan HR dengan model {final_model}...")
        res = requests.post(url, json=payload, headers=headers, timeout=90)
        if res.status_code == 200:
            res_data = res.json()
            reply_text = res_data["choices"][0]["message"]["content"]
            usage_data = res_data.get("usage", {})
            return {
                "reply": reply_text,
                "usage": usage_data
            }
        else:
            return {"reply": f"🔴 API Error ({res.status_code}): {res.text}", "usage": {}}
    except Exception as e:
        return {"reply": f"🔴 Gagal terhubung ke AI: {str(e)}", "usage": {}}