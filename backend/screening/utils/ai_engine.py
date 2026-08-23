import json
import google.generativeai as genai


def analyze_cv_with_gemini(job_desc, cv_text, api_key):
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""
        Anda adalah seorang AI Recruiter Specialist. 
        Tugas Anda adalah mengevaluasi CV kandidat berikut berdasarkan Job Description.

        --- JOB DESCRIPTION ---
        {job_desc}

        --- CV KANDIDAT ---
        {cv_text}

        --- INSTRUKSI ---
        Evaluasi kandidat dan berikan output HANYA dalam format JSON valid berikut (tanpa markdown/teks tambahan):
        {{
            "name": "Nama Kandidat dari CV (atau Nama File jika tidak ada)",
            "score": 85,
            "status": "Lolos / Dipertimbangkan / Ditolak",
            "summary": "Ringkasan evaluasi 1-2 kalimat",
            "strengths": ["kelebihan 1", "kelebihan 2"],
            "weaknesses": ["catatan/kekurangan 1"]
        }}
        """

        response = model.generate_content(prompt)
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)

    except Exception as e:
        print(f"AI Error: {e}")
        return None
