from rest_framework.viewsets import ModelViewSet
from .models import Project, Phase
from .serializers import ProjectSerializer, PhaseSerializer
class ProjectViewSet(ModelViewSet): queryset=Project.objects.all().order_by('-id'); serializer_class=ProjectSerializer
class PhaseViewSet(ModelViewSet): queryset=Phase.objects.all().order_by('-id'); serializer_class=PhaseSerializer
