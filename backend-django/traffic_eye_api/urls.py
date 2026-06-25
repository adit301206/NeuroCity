from django.urls import path
from . import views

urlpatterns = [
    path("analyze/" , views.TrafficFrameAnalysisView.as_view() , name = "traffic_frame_analysis"),
]