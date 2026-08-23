from django.urls import path
from .views import (
    SessionListCreateView, 
    SessionDetailView, 
    CriteriaView, 
    CriteriaUploadView,
    CVUploadView, 
    AIAnalysisView,
    AIRetryView,
    AIChatView,
    AICheckView
)

urlpatterns = [
    # 1. Sesi Rekrutmen
    path('sessions/', SessionListCreateView.as_view(), name='session-list-create'),
    path('sessions/<str:pk>/', SessionDetailView.as_view(), name='session-detail'),
    
    # 2. Criteria & Auto-Extract Lowongan
    path('sessions/<str:pk>/criteria/', CriteriaView.as_view(), name='session-criteria'),
    path('sessions/<str:pk>/criteria/upload/', CriteriaUploadView.as_view(), name='criteria-upload'),
    
    # 3. Upload & Retry CV Pelamar
    path('sessions/<str:pk>/upload/', CVUploadView.as_view(), name='cv-upload'),
    path('sessions/<str:pk>/retry/', AIRetryView.as_view(), name='ai-retry'),
    
    # 4. Analisa AI 3 Tabel & Chatbot Candidate Q&A
    path('sessions/<str:pk>/analyze/', AIAnalysisView.as_view(), name='ai-analyze'),
    path('sessions/<str:pk>/chat/', AIChatView.as_view(), name='ai-chat'),
    
    # 5. Tes Koneksi AI Settings
    path('check-ai/', AICheckView.as_view(), name='check-ai'),
]