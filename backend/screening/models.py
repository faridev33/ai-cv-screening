import uuid
from django.db import models


class RecruitmentSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job_title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    folder_path = models.CharField(max_length=500, blank=True)

    def __str__(self):
        return self.job_title
