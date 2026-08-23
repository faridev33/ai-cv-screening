from rest_framework import serializers
from .models import RecruitmentSession


class RecruitmentSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruitmentSession
        fields = ["id", "job_title", "created_at", "folder_path"]
