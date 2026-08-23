import os
import re
import json
import shutil
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from .models import RecruitmentSession
from .serializers import RecruitmentSessionSerializer
from .utils.cv_processor import (
    convert_pdf_to_md, 
    analyze_cv_md_with_ai, 
    analyze_multi_table_with_ai,
    extract_criteria_from_job_desc_ai,
    ask_candidate_chat_ai # Import Chat Helper
)


class SessionListCreateView(APIView):
    def get(self, request):
        sessions = RecruitmentSession.objects.all().order_by('-created_at')
        serializer = RecruitmentSessionSerializer(sessions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        job_title = request.data.get('job_title')
        job_description = request.data.get('job_description', '')

        if not job_title:
            return Response({"error": "Judul pekerjaan wajib diisi"}, status=status.HTTP_400_BAD_REQUEST)

        session = RecruitmentSession.objects.create(job_title=job_title)
        base_dir = os.path.join(settings.MEDIA_ROOT, 'sessions', f"session_{session.id}")
        raw_cv_dir = os.path.join(base_dir, 'raw_cv')
        parsed_cv_dir = os.path.join(base_dir, 'parsed_cv')

        os.makedirs(raw_cv_dir, exist_ok=True)
        os.makedirs(parsed_cv_dir, exist_ok=True)

        with open(os.path.join(base_dir, 'job_desc.md'), 'w', encoding='utf-8') as f:
            f.write(f"# {job_title}\n\n{job_description}")

        with open(os.path.join(base_dir, 'criteria.json'), 'w', encoding='utf-8') as f:
            json.dump({"criteria": []}, f, indent=4, ensure_ascii=False)

        with open(os.path.join(base_dir, 'result.json'), 'w', encoding='utf-8') as f:
            json.dump({"candidates": [], "tables": None}, f, indent=4)

        session.folder_path = base_dir
        session.save()
        return Response(RecruitmentSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class SessionDetailView(APIView):
    def get(self, request, pk):
        try:
            session = RecruitmentSession.objects.get(pk=pk)
            base_dir = session.folder_path
            raw_cv_dir = os.path.join(base_dir, 'raw_cv')

            results = {"candidates": [], "tables": None}
            result_json_path = os.path.join(base_dir, 'result.json')
            if os.path.exists(result_json_path):
                with open(result_json_path, 'r', encoding='utf-8') as f:
                    try:
                        results = json.load(f)
                    except json.JSONDecodeError:
                        results = {"candidates": [], "tables": None}

            candidates_map = {}
            for c in results.get("candidates", []):
                if c.get('filename'):
                    candidates_map[c.get('filename')] = c
                    candidates_map[c.get('filename').lower()] = c
                if c.get('nama'):
                    candidates_map[c.get('nama')] = c
                    candidates_map[c.get('nama').lower()] = c
                    candidates_map[f"{c.get('nama')}.pdf"] = c
                    candidates_map[f"{c.get('nama')}.pdf".lower()] = c

            files = []
            if os.path.exists(raw_cv_dir):
                for file_name in os.listdir(raw_cv_dir):
                    if file_name.endswith('.pdf'):
                        file_path = os.path.join(raw_cv_dir, file_name)
                        file_base = os.path.splitext(file_name)[0]
                        
                        candidate_info = (
                            candidates_map.get(file_name) or
                            candidates_map.get(file_name.lower()) or
                            candidates_map.get(file_base) or
                            candidates_map.get(file_base.lower()) or
                            {}
                        )
                        
                        pdf_url = f"http://127.0.0.1:8000/media/sessions/session_{session.id}/raw_cv/{file_name}"

                        files.append({
                            "filename": file_name,
                            "pdf_url": pdf_url,
                            "size": f"{round(os.path.getsize(file_path) / 1024, 1)} KB",
                            "nama": candidate_info.get("nama") or file_base,
                            "email": candidate_info.get("email"),
                            "telepon": candidate_info.get("telepon"),
                            "domisili": candidate_info.get("domisili"),
                        })

            return Response({
                "session": RecruitmentSessionSerializer(session).data,
                "files": files,
                "candidates": results.get("candidates", []),
                "tables": results.get("tables", None)
            }, status=status.HTTP_200_OK)

        except RecruitmentSession.DoesNotExist:
            return Response({"error": "Sesi tidak ditemukan"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            session = RecruitmentSession.objects.get(pk=pk)
            new_title = request.data.get('job_title')

            if not new_title:
                return Response({"error": "Nama sesi wajib diisi"}, status=status.HTTP_400_BAD_REQUEST)

            session.job_title = new_title
            session.save()

            if session.folder_path and os.path.exists(session.folder_path):
                job_desc_path = os.path.join(session.folder_path, 'job_desc.md')
                with open(job_desc_path, 'w', encoding='utf-8') as f:
                    f.write(f"# {new_title}\n")

            return Response(RecruitmentSessionSerializer(session).data, status=status.HTTP_200_OK)
        except RecruitmentSession.DoesNotExist:
            return Response({"error": "Sesi tidak ditemukan"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            session = RecruitmentSession.objects.get(pk=pk)
            if session.folder_path and os.path.exists(session.folder_path):
                shutil.rmtree(session.folder_path)
            session.delete()
            return Response({"message": "Sesi berhasil dihapus"}, status=status.HTTP_200_OK)
        except RecruitmentSession.DoesNotExist:
            return Response({"error": "Sesi tidak ditemukan"}, status=status.HTTP_404_NOT_FOUND)


class CriteriaView(APIView):
    def get(self, request, pk):
        try:
            session = RecruitmentSession.objects.get(pk=pk)
            criteria_path = os.path.join(session.folder_path, 'criteria.json')
            
            if os.path.exists(criteria_path):
                with open(criteria_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return Response(data, status=status.HTTP_200_OK)
            return Response({"criteria": []}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, pk):
        try:
            session = RecruitmentSession.objects.get(pk=pk)
            criteria_data = request.data.get('criteria', [])
            criteria_path = os.path.join(session.folder_path, 'criteria.json')

            with open(criteria_path, 'w', encoding='utf-8') as f:
                json.dump({"criteria": criteria_data}, f, indent=4, ensure_ascii=False)

            return Response({"message": "Kriteria berhasil disimpan"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CriteriaUploadView(APIView):
    def post(self, request, pk):
        try:
            session = RecruitmentSession.objects.get(pk=pk)
            file_obj = request.FILES.get('file')
            api_key = request.data.get('api_key') or os.getenv("MY_API_KEY")
            model_name = request.data.get('model') or os.getenv("MODEL_NAME")

            if not file_obj or not file_obj.name.lower().endswith('.pdf'):
                return Response({"error": "File lowongan harus berformat PDF"}, status=status.HTTP_400_BAD_REQUEST)

            base_dir = session.folder_path
            job_desc_pdf_path = os.path.join(base_dir, 'job_desc.pdf')
            job_desc_md_path = os.path.join(base_dir, 'job_desc.md')

            with open(job_desc_pdf_path, 'wb+') as destination:
                for chunk in file_obj.chunks():
                    destination.write(chunk)

            job_desc_md_text = convert_pdf_to_md(job_desc_pdf_path, job_desc_md_path)
            extracted_data = extract_criteria_from_job_desc_ai(job_desc_md_text, api_key, model_name=model_name)

            if extracted_data and extracted_data.get("criteria"):
                criteria_list = extracted_data.get("criteria", [])
                for idx, c in enumerate(criteria_list, 1):
                    c['id'] = idx

                criteria_path = os.path.join(base_dir, 'criteria.json')
                with open(criteria_path, 'w', encoding='utf-8') as f:
                    json.dump({"criteria": criteria_list}, f, indent=4, ensure_ascii=False)

                return Response({
                    "message": f"Berhasil mengekstrak {len(criteria_list)} kriteria!",
                    "criteria": criteria_list
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Gagal mengekstrak kriteria dari PDF Lowongan"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CVUploadView(APIView):
    def post(self, request, pk):
        try:
            session = RecruitmentSession.objects.get(pk=pk)
            file_objs = request.FILES.getlist('files') or [request.FILES.get('file')]
            api_key = request.data.get('api_key') or os.getenv("MY_API_KEY")
            model_name = request.data.get('model') or os.getenv("MODEL_NAME")

            if not file_objs or not file_objs[0]:
                return Response({"error": "Tidak ada file PDF"}, status=status.HTTP_400_BAD_REQUEST)

            base_dir = session.folder_path
            raw_cv_dir = os.path.join(base_dir, 'raw_cv')
            parsed_cv_dir = os.path.join(base_dir, 'parsed_cv')
            result_json_path = os.path.join(base_dir, 'result.json')

            os.makedirs(raw_cv_dir, exist_ok=True)
            os.makedirs(parsed_cv_dir, exist_ok=True)

            existing_data = {"candidates": [], "tables": None}
            if os.path.exists(result_json_path):
                try:
                    with open(result_json_path, 'r', encoding='utf-8') as f:
                        existing_data = json.load(f)
                except json.JSONDecodeError:
                    existing_data = {"candidates": [], "tables": None}

            candidates_list = existing_data.get("candidates", [])
            processed_count = 0
            total_prompt_tokens = 0
            total_completion_tokens = 0

            for file_obj in file_objs:
                if file_obj and file_obj.name.endswith('.pdf'):
                    temp_pdf_name = file_obj.name
                    pdf_path = os.path.join(raw_cv_dir, temp_pdf_name)

                    with open(pdf_path, 'wb+') as destination:
                        for chunk in file_obj.chunks():
                            destination.write(chunk)

                    file_base = os.path.splitext(temp_pdf_name)[0]
                    md_path = os.path.join(parsed_cv_dir, f"{file_base}.md")
                    
                    cv_md_text = convert_pdf_to_md(pdf_path, md_path)
                    ai_response = analyze_cv_md_with_ai(cv_md_text, api_key, model_name=model_name)

                    eval_result = ai_response.get("result", {})
                    usage = ai_response.get("usage", {})
                    
                    total_prompt_tokens += usage.get("prompt_tokens", 0)
                    total_completion_tokens += usage.get("completion_tokens", 0)

                    if eval_result and eval_result.get("nama") and "Gagal" not in eval_result.get("nama"):
                        candidate_name = eval_result.get("nama").strip()
                        clean_name = re.sub(r'[<>:"/\\|?*]', '', candidate_name)

                        new_pdf_name = f"{clean_name}.pdf"
                        new_pdf_path = os.path.join(raw_cv_dir, new_pdf_name)
                        new_md_path = os.path.join(parsed_cv_dir, f"{clean_name}.md")

                        if pdf_path != new_pdf_path and not os.path.exists(new_pdf_path):
                            os.rename(pdf_path, new_pdf_path)
                            if os.path.exists(md_path):
                                os.rename(md_path, new_md_path)
                            eval_result['filename'] = new_pdf_name
                        else:
                            eval_result['filename'] = temp_pdf_name
                    else:
                        eval_result = eval_result or {}
                        eval_result['filename'] = temp_pdf_name

                    new_filename = eval_result.get('filename', '').lower()
                    new_nama = eval_result.get('nama', '').strip().lower()

                    candidates_list = [
                        c for c in candidates_list 
                        if c.get('filename', '').lower() != new_filename 
                        and (not new_nama or c.get('nama', '').strip().lower() != new_nama)
                    ]
                    candidates_list.append(eval_result)
                    processed_count += 1

            existing_data["candidates"] = candidates_list
            with open(result_json_path, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, ensure_ascii=False, indent=4)

            return Response({
                "message": f"{processed_count} CV berhasil diproses!",
                "usage": {
                    "prompt_tokens": total_prompt_tokens,
                    "completion_tokens": total_completion_tokens
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        try:
            session = RecruitmentSession.objects.get(pk=pk)
            file_name = request.query_params.get('file_name')

            if not file_name:
                return Response({"error": "Nama file wajib diisi"}, status=status.HTTP_400_BAD_REQUEST)

            base_dir = session.folder_path
            raw_pdf_path = os.path.join(base_dir, 'raw_cv', file_name)
            file_base_name = os.path.splitext(file_name)[0]
            parsed_md_path = os.path.join(base_dir, 'parsed_cv', f"{file_base_name}.md")

            if os.path.exists(raw_pdf_path):
                os.remove(raw_pdf_path)
            if os.path.exists(parsed_md_path):
                os.remove(parsed_md_path)

            result_json_path = os.path.join(base_dir, 'result.json')
            if os.path.exists(result_json_path):
                with open(result_json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                data["candidates"] = [c for c in data.get("candidates", []) if c.get("filename") != file_name]
                with open(result_json_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=4)

            return Response({"message": f"File {file_name} berhasil dihapus"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIRetryView(APIView):
    def post(self, request, pk):
        try:
            session = RecruitmentSession.objects.get(pk=pk)
            file_name = request.data.get('file_name')
            api_key = request.data.get('api_key') or os.getenv("MY_API_KEY")
            model_name = request.data.get('model') or os.getenv("MODEL_NAME")

            if not file_name:
                return Response({"error": "Nama file wajib diisi"}, status=status.HTTP_400_BAD_REQUEST)

            base_dir = session.folder_path
            raw_cv_dir = os.path.join(base_dir, 'raw_cv')
            parsed_cv_dir = os.path.join(base_dir, 'parsed_cv')
            result_json_path = os.path.join(base_dir, 'result.json')

            pdf_path = os.path.join(raw_cv_dir, file_name)
            file_base = os.path.splitext(file_name)[0]
            md_path = os.path.join(parsed_cv_dir, f"{file_base}.md")

            cv_md_text = convert_pdf_to_md(pdf_path, md_path)
            ai_response = analyze_cv_md_with_ai(cv_md_text, api_key, model_name=model_name)
            eval_result = ai_response.get("result", {})
            usage = ai_response.get("usage", {})

            if eval_result and eval_result.get("nama") and "Gagal" not in eval_result.get("nama"):
                candidate_name = eval_result.get("nama").strip()
                clean_name = re.sub(r'[<>:"/\\|?*]', '', candidate_name)

                new_pdf_name = f"{clean_name}.pdf"
                new_pdf_path = os.path.join(raw_cv_dir, new_pdf_name)
                new_md_path = os.path.join(parsed_cv_dir, f"{clean_name}.md")

                if pdf_path != new_pdf_path and not os.path.exists(new_pdf_path):
                    os.rename(pdf_path, new_pdf_path)
                    if os.path.exists(md_path):
                        os.rename(md_path, new_md_path)
                    eval_result['filename'] = new_pdf_name
                else:
                    eval_result['filename'] = file_name
            else:
                eval_result = eval_result or {}
                eval_result['filename'] = file_name

            existing_data = {"candidates": [], "tables": None}
            if os.path.exists(result_json_path):
                try:
                    with open(result_json_path, 'r', encoding='utf-8') as f:
                        existing_data = json.load(f)
                except json.JSONDecodeError:
                    existing_data = {"candidates": [], "tables": None}

            new_filename = eval_result.get('filename', '').lower()
            new_nama = eval_result.get('nama', '').strip().lower()

            candidates_list = [
                c for c in existing_data.get("candidates", []) 
                if c.get('filename', '').lower() != new_filename 
                and (not new_nama or c.get('nama', '').strip().lower() != new_nama)
            ]
            candidates_list.append(eval_result)
            existing_data["candidates"] = candidates_list

            with open(result_json_path, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, ensure_ascii=False, indent=4)

            return Response({
                "message": "Retry AI Berhasil!", 
                "candidate": eval_result,
                "usage": usage
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIAnalysisView(APIView):
    def post(self, request, pk):
        try:
            session = RecruitmentSession.objects.get(pk=pk)
            api_key = request.data.get('api_key') or os.getenv("MY_API_KEY")
            model_name = request.data.get('model') or os.getenv("MODEL_NAME")

            base_dir = session.folder_path
            raw_cv_dir = os.path.join(base_dir, 'raw_cv')
            parsed_cv_dir = os.path.join(base_dir, 'parsed_cv')
            job_desc_path = os.path.join(base_dir, 'job_desc.md')
            criteria_path = os.path.join(base_dir, 'criteria.json')
            result_json_path = os.path.join(base_dir, 'result.json')

            job_desc = ""
            if os.path.exists(job_desc_path):
                with open(job_desc_path, 'r', encoding='utf-8') as f:
                    job_desc = f.read()

            criteria_list = []
            if os.path.exists(criteria_path):
                with open(criteria_path, 'r', encoding='utf-8') as f:
                    criteria_list = json.load(f).get("criteria", [])

            all_cv_md_data = []
            if os.path.exists(raw_cv_dir):
                for file_name in os.listdir(raw_cv_dir):
                    if file_name.endswith('.pdf'):
                        pdf_path = os.path.join(raw_cv_dir, file_name)
                        file_base = os.path.splitext(file_name)[0]
                        md_path = os.path.join(parsed_cv_dir, f"{file_base}.md")

                        if not os.path.exists(md_path):
                            convert_pdf_to_md(pdf_path, md_path)

                        if os.path.exists(md_path):
                            with open(md_path, 'r', encoding='utf-8') as f:
                                md_text = f.read()
                                all_cv_md_data.append({
                                    "filename": file_name,
                                    "nama": file_base,
                                    "md_text": md_text
                                })

            if not all_cv_md_data:
                return Response({"error": "Belum ada file CV diunggah"}, status=status.HTTP_400_BAD_REQUEST)

            from .utils.cv_processor import analyze_multi_table_with_ai
            ai_response = analyze_multi_table_with_ai(
                all_cv_md_data, job_desc, criteria_list, api_key, model_name=model_name
            )

            if ai_response:
                table_results = ai_response.get("tables", {})
                usage = ai_response.get("usage", {})

                existing_data = {}
                if os.path.exists(result_json_path):
                    with open(result_json_path, 'r', encoding='utf-8') as f:
                        try: existing_data = json.load(f)
                        except: existing_data = {}

                existing_data["tables"] = table_results
                existing_data["candidates"] = table_results.get("tabel_kesimpulan", [])

                with open(result_json_path, 'w', encoding='utf-8') as f:
                    json.dump(existing_data, f, ensure_ascii=False, indent=4)

                return Response({
                    "tables": table_results, 
                    "candidates": table_results.get("tabel_kesimpulan", []),
                    "usage": usage
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Gagal menghasilkan 3 tabel AI"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# KELAS AIChatView UNTUK CHATBOT CANDIDATE DI DASHBOARD
class AIChatView(APIView):
    def post(self, request, pk):
        try:
            session = RecruitmentSession.objects.get(pk=pk)
            query = request.data.get('query')
            api_key = request.data.get('api_key') or os.getenv("MY_API_KEY")
            model_name = request.data.get('model') or os.getenv("MODEL_NAME")

            if not query:
                return Response({"error": "Pertanyaan wajib diisi"}, status=status.HTTP_400_BAD_REQUEST)

            from .utils.cv_processor import ask_candidate_chat_ai
            chat_response = ask_candidate_chat_ai(session.folder_path, query, api_key, model_name=model_name)

            return Response(chat_response, status=status.HTTP_200_OK)
        except RecruitmentSession.DoesNotExist:
            return Response({"error": "Sesi tidak ditemukan"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AICheckView(APIView):
    def post(self, request):
        try:
            api_key = request.data.get('api_key') or os.getenv("MY_API_KEY")
            selected_model = request.data.get('model') or "qwen/qwen3.8-max"

            if not api_key:
                return Response({
                    "status": "error",
                    "message": "API Key belum diisi di file .env atau Pengaturan!"
                }, status=status.HTTP_400_BAD_REQUEST)

            import requests
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": selected_model,
                "messages": [{"role": "user", "content": "Tes koneksi AI"}],
                "max_tokens": 10
            }

            res = requests.post(url, json=payload, headers=headers, timeout=15)
            if res.status_code == 200:
                return Response({
                    "status": "connected",
                    "message": f"🟢 AI Model ({selected_model}) Berhasil Terhubung & Aktif!",
                    "model": selected_model
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "status": "error",
                    "message": f"🔴 Gagal API ({res.status_code}): {res.text}"
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                "status": "error",
                "message": f"🔴 Gagal terhubung ke AI: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)